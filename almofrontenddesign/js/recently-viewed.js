// Zuletzt angesehene Produkte ueber localStorage
const RECENT_KEY = "almo_recent";
const RECENT_MAX = 8;

function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function addRecentlyViewed(productId) {
  let list = getRecentlyViewed().filter((id) => id !== productId);
  list.unshift(productId);
  list = list.slice(0, RECENT_MAX);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}
