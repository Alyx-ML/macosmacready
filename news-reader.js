// MacReady news and reader module
// Keeps feed rendering, source controls, bookmarks, queue, and reader behavior together.

function updateCounts() {
  const bookmarkCount = articles.filter(a => a.bookmarked).length;
  const queueCount = articles.filter(a => a.queued).length;
  const customCount = articles.filter(a => a.custom).length;
  
  const bCountEl = document.getElementById("bookmark-count");
  const qCountEl = document.getElementById("queue-count");
  const cCountEl = document.getElementById("custom-count");
  if (bCountEl) bCountEl.textContent = bookmarkCount;
  if (qCountEl) qCountEl.textContent = queueCount;
  if (cCountEl) cCountEl.textContent = customCount;

  const widgetTotalCount = document.getElementById("widget-total-count");
  const widgetBookmarkCount = document.getElementById("widget-bookmark-count");
  const widgetCustomCount = document.getElementById("widget-custom-count");

  if (widgetTotalCount) widgetTotalCount.textContent = articles.length;
  if (widgetBookmarkCount) widgetBookmarkCount.textContent = bookmarkCount;
  if (widgetCustomCount) widgetCustomCount.textContent = customCount;
}

function renderNewsSourceControls() {
  const menu = document.getElementById("news-source-menu");
  if (!menu) return;

  menu.innerHTML = NEWS_RSS_SOURCES.map(source => `
    <li class="sidebar-item source-control-item" data-source-name="${source.name}">
      <label class="source-control-label">
        <input type="checkbox" ${enabledNewsSources.has(source.name) ? "checked" : ""}>
        <span>${source.name}</span>
      </label>
    </li>
  `).join("");

  menu.querySelectorAll(".source-control-item").forEach(item => {
    const checkbox = item.querySelector("input");
    const sourceName = item.getAttribute("data-source-name");
    if (!checkbox || !sourceName) return;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        enabledNewsSources.add(sourceName);
      } else {
        enabledNewsSources.delete(sourceName);
      }
      saveToStorage();
      renderFeed();
    });
  });
}

function getLiveRSSNodeText(item, names) {
  for (const name of names) {
    const match = [...item.children].find(child => child.localName === name);
    const value = match?.textContent?.trim();
    if (value) return value;
  }
  return "";
}

function getLiveRSSItemLink(item) {
  const directLink = getLiveRSSNodeText(item, ["link"]);
  if (directLink) return directLink;

  const alternateLink = [...item.querySelectorAll("link")]
    .find(link => !link.getAttribute("rel") || link.getAttribute("rel") === "alternate");
  return alternateLink?.getAttribute("href") || "";
}

function parseLiveRSSSource(source, xmlText) {
  const documentXml = new DOMParser().parseFromString(xmlText || "", "text/xml");
  if (documentXml.querySelector("parsererror")) return [];

  const nodes = [...documentXml.querySelectorAll("item, entry")];
  return nodes
    .map((item, index) => {
      const title = cleanArticleText(getLiveRSSNodeText(item, ["title"]));
      const sourceUrl = getLiveRSSItemLink(item);
      const rawDescription = getLiveRSSNodeText(item, ["description", "summary"]);
      const content = getLiveRSSNodeText(item, ["encoded", "content"]) || rawDescription;
      const pubDate = getLiveRSSNodeText(item, ["pubDate", "published", "updated"]);
      const timestamp = Date.parse(pubDate);

      if (!title || !sourceUrl || Number.isNaN(timestamp)) return null;
      if (!shouldIncludeRSSArticle(source, title, rawDescription, content)) return null;

      return {
        id: `${source.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${timestamp}-${index}`,
        title,
        subtitle: buildRSSSubtitle(rawDescription || content),
        category: source.category,
        author: source.name,
        avatar: source.name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(),
        date: formatRSSDate(timestamp),
        timestamp,
        cover: extractRSSImage(item, content || rawDescription),
        sourceName: source.name,
        sourceUrl,
        bookmarked: false,
        queued: queuedArticleUrls.has(sourceUrl),
        custom: false,
        content: `<p>${escapeHTML(buildRSSSubtitle(content || rawDescription || title))}</p>`
      };
    })
    .filter(Boolean);
}

