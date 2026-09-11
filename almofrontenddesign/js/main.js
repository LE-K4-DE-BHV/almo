// Gemeinsame UI-Logik: Header/Footer einbinden, Toast, aktive Nav

function renderHeader(activeKey) {
  const el = document.getElementById("site-header");
  if (!el) return;
  const links = [
    ["index.html", "nav_home"],
    ["shop.html", "nav_shop"],
    ["shop.html?category=Ringe", "nav_rings"],
    ["shop.html?category=Halsketten", "nav_necklaces"],
    ["shop.html?category=Ohrringe", "nav_earrings"],
    ["shop.html?category=Armbaender", "nav_bracelets"]
  ];
  const searchValue = (typeof qs === "function" && qs("search")) || "";
  const lang = getLang();
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  el.innerHTML = `
    <div class="announce">${t("announce")}</div>
    <header class="site-header">
      <div class="wrap">
        <button type="button" class="nav-toggle" id="nav-toggle" aria-label="Menu">
          <svg class="icon" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <a href="index.html" class="logo">Almo</a>
        <div class="nav-backdrop" id="nav-backdrop"></div>
        <nav class="main-nav" id="main-nav">
          <div class="nav-drawer-head">
            <span class="nav-drawer-title">${t("menu_title")}</span>
            <button type="button" class="icon-btn" id="nav-close" aria-label="${t("close_menu")}">
              <svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
          <div class="nav-links">
            ${links.map(([href, key]) => `<a href="${href}" class="${activeKey === key ? "active" : ""}">${t(key)}</a>`).join("")}
          </div>
          <div class="nav-extra">
            <div class="lang-switch">
              <button type="button" class="lang-btn ${lang === "de" ? "active" : ""}" data-lang="de">DE</button>
              <button type="button" class="lang-btn ${lang === "en" ? "active" : ""}" data-lang="en">EN</button>
              <button type="button" class="lang-btn ${lang === "fr" ? "active" : ""}" data-lang="fr">FR</button>
            </div>
            <a href="account.html" class="nav-extra-link" data-auth-user hidden>
              <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
              ${user ? user.name : t("account")}
            </a>
            <a href="login.html" class="nav-extra-link" data-auth-guest>
              <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
              ${t("login")}
            </a>
            <a href="wishlist.html" class="nav-extra-link">
              <svg class="icon" viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 4.5 2.5C11.5 6 13 5 15 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z"/></svg>
              ${t("wishlist")}
            </a>
          </div>
        </nav>
        <div class="header-actions">
          <button type="button" class="icon-btn" id="search-toggle" aria-label="${t("search_placeholder")}" title="${t("search_placeholder")}">
            <svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <div class="lang-switch action-collapsible">
            <button type="button" class="lang-btn ${lang === "de" ? "active" : ""}" data-lang="de">DE</button>
            <button type="button" class="lang-btn ${lang === "en" ? "active" : ""}" data-lang="en">EN</button>
            <button type="button" class="lang-btn ${lang === "fr" ? "active" : ""}" data-lang="fr">FR</button>
          </div>
          <a href="account.html" class="icon-btn action-collapsible" data-auth-user hidden title="${user ? (t("account") + ": " + user.name) : t("account")}" aria-label="${t("account")}">
            <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
            <span class="sr-only">${t("account")}</span>
          </a>
          <a href="login.html" class="icon-btn action-collapsible" data-auth-guest title="${t("login")}" aria-label="${t("login")}">
            <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
            <span class="sr-only">${t("login")}</span>
          </a>
          <a href="wishlist.html" class="icon-btn action-collapsible" title="${t("wishlist")}" aria-label="${t("wishlist")}">
            <svg class="icon" viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 4.5 2.5C11.5 6 13 5 15 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z"/></svg>
            <span class="sr-only">${t("wishlist")}</span>
            <span class="cart-count" data-wishlist-count hidden>0</span>
          </a>
          <a href="cart.html" class="icon-btn" title="${t("cart")}" aria-label="${t("cart")}">
            <svg class="icon" viewBox="0 0 24 24"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
            <span class="sr-only">${t("cart")}</span>
            <span class="cart-count" data-cart-count hidden>0</span>
          </a>
        </div>
      </div>
      <div class="search-panel" id="search-panel" hidden>
        <div class="wrap">
          <form id="search-form">
            <svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="search" name="search" placeholder="${t("search_placeholder")}" value="${searchValue}" aria-label="${t("search_placeholder")}">
          </form>
        </div>
      </div>
    </header>
  `;

  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  const navClose = document.getElementById("nav-close");
  const navBackdrop = document.getElementById("nav-backdrop");

  function openNav() {
    nav.classList.add("open");
    navBackdrop.classList.add("open");
    document.body.classList.add("nav-open");
  }
  function closeNav() {
    nav.classList.remove("open");
    navBackdrop.classList.remove("open");
    document.body.classList.remove("nav-open");
  }
  toggle.addEventListener("click", () => {
    nav.classList.contains("open") ? closeNav() : openNav();
  });
  navClose.addEventListener("click", closeNav);
  navBackdrop.addEventListener("click", closeNav);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  const searchToggle = document.getElementById("search-toggle");
  const searchPanel = document.getElementById("search-panel");
  searchToggle.addEventListener("click", () => {
    searchPanel.hidden = !searchPanel.hidden;
    if (!searchPanel.hidden) searchPanel.querySelector("input").focus();
  });

  document.getElementById("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const term = e.target.search.value.trim();
    window.location.href = "shop.html" + (term ? "?search=" + encodeURIComponent(term) : "");
  });

  el.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });

  if (typeof updateWishlistBadge === "function") updateWishlistBadge();
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  el.innerHTML = `
    <footer class="site-footer">
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <h3>Almo Schmuck</h3>
            <p>${t("footer_tagline")}</p>
            <form class="newsletter-form" id="newsletter-form">
              <input type="email" placeholder="${t("newsletter_placeholder")}" required aria-label="${t("newsletter_placeholder")}">
              <button type="submit" class="btn btn-outline">${t("newsletter_btn")}</button>
            </form>
          </div>
          <div>
            <h3>${t("footer_shop")}</h3>
            <ul>
              <li><a href="shop.html">${t("nav_shop")}</a></li>
              <li><a href="shop.html?category=Ringe">${t("nav_rings")}</a></li>
              <li><a href="shop.html?category=Halsketten">${t("nav_necklaces")}</a></li>
              <li><a href="shop.html?category=Ohrringe">${t("nav_earrings")}</a></li>
              <li><a href="shop.html?category=Armbaender">${t("nav_bracelets")}</a></li>
            </ul>
          </div>
          <div>
            <h3>${t("footer_account")}</h3>
            <ul>
              <li><a href="login.html">${t("login")}</a></li>
              <li><a href="register.html">${t("register_now")}</a></li>
              <li><a href="cart.html">${t("cart")}</a></li>
              <li><a href="wishlist.html">${t("wishlist")}</a></li>
            </ul>
          </div>
          <div>
            <h3>${t("footer_contact")}</h3>
            <ul>
              <li>hello@almo-schmuck.de</li>
              <li>${t("footer_hours")}</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; 2026 Almo Schmuck</span>
          <span>${t("footer_legal")}</span>
        </div>
      </div>
    </footer>
  `;

  document.getElementById("newsletter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    showToast(t("newsletter_toast"));
    e.target.reset();
  });
}

