

// ==========================================
// --- 9. SteamDB Games Portal Engine ---
// ==========================================

// Real Steam AppIDs for tracked Mac-relevant games
const TRACKED_APPIDS = [
  { appid: 1086940, title: "Baldur's Gate 3" },
  { appid: 1091500, title: "Cyberpunk 2077" },
  { appid: 1245620, title: "ELDEN RING" },
  { appid: 1145360, title: "Hades" },
  { appid: 413150,  title: "Stardew Valley" },
  { appid: 271590,  title: "Grand Theft Auto V" },
  { appid: 1426210, title: "It Takes Two" },
  { appid: 550,     title: "Left 4 Dead 2" },
  { appid: 1172620, title: "Sea of Thieves" },
  { appid: 1888160, title: "The Last of Us Part I" },
];

// Cache to avoid re-fetching on filter changes
let gamesCache = [];
let gamesLoaded = false;
let gamesLoading = false;

let currentGameFilter = "trending";
let currentGameCompat = "all";
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
    // Steam Store via allorigins proxy — check Mac platform support
    const storeRes = await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(`https://store.steampowered.com/api/appdetails?appids=${appid}&filters=platforms,genres`)}`
    );
    if (storeRes.ok) {
      const json = await storeRes.json();
      const parsed = JSON.parse(json.contents);
      const data = parsed?.[appid]?.data;
      if (data?.platforms?.mac) result.hasNativeMac = true;
      if (data?.genres) {
        result.genres = data.genres.map(g => g.description).slice(0, 3);
      }
    }
  } catch (e) { /* not critical */ }

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
      ? `<span>&#x1F7E2; ${game.activePlayers.toLocaleString()} CCU</span>
         <span style="opacity: 0.5;">Peak: ${(game.peakPlayers || 0).toLocaleString()}</span>`
      : `<span style="opacity:0.4;">Player data unavailable</span>`;

    const protonHtml = game.protonTier ? `
      <div class="game-card-proton">
        <span class="proton-badge proton-${game.protonTier}">${game.protonTier}</span>
        ${game.protonTotal ? `<span style="font-size:10px; opacity:0.55; margin-left:4px;">${game.protonTotal.toLocaleString()} reports</span>` : ""}
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
            <a href="${game.storeUrl}" target="_blank" class="game-link-btn">Steam</a>
            <a href="${game.protonUrl}" target="_blank" class="game-link-btn">ProtonDB</a>
            <a href="${game.steamdbUrl}" target="_blank" class="game-link-btn">SteamDB</a>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

function filterGames(query) {
  gameSearchQuery = query;
  renderGamesView();
}

