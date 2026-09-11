// Wunschliste ueber localStorage
const WISHLIST_KEY = "almo_wishlist";

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  updateWishlistBadge();
}

function isInWishlist(productId) {
  return getWishlist().includes(productId);
}

function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(productId);
  }
  saveWishlist(list);
  return list.includes(productId);
}

function updateWishlistBadge() {
  const badges = document.querySelectorAll("[data-wishlist-count]");
  const count = getWishlist().length;
  badges.forEach((el) => {
    el.textContent = count;
    el.hidden = count === 0;
  });
  document.querySelectorAll("[data-wishlist-btn]").forEach((btn) => {
    const id = btn.dataset.wishlistBtn;
    btn.classList.toggle("active", isInWishlist(id));
  });
}

document.addEventListener("DOMContentLoaded", updateWishlistBadge);