function renderPriceRow(product) {
  if (product.compareAt) {
    return `<div class="price-row">
      <span class="price sale">${formatPrice(product.price)}</span>
      <span class="compare">${formatPrice(product.compareAt)}</span>
    </div>`;
  }
  return `<div class="price-row"><span class="price">${formatPrice(product.price)}</span></div>`;
}

function renderStars(rating) {
  const full = Math.round(rating * 2) / 2;
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (full >= i) stars += "&#9733;";
    else if (full >= i - 0.5) stars += "&#189;&#9733;";
    else stars += "&#9734;";
  }
  return stars;
}

function renderRating(product) {
  return `<div class="rating">
    <span class="stars">${renderStars(product.rating)}</span>
    <span class="rating-count">(${product.reviewCount})</span>
  </div>`;
}

function badgeLabel(badge) {
  if (badge === "Neu") return t("badge_new");
  if (badge === "Sale") return t("badge_sale");
  if (badge === "Bestseller") return t("badge_bestseller");
  return badge;
}

function renderWishlistBtn(product) {
  return `<button type="button" class="wishlist-btn" data-wishlist-btn="${product.id}" aria-label="${t("wishlist_add")}" onclick="event.preventDefault(); const active = toggleWishlist('${product.id}'); showToast(active ? t('wishlist_added') : t('wishlist_removed')); if (typeof renderWishlistPage === 'function') renderWishlistPage();">
    <svg class="icon" viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 2.5 5 6 5c2 0 3.5 1 4.5 2.5C11.5 6 13 5 15 5c3.5 0 5.5 3.5 3.5 7.5C19 16.65 12 21 12 21z"/></svg>
  </button>`;
}

function renderProductCard(product) {
  const text = getProductText(product);
  const stock = stockLabel(product.stock);
  return `
    <div class="product-card-wrap">
      <a href="product.html?id=${product.id}" class="product-card">
        <div class="product-media">
          <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
          ${product.badge ? `<span class="badge ${product.badge === "Sale" ? "sale" : ""}">${badgeLabel(product.badge)}</span>` : ""}
          <span class="quick-add">${t("quick_details")}</span>
        </div>
        <div class="product-info">
          <div class="category">${text.category}</div>
          <div class="name">${product.name}</div>
          ${renderRating(product)}
          ${renderPriceRow(product)}
          ${stock.cls === "low" ? `<div class="stock-badge low">${t(stock.key)}</div>` : ""}
        </div>
      </a>
      ${renderWishlistBtn(product)}
    </div>
  `;
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
