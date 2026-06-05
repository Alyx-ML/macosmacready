// ==========================================
// --- 9. SteamDB Games Portal Engine ---
// ==========================================

// Real Steam AppIDs for tracked Mac-relevant games
const TRACKED_APPIDS = [];

// Cache to avoid re-fetching on filter changes
let gamesCache = [];
let gamesLoaded = false;
let gamesLoading = false;

let currentGameFilter = "trending";
let currentGameCompat = "all";
let currentGameGenre = "all";
let gameSearchQuery = "";

// Map ProtonDB tier to compatibility label/class
function protonTierToCompat(tier, hasNativeMac) {
  if (hasNativeMac) return { label: "Native macOS", cls: "native" };
  if (!tier || tier === "pending" || tier === "borked") return { label: "Unsupported", cls: "unsupported" };
  if (tier === "platinum") return { label: "CrossOver Perfect", cls: "perfect" };
  if (tier === "gold")     return { label: "CrossOver Perfect", cls: "perfect" };
  if (tier === "silver")   return { label: "CrossOver Playable", cls: "playable" };
  if (tier === "bronze")   return { label: "CrossOver Playable", cls: "playable" };
  return { label: "Unsupported", cls: "unsupported" };
}

async function fetchGameData(appid, titleFallback) {
  const result = {
    id: `game-${appid}`,
    appid,
    title: titleFallback,
    rating: null,
    activePlayers: null,
    peakPlayers: null,
    owners: null,
    price: null,
    discount: 0,
    compatibility: "unsupported",
    compatLabel: "Unknown",
    genres: [],
    trending: false,
    popular: false,
    topRated: false,
    hasNativeMac: false,
    protonTier: null,
    protonScore: null,
    protonTotal: null,
    protonConfidence: null,
    cover: `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
    storeUrl: `https://store.steampowered.com/app/${appid}/`,
    protonUrl: `https://www.protondb.com/app/${appid}`,
    steamdbUrl: `https://steamdb.info/app/${appid}/`,
    description: "",
    developer: "",
    publisher: "",
    video: "",
    screenshots: [],
    cpu: "",
    gpu: "",
    ram: "",
    os: "",
    reviewTitle: "",
    reviewExcerpt: ""
  };

  try {
    // SteamSpy API — public, no key required
    const spyRes = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${appid}`);
    if (spyRes.ok) {
      const spy = await spyRes.json();
      result.title = spy.name || titleFallback;
      result.activePlayers = spy.ccu || null;
      result.peakPlayers = spy.peak_ccu || null;
      result.owners = spy.owners || null;
      result.price = spy.price ? (parseInt(spy.price) / 100) : null;
      result.discount = spy.discount ? parseInt(spy.discount) : 0;
      const pos = spy.positive || 0;
      const neg = spy.negative || 0;
      if (pos + neg > 0) {
        result.rating = Math.round((pos / (pos + neg)) * 100);
      }
      result.genres = spy.genre ? spy.genre.split(", ").slice(0, 3) : [];
    }
  } catch (e) {
    console.warn(`SteamSpy failed for ${appid}:`, e.message);
  }

  try {
    // ProtonDB public API
    const pdbRes = await fetch(`https://www.protondb.com/api/v1/reports/summaries/${appid}.json`);
    if (pdbRes.ok) {
      const pdb = await pdbRes.json();
      result.protonTier = pdb.tier || null;
      result.protonScore = pdb.score || null;
      result.protonTotal = pdb.total || null;
      result.protonConfidence = pdb.confidence || null;
      if (result.rating === null && pdb.score) {
        result.rating = Math.round(pdb.score * 100);
      }
    }
  } catch (e) {
    console.warn(`ProtonDB failed for ${appid}:`, e.message);
  }

  try {
    // Steam Store via allorigins proxy - request full details
    const storeRes = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://store.steampowered.com/api/appdetails?appids=${appid}&filters=platforms,genres,screenshots,movies,short_description,developers,publishers`)}`
    );
    if (storeRes.ok) {
      const json = await storeRes.json();
      const parsed = JSON.parse(json.contents);
      const data = parsed?.[appid]?.data;
      if (data) {
        if (data.platforms?.mac) result.hasNativeMac = true;
        if (data.genres) {
          result.genres = data.genres.map(g => g.description).slice(0, 3);
        }
        if (data.short_description) {
          result.description = data.short_description;
        }
        if (data.developers) {
          result.developer = data.developers.join(", ");
        }
        if (data.publishers) {
          result.publisher = data.publishers.join(", ");
        }
        if (data.screenshots && data.screenshots.length > 0) {
          result.screenshots = data.screenshots.map(s => s.path_full);
        }
        if (data.movies && data.movies.length > 0) {
          result.video = data.movies[0].mp4?.max || data.movies[0].webm?.max || result.video;
        }
      }
    }
  } catch (e) {
    console.warn(`Steam storefront details failed for ${appid}:`, e.message);
  }

  // Derive compatibility from ProtonDB + native Mac flag
  const compat = protonTierToCompat(result.protonTier, result.hasNativeMac);
  result.compatibility = compat.cls;
  result.compatLabel = compat.label;

  result.trending = result.activePlayers !== null;
  result.popular = result.owners !== null;
  result.topRated = result.rating !== null && result.rating >= 85;

  return result;
}