async function loadNewsFromRSS() {
  articles = [];
  renderFeed();

  try {
    const generatedNewsUrl = typeof GENERATED_NEWS_URL !== "undefined"
      ? GENERATED_NEWS_URL
      : "public/data/news.generated.json";
    const response = await fetch(generatedNewsUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Generated news request failed: ${response.status}`);

    const payload = await response.json();
    const generatedArticles = Array.isArray(payload.articles) ? payload.articles : [];

    articles = generatedArticles
      .map(article => ({
        ...article,
        title: cleanArticleText(article.title || ""),
        subtitle: article.subtitle || buildRSSSubtitle(article.content || ""),
        sourceUrl: article.sourceUrl || "",
        bookmarked: false,
        queued: queuedArticleUrls.has(article.sourceUrl || ""),
        custom: false
      }))
      .filter(article => article.title && article.sourceUrl)
      .filter(article => shouldRenderArticle(article))
      .filter((article, index, list) => list.findIndex(match => match.sourceUrl === article.sourceUrl) === index)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 120);
  } catch (error) {
    console.error("Generated news data failed to load", error);
    articles = [];
  }

  updateCounts();
  renderFeed();
}

// --- 5. News Feed Renderer ---
function renderFeed() {
  const grid = document.getElementById("news-grid");
  const emptyState = document.getElementById("empty-state");
  if (!grid) return;

  // Filter articles based on sidebar navigation and categories
  let filtered = articles.filter(shouldRenderArticle);

  // Enforce Reviews Filter if active app is Reviews
  if (currentApp === "reviews") {
    filtered = filtered.filter(a => a.category === "science");
  } else {
    // 1. Library Filter (only for News App)
    if (currentLibrary === "bookmarks") {
      filtered = filtered.filter(a => a.bookmarked);
    } else if (currentLibrary === "queue") {
      filtered = filtered.filter(a => a.queued);
    } else if (currentLibrary === "custom") {
      filtered = filtered.filter(a => a.custom);
    }

    // 2. Category Filter
    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    } else if (currentLibrary === "today") {
      filtered = filtered.filter(a => a.category !== "design");
    }

  }

  // 3. Search Filter
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  }

  // Handle Empty State
  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  } else {
    if (emptyState) emptyState.classList.add("hidden");
  }

  // Render HTML Cards
  let html = "";
  
  // Set first item as featured if in grid-view and not searching/filtering specific categories and is News app
  const shouldFeature = currentView === "grid" && currentCategory === "all" && searchQuery === "" && currentLibrary === "today" && currentApp === "news";

  // Slice articles for pagination and lazy-loading
  const pagedArticles = filtered.slice(0, visibleArticlesCount);

  pagedArticles.forEach((article, index) => {
    const isFeatured = shouldFeature && index === 0;
    const cardClass = isFeatured ? "news-card featured" : "news-card";
    // Setup cover image styling
    const coverUrl = optimizeArticleImageUrl(article.cover, isFeatured);
    const imagePriority = isFeatured ? `fetchpriority="high"` : `loading="lazy"`;
    const imageSource = index >= INITIAL_VISIBLE_ARTICLE_COUNT ? `data-src="${coverUrl}"` : `src="${coverUrl}"`;
    const coverHtml = `<div class="card-cover"><img ${imageSource} alt="${escapeHTML(article.title)}" ${imagePriority} decoding="async" onerror="this.closest('.news-card').remove();"></div>`;

    html += `
      <article class="${cardClass}" data-id="${article.id}">
        ${coverHtml}

        <div class="card-body">
          <h3 class="card-title font-title">${article.title}</h3>
          <p class="card-excerpt">${article.subtitle}</p>
          <div class="card-meta">
            <a class="card-source" href="${article.sourceUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${article.sourceName}</a>
            <span class="card-date">${article.date}</span>
          </div>
          <a href="${article.sourceUrl}" target="_blank" rel="noopener" class="btn-read-more-glass" onclick="event.stopPropagation()">
            <span>Read More</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.75; vertical-align: middle;"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
        </div>
      </article>
    `;
  });

  grid.innerHTML = html;
  initNewsImageLoading();

  // Append or manage the soft glass liquid lazy load blur panel
  let blurPanel = document.getElementById("feed-lazy-load-blur");
  if (filtered.length > visibleArticlesCount) {
    if (!blurPanel) {
      blurPanel = document.createElement("div");
      blurPanel.id = "feed-lazy-load-blur";
      blurPanel.className = "feed-lazy-load-blur";
      grid.parentNode.parentNode.appendChild(blurPanel);
    }
    blurPanel.innerHTML = ``;
    blurPanel.classList.remove("fade-out");
    blurPanel.style.display = "flex";
  } else {
    if (blurPanel) {
      blurPanel.remove();
    }
  }

  // Add click event listeners to entire cards
  grid.querySelectorAll(".news-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      openArticle(id);
    });

    // Cursor tracking highlight effect
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
}

function getCategoryTitle(category) {
  return RSS_CATEGORY_LABELS[category] || `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
}

function getCategoryHeading(category) {
  const headings = {
    technology: "Latest Mac News",
    design: "Latest Games",
    science: "Mac Reviews",
    culture: "Latest macOS Apps",
    ai: "Apple Intelligence News for macOS",
    deals: "MacBook Deals"
  };
  return headings[category] || `${getCategoryTitle(category)} Stories`;
}

// Toggle Article Bookmark
function toggleBookmark(id) {
  const article = articles.find(a => a.id === id);
  if (article) {
    article.bookmarked = !article.bookmarked;
    saveToStorage();
    updateCounts();
    renderFeed();
    
    // Sync reader state if open
    const readerOpen = !document.getElementById("reader-overlay").classList.contains("hidden");
    if (readerOpen && selectedArticleId === id) {
      updateReaderBookmarkBtn(article.bookmarked);
    }

    // Sync Notification Center Reading List
    renderBookmarksWidget();

    // Dynamic banner feedback in system alerts
    pushNotification(
      article.bookmarked ? "Bookmarked Story" : "Removed Bookmark", 
      `"${article.title.substring(0, 30)}..." has been updated.`
    );
  }
}

function renderBookmarksWidget() {
  const container = document.getElementById("widget-reading-list");
  const countBadge = document.getElementById("widget-bookmarks-count");
  if (!container) return;

  const bookmarkedArticles = articles.filter(a => a.bookmarked);
  if (countBadge) {
    countBadge.textContent = `${bookmarkedArticles.length} article${bookmarkedArticles.length !== 1 ? 's' : ''}`;
  }

  if (bookmarkedArticles.length === 0) {
    container.innerHTML = `
      <div class="empty-reading-list">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-1 opacity-40">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <p class="text-xxs opacity-60">No bookmarked articles. Save stories to read later.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = bookmarkedArticles.map(article => `
    <div class="reading-item" data-id="${article.id}">
      <div class="reading-item-left">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" class="reading-item-icon">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
        <span class="reading-item-title" title="${article.title}">${article.title}</span>
      </div>
      <button class="reading-item-remove" data-id="${article.id}" title="Remove Bookmark">
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `).join("");

  // Bind click handlers to the dynamic reading list
  container.querySelectorAll(".reading-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".reading-item-remove")) return;
      const id = item.getAttribute("data-id");
      openArticle(id);
    });
  });

  container.querySelectorAll(".reading-item-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      toggleBookmark(id);
    });
  });
}

// --- 6. Quick Look Article Reader View Actions ---
let currentFontSizeClass = "font-size-medium";

async function openArticle(id) {
  const article = articles.find(a => a.id === id);
  if (!article) return;

  selectedArticleId = id;
  const overlay = document.getElementById("reader-overlay");
  
  // Fill text details
  document.getElementById("reader-toolbar-title").textContent = article.title;
  document.getElementById("reader-title").textContent = article.title;
  document.getElementById("reader-subtitle").textContent = article.subtitle;
  document.getElementById("reader-author").textContent = article.author;
  document.getElementById("reader-date").textContent = article.date;
  document.getElementById("reader-avatar").textContent = article.avatar;
  document.getElementById("reader-text").innerHTML = article.content;
  const originalLink = document.getElementById("reader-open-original");
  if (originalLink) originalLink.href = article.sourceUrl;
  const heroReadMore = document.getElementById("reader-hero-read-more");
  if (heroReadMore) heroReadMore.href = article.sourceUrl;

  // Reset font class
  const richtext = document.getElementById("reader-text");
  richtext.className = `reader-richtext font-editorial ${currentFontSizeClass}`;
  updateFontPercentageDisplay();

  // Parse word count and reading time dynamically for print-style meta
  const plainText = richtext.textContent || "";
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(words / 200) || 1;
  const metaLine = document.getElementById("reader-editorial-meta");
  if (metaLine) {
    metaLine.innerHTML = `By <span style="font-weight: 700;">${article.author}</span> &bull; ${article.date} &bull; ⏱️ ${readTime} min read`;
  }

  // Apply reading theme class
  setReaderTheme(currentReaderTheme);

  // Reset scroll-linked opacity styles on load
  const subtitleEl = document.getElementById("reader-subtitle");
  if (subtitleEl) subtitleEl.style.opacity = "1";
  if (metaLine) metaLine.style.opacity = "0.65";

  // Cover image settings
  const coverImg = document.getElementById("reader-cover-img");
  const heroBlock = document.querySelector(".reader-hero");
  
  if (article.cover && article.cover.startsWith("preset-")) {
    if (coverImg) coverImg.classList.add("hidden");
    const preset = PRESET_INFO[article.cover] || PRESET_INFO["preset-1"];
    if (heroBlock) heroBlock.style.background = preset.bg;
  } else if (article.cover) {
    if (coverImg) {
      coverImg.classList.remove("hidden");
      coverImg.src = article.cover;
    }
    if (heroBlock) heroBlock.style.background = "#121217";
  } else {
    if (coverImg) {
      coverImg.classList.add("hidden");
      coverImg.removeAttribute("src");
    }
    if (heroBlock) heroBlock.style.background = "#121217";
  }

  // Bookmark Button in reader
  updateReaderBookmarkBtn(article.bookmarked);
  updateReaderQueueBtn(article.queued);

  // Reset scroll progress bar
  const pBar = document.getElementById("reader-progress");
  if (pBar) pBar.style.width = "0%";

  // Reset toolbar hiding state
  const toolbar = document.querySelector(".reader-toolbar");
  if (toolbar) toolbar.classList.remove("toolbar-hidden");

  // Determine active filtered list to identify adjacent stories
  let filtered = articles;
  if (currentApp === "reviews") {
    filtered = filtered.filter(a => a.category === "science");
  } else {
    if (currentLibrary === "bookmarks") {
      filtered = filtered.filter(a => a.bookmarked);
    } else if (currentLibrary === "queue") {
      filtered = filtered.filter(a => a.queued);
    } else if (currentLibrary === "custom") {
      filtered = filtered.filter(a => a.custom);
    }
    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    }
  }
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  }

  const currentIndex = filtered.findIndex(a => a.id === id);
  const nextArticle = currentIndex >= 0 && currentIndex < filtered.length - 1 ? filtered[currentIndex + 1] : null;

  // Up Next Footer Setup (Removed as requested)
  const nextDivider = document.getElementById("reader-next-divider");
  if (nextDivider) {
    nextDivider.style.display = "none";
  }

  // Open the overlay
  if (overlay) {
    overlay.classList.remove("hidden");
    document.body.classList.add("reader-active");
  }
  const bodyPane = document.getElementById("reader-body");
  if (bodyPane) {
    bodyPane.scrollTop = 0;

    let lastScrollTop = 0;

    // Add scroll handler for reading progress tracker and auto-hiding toolbar
    bodyPane.onscroll = () => {
      const currentScroll = bodyPane.scrollTop;

      // 1. Auto-hide toolbar on scroll down, show on scroll up
      if (toolbar) {
        if (currentScroll > lastScrollTop && currentScroll > 60) {
          toolbar.classList.add("toolbar-hidden");
        } else if (currentScroll < lastScrollTop) {
          toolbar.classList.remove("toolbar-hidden");
        }
      }
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;



      // 3. Scroll progress
      const totalHeight = bodyPane.scrollHeight - bodyPane.clientHeight;
      if (totalHeight > 0) {
        const percentage = (bodyPane.scrollTop / totalHeight) * 100;
        if (pBar) pBar.style.width = `${percentage}%`;
      }
    };
  }
}

function updateReaderReadTime(article) {
  const richtext = document.getElementById("reader-text");
  const metaLine = document.getElementById("reader-editorial-meta");
  if (!richtext || !metaLine) return;

  const readTime = Math.ceil(getWordCount(richtext.textContent || "") / 200) || 1;
  metaLine.innerHTML = `By <span style="font-weight: 700;">${article.author}</span> &bull; ${article.date} &bull; ${readTime} min read`;
}

function getWordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

function setReaderTheme(theme) {
  currentReaderTheme = theme;
  const articleCard = document.getElementById("reader-article");
  if (articleCard) {
    articleCard.classList.remove("theme-paper", "theme-velvet");
    if (theme === "paper") {
      articleCard.classList.add("theme-paper");
    } else if (theme === "velvet") {
      articleCard.classList.add("theme-velvet");
    }
  }

  // Update dropdown radio selection states
  document.querySelectorAll(".theme-circle-btn").forEach(btn => {
    const btnTheme = btn.getAttribute("data-theme");
    if (btnTheme === theme) {
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
    } else {
      btn.classList.remove("active");
      btn.setAttribute("aria-checked", "false");
    }
  });
}

function updateFontPercentageDisplay() {
  const percentageEl = document.getElementById("font-percentage");
  if (!percentageEl) return;
  if (currentFontSizeClass === "font-size-small") {
    percentageEl.textContent = "85%";
  } else if (currentFontSizeClass === "font-size-medium") {
    percentageEl.textContent = "100%";
  } else if (currentFontSizeClass === "font-size-large") {
    percentageEl.textContent = "120%";
  }
}

function updateReaderBookmarkBtn(isBookmarked) {
  const btn = document.getElementById("reader-bookmark-btn");
  if (!btn) return;
  
  const textEl = btn.querySelector(".action-text");
  
  if (isBookmarked) {
    btn.classList.add("active");
    if (textEl) textEl.textContent = "Remove Bookmark";
    const svg = btn.querySelector("svg");
    if (svg) {
      svg.setAttribute("fill", "var(--accent-color)");
      svg.setAttribute("stroke", "var(--accent-color)");
    }
  } else {
    btn.classList.remove("active");
    if (textEl) textEl.textContent = "Bookmark Article";
    const svg = btn.querySelector("svg");
    if (svg) {
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
    }
  }
}

function updateReaderQueueBtn(isQueued) {
  const btn = document.getElementById("reader-queue-btn");
  if (!btn) return;

  if (isQueued) {
    btn.classList.add("active");
    btn.style.color = "var(--accent-color)";
  } else {
    btn.classList.remove("active");
    btn.style.color = "";
  }
}

function toggleReadingQueue(id) {
  const article = articles.find(a => a.id === id);
  if (!article) return;

  article.queued = !article.queued;
  if (article.queued) {
    queuedArticleUrls.add(article.sourceUrl);
  } else {
    queuedArticleUrls.delete(article.sourceUrl);
  }

  saveToStorage();
  updateCounts();
  renderFeed();
  updateReaderQueueBtn(article.queued);
}

function closeReader() {
  const overlay = document.getElementById("reader-overlay");
  if (overlay) {
    overlay.classList.add("hidden");
    document.body.classList.remove("reader-active");
  }
  
  const dropdown = document.getElementById("reader-options-dropdown");
  if (dropdown) {
    dropdown.classList.add("hidden");
    const optionsBtn = document.getElementById("reader-options-btn");
    if (optionsBtn) {
      optionsBtn.setAttribute("aria-expanded", "false");
    }
  }
  
  selectedArticleId = null;
}

// Adjacent navigation helper for chevrons and keybinds
function navigateArticle(direction) {
  if (!selectedArticleId) return;
  let filtered = articles;
  if (currentApp === "reviews") {
    filtered = filtered.filter(a => a.category === "science");
  } else {
    if (currentLibrary === "bookmarks") {
      filtered = filtered.filter(a => a.bookmarked);
    } else if (currentLibrary === "queue") {
      filtered = filtered.filter(a => a.queued);
    } else if (currentLibrary === "custom") {
      filtered = filtered.filter(a => a.custom);
    }
    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    }
  }
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  }

  const currentIndex = filtered.findIndex(a => a.id === selectedArticleId);
  const targetIndex = currentIndex + direction;
  if (targetIndex >= 0 && targetIndex < filtered.length) {
    openArticle(filtered[targetIndex].id);
  }
}

// Proximity-activated chevron overlay visual manager
function updateProximityChevrons(x, width) {
  const prevBtn = document.getElementById("reader-prev-btn");
  const nextBtn = document.getElementById("reader-next-btn");
  if (!prevBtn || !nextBtn || !selectedArticleId) return;

  let filtered = articles;
  if (currentApp === "reviews") {
    filtered = filtered.filter(a => a.category === "science");
  } else {
    if (currentLibrary === "bookmarks") {
      filtered = filtered.filter(a => a.bookmarked);
    } else if (currentLibrary === "queue") {
      filtered = filtered.filter(a => a.queued);
    } else if (currentLibrary === "custom") {
      filtered = filtered.filter(a => a.custom);
    }
    if (currentCategory !== "all") {
      filtered = filtered.filter(a => a.category === currentCategory);
    }
  }
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.subtitle.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q)
    );
  }

  const currentIndex = filtered.findIndex(a => a.id === selectedArticleId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filtered.length - 1;

  if (x < 80 && hasPrev) {
    prevBtn.classList.add("proximity-visible");
  } else {
    prevBtn.classList.remove("proximity-visible");
  }

  if (width - x < 80 && hasNext) {
    nextBtn.classList.add("proximity-visible");
  } else {
    nextBtn.classList.remove("proximity-visible");
  }
}