async function loadAllGamesData() {
  if (gamesLoaded || gamesLoading) return;
  gamesLoading = true;

  const grid = document.getElementById("games-grid");
  if (grid) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; gap: 12px;">
        <svg class="update-sync-icon syncing" style="width: 28px; height: 28px; opacity: 0.6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        <p style="font-size: 12px; opacity: 0.5; font-weight: 500;">Fetching live SteamSpy &amp; ProtonDB data&hellip;</p>
      </div>
    `;
  }

  const results = await Promise.allSettled(
    TRACKED_APPIDS.map(({ appid, title }) => fetchGameData(appid, title))
  );

  gamesCache = results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);

  // Sort by CCU descending
  gamesCache.sort((a, b) => (b.activePlayers || 0) - (a.activePlayers || 0));

  gamesCache.forEach((g, i) => {
    g.trending = i < 7;
    g.popular = i < 8;
  });

  gamesLoaded = true;
  gamesLoading = false;
  renderGamesView();
  updateSteamStats();
  initGameModalEvents();
}

function updateSteamStats() {
  const totalOnlineEl = document.getElementById("games-total-online");
  const totalPlayingEl = document.getElementById("games-total-playing");
  if (gamesCache.length === 0) return;

  const totalCcu = gamesCache.reduce((sum, g) => sum + (g.activePlayers || 0), 0);
  const nativeMacCount = gamesCache.filter(g => g.hasNativeMac).length;

  if (totalOnlineEl) totalOnlineEl.textContent = totalCcu.toLocaleString() + " CCU";
  if (totalPlayingEl) totalPlayingEl.textContent = `${nativeMacCount}/${gamesCache.length} Native Mac`;
}

function renderGamesView() {
  const grid = document.getElementById("games-grid");
  if (!grid) return;

  if (!gamesLoaded && !gamesLoading) {
    loadAllGamesData();
    return;
  }
  if (gamesLoading && gamesCache.length === 0) return;

  let filtered = [...gamesCache];

  if (currentGameFilter === "trending") {
    filtered = filtered.filter(g => g.trending);
  } else if (currentGameFilter === "popular") {
    filtered = filtered.filter(g => g.popular);
  } else if (currentGameFilter === "top-rated") {
    filtered = filtered.filter(g => g.topRated);
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (currentGameCompat !== "all") {
    filtered = filtered.filter(g => g.compatibility === currentGameCompat);
  }

  if (currentGameGenre !== "all") {
    filtered = filtered.filter(g => 
      g.genres.some(genre => genre.toLowerCase() === currentGameGenre.toLowerCase())
    );
  }

  if (gameSearchQuery.trim() !== "") {
    const q = gameSearchQuery.toLowerCase();
    filtered = filtered.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.genres.some(genre => genre.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px; width: 100%;">
        <h3>No Games Found</h3>
        <p>Try refining your search query or compatibility filters.</p>
      </div>
    `;
    return;
  }

  let html = "";
  filtered.forEach(game => {
    const formattedPrice = game.price === null ? "" : game.price === 0 ? "Free" : `$${game.price.toFixed(2)}`;
    let priceHtml = "";
    if (game.price !== null) {
      if (game.discount > 0) {
        const finalPrice = game.price * (1 - game.discount / 100);
        priceHtml = `
          <span class="discount-pill">-${game.discount}%</span>
          <span class="game-price" style="text-decoration: line-through; opacity: 0.5; font-size: 10px; margin-right: 4px;">$${game.price.toFixed(2)}</span>
          <span class="game-price" style="color: #a3ff00; font-weight: 700;">$${finalPrice.toFixed(2)}</span>
        `;
      } else {
        priceHtml = `<span class="game-price">${formattedPrice}</span>`;
      }
    }

    const ratingHtml = game.rating !== null
      ? `<span class="game-card-rating">${game.rating}% Rating</span>`
      : `<span class="game-card-rating" style="opacity:0.4;">No rating data</span>`;

    const ccuHtml = game.activePlayers !== null
      ? `<span>&#x1F7E2; ${game.activePlayers.toLocaleString()} CCU</span>`
      : `<span style="opacity:0.4;">Player data unavailable</span>`;

    const protonHtml = game.protonTier ? `
      <div class="game-card-proton">
        <span class="proton-badge proton-${game.protonTier}">${game.protonTier}</span>
      </div>
    ` : "";

    const nativeBadge = game.hasNativeMac
      ? `<span class="native-mac-pill">Native Mac</span>`
      : "";

    html += `
      <div class="game-card" data-id="${game.id}">
        <div class="game-card-cover">
          <img src="${game.cover}" alt="${game.title}" loading="lazy"
               onerror="this.src='https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/capsule_616x353.jpg'">
          <span class="compat-badge ${game.compatibility}">${game.compatLabel}</span>
          ${nativeBadge}
        </div>
        <div class="game-card-body">
          <h4 class="game-card-title">${game.title}</h4>
          <div class="game-card-players">${ccuHtml}</div>
          ${protonHtml}
          <div class="game-card-rating-row">
            ${ratingHtml}
            <div class="game-card-pricing">${priceHtml}</div>
          </div>
          <div class="game-card-links">
            <a href="${game.storeUrl}" target="_blank" class="game-link-btn" onclick="event.stopPropagation()">Steam</a>
            <a href="${game.protonUrl}" target="_blank" class="game-link-btn" onclick="event.stopPropagation()">ProtonDB</a>
            <a href="${game.steamdbUrl}" target="_blank" class="game-link-btn" onclick="event.stopPropagation()">SteamDB</a>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;

  // Re-bind click event listeners to entire cards and spotlight cursor tracking
  grid.querySelectorAll(".game-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".game-card-links") || e.target.closest("a")) return;
      const id = card.getAttribute("data-id");
      openGameDetails(id);
    });

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);

      const rotateX = ((y - rect.height / 2) / rect.height) * -8;
      const rotateY = ((x - rect.width / 2) / rect.width) * 8;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

function filterGames(query) {
  gameSearchQuery = query;
  renderGamesView();
}

// --- macOS Quick Look Game Details Modal Implementation ---
function openGameDetails(id) {
  const game = gamesCache.find(g => g.id === id);
  if (!game) return;

  const modal = document.getElementById("game-detail-modal");
  const card = document.getElementById("game-detail-card");
  if (!modal) return;

  // Basic info text mapping
  document.getElementById("game-modal-header-title").textContent = `${game.title} - Quick Look`;
  document.getElementById("game-detail-title").textContent = game.title;
  document.getElementById("game-detail-developer").textContent = `${game.developer} | Published by ${game.publisher}`;
  document.getElementById("game-detail-desc").textContent = game.description;

  const buyBtn = document.getElementById("game-detail-buy-btn");
  if (buyBtn) buyBtn.href = game.storeUrl;

  // Price formatting
  const formattedPrice = game.price === null ? "N/A" : game.price === 0 ? "Free" : `$${game.price.toFixed(2)}`;
  let priceText = formattedPrice;
  if (game.price !== null && game.discount > 0) {
    const finalPrice = game.price * (1 - game.discount / 100);
    priceText = `$${finalPrice.toFixed(2)} (-${game.discount}%)`;
  }
  document.getElementById("game-detail-price").textContent = priceText;

  // Set links
  document.getElementById("game-side-link-steam").href = game.storeUrl;
  document.getElementById("game-side-link-proton").href = game.protonUrl;
  document.getElementById("game-side-link-steamdb").href = game.steamdbUrl;

  // Genres / tags pills
  const tagsContainer = document.getElementById("game-detail-tags");
  if (tagsContainer) {
    tagsContainer.innerHTML = game.genres.map(g => `<span class="tag-pill">${g}</span>`).join("") || `<span class="tag-pill">Game</span>`;
  }

  // SteamDB statistics row mapping
  document.getElementById("game-detail-active-players").innerHTML = game.activePlayers !== null 
    ? `&#x1F7E2; ${game.activePlayers.toLocaleString()} CCU` 
    : "Offline";
  document.getElementById("game-detail-peak-players").textContent = game.peakPlayers !== null 
    ? game.peakPlayers.toLocaleString() 
    : "N/A";
  document.getElementById("game-detail-rating").textContent = game.rating !== null 
    ? `${game.rating}% Positive` 
    : "No rating data";
  const ratingBar = document.getElementById("game-detail-rating-bar");
  if (ratingBar) {
    ratingBar.style.width = game.rating !== null ? `${game.rating}%` : "0%";
  }

  // Compatibility styling
  const compatDot = document.getElementById("game-detail-compat-dot");
  const compatLabel = document.getElementById("game-detail-compat-label");
  if (compatDot && compatLabel) {
    compatDot.className = "compat-indicator-dot";
    compatDot.classList.add(game.compatibility);
    compatLabel.textContent = game.compatLabel;
  }

  // Specs hardware check mapping
  const specsContainer = document.getElementById("hardware-match-card");
  if (specsContainer) {
    const hardwareMatchText = game.hasNativeMac
      ? `<strong style="color: #34c759;">✓ Compatible natively with Apple Silicon (M1/M2/M3)</strong>`
      : `<strong style="color: #ff9500;">⚠ Runs via CrossOver Translation Environment</strong>`;
    
    specsContainer.innerHTML = `
      <div style="margin-bottom: 6px;">${hardwareMatchText}</div>
      <div style="opacity: 0.65; font-size: 10px; display: flex; flex-direction: column; gap: 2px;">
        <span><strong>OS:</strong> ${game.os}</span>
        <span><strong>Processor:</strong> ${game.cpu}</span>
        <span><strong>Graphics:</strong> ${game.gpu}</span>
        <span><strong>Memory:</strong> ${game.ram}</span>
      </div>
    `;
  }

  // Video trailer / Fallback Hero image mapping
  const video = document.getElementById("game-detail-video");
  const imgFallback = document.getElementById("game-detail-fallback-hero");
  if (video && imgFallback) {
    if (game.video) {
      video.classList.remove("hidden");
      imgFallback.classList.add("hidden");
      video.src = game.video;
      video.load();
      video.play().catch(e => console.log("Trailer autoplay blocked", e));
    } else {
      video.classList.add("hidden");
      video.pause();
      video.src = "";
      imgFallback.classList.remove("hidden");
      imgFallback.src = game.cover;
    }
  }

  // Screenshots carousel
  const ssWrapper = document.getElementById("game-screenshots-wrapper");
  if (ssWrapper) {
    if (game.screenshots && game.screenshots.length > 0) {
      ssWrapper.innerHTML = game.screenshots.map(src => `<img src="${src}" alt="Screenshot" onerror="this.remove()">`).join("");
    } else {
      ssWrapper.innerHTML = `<p style="font-size:11px; opacity:0.5; padding:12px;">No screenshots available.</p>`;
    }
  }

  // Editorial news review connection integration
  const reviewCard = document.getElementById("game-detail-review-card");
  if (reviewCard) {
    let matchedArticle = null;
    // Search global articles for reviews
    if (window.articles) {
      matchedArticle = window.articles.find(a => 
        (a.title.toLowerCase().includes(game.title.toLowerCase()) || 
         game.title.toLowerCase().includes(a.title.toLowerCase())) &&
        (a.category === "science" || a.title.toLowerCase().includes("review"))
      );
    }
    
    if (matchedArticle) {
      reviewCard.classList.remove("hidden");
      const excerptEl = document.getElementById("game-detail-review-excerpt");
      if (excerptEl) excerptEl.textContent = `"${matchedArticle.subtitle.substring(0, 80)}..."`;
      
      const readReviewBtn = document.getElementById("game-detail-read-review-btn");
      if (readReviewBtn) {
        readReviewBtn.onclick = () => {
          closeGameDetails();
          // Switch to reviews category feed and open the reader overlay
          if (window.switchApp) {
            window.switchApp("news");
            window.currentCategory = "science";
            if (window.renderFeed) window.renderFeed();
          }
          if (window.openArticle) {
            window.openArticle(matchedArticle.id);
          }
        };
      }
    } else if (game.reviewTitle) {
      // If we have local hardcoded reviews in fallback data
      reviewCard.classList.remove("hidden");
      const excerptEl = document.getElementById("game-detail-review-excerpt");
      if (excerptEl) excerptEl.textContent = `"${game.reviewExcerpt}"`;
      
      const readReviewBtn = document.getElementById("game-detail-read-review-btn");
      if (readReviewBtn) {
        readReviewBtn.onclick = () => {
          closeGameDetails();
          // Trigger matching mock article dynamically
          if (window.switchApp) window.switchApp("news");
          
          // Try to search for mock review article title, otherwise prompt user
          const mockArticle = window.articles?.find(a => a.title.includes(game.title));
          if (mockArticle && window.openArticle) {
            window.openArticle(mockArticle.id);
          } else {
            pushNotification("Review Opened", `Opening editorial notes for ${game.title}.`);
          }
        };
      }
    } else {
      reviewCard.classList.add("hidden");
    }
  }

  // Open modal
  modal.classList.remove("closing");
  modal.classList.remove("hidden");
  document.body.classList.add("reader-active");

  const gameCard = document.getElementById("game-detail-card");
  if (gameCard) {
    gameCard.onmousemove = (e) => {
      const rect = gameCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gameCard.style.setProperty("--mouse-x", `${x}px`);
      gameCard.style.setProperty("--mouse-y", `${y}px`);

      const rotateX = ((y - rect.height / 2) / rect.height) * -2.5;
      const rotateY = ((x - rect.width / 2) / rect.width) * 2.5;
      gameCard.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    gameCard.onmouseleave = () => {
      gameCard.style.transform = "";
    };
  }
  
  // Center scroll position
  const bodyPane = document.getElementById("game-modal-body");
  if (bodyPane) bodyPane.scrollTop = 0;
}

function closeGameDetails() {
  const modal = document.getElementById("game-detail-modal");
  if (!modal || modal.classList.contains("hidden")) return;

  const video = document.getElementById("game-detail-video");
  if (video) {
    video.pause();
    video.src = "";
  }

  modal.classList.add("closing");

  const finishClose = () => {
    modal.classList.remove("closing");
    modal.classList.add("hidden");
    document.body.classList.remove("reader-active");
    modal.removeEventListener("animationend", onAnimationEnd);
  };

  const onAnimationEnd = (e) => {
    if (e.target.id === "game-detail-card") {
      finishClose();
    }
  };

  modal.addEventListener("animationend", onAnimationEnd);

  // Safety timeout
  setTimeout(() => {
    if (modal.classList.contains("closing")) {
      finishClose();
    }
  }, 380);
}

// Bind modal events for details view (close clicks, backdrop clicks, and screenshots slider)
function initGameModalEvents() {
  const closeBtn = document.getElementById("game-modal-close-btn");
  const backdrop = document.getElementById("game-modal-backdrop");
  if (closeBtn) {
    closeBtn.onclick = closeGameDetails;
  }
  if (backdrop) {
    backdrop.onclick = closeGameDetails;
  }

  // Keyboard navigation bind for Escape key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeGameDetails();
    }
  });

  // Screenshots slider nav controls
  const wrapper = document.getElementById("game-screenshots-wrapper");
  const prevBtn = document.getElementById("ss-slider-prev");
  const nextBtn = document.getElementById("ss-slider-next");
  if (wrapper && prevBtn && nextBtn) {
    prevBtn.onclick = () => wrapper.scrollBy({ left: -220, behavior: "smooth" });
    nextBtn.onclick = () => wrapper.scrollBy({ left: 220, behavior: "smooth" });
  }
}
