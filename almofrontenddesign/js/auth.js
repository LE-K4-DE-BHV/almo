// Authentifizierung ohne Backend: "Nutzerdatenbank" und Session in localStorage.
// Passwoerter werden nur leicht verschleiert (kein echtes Hashing) - fuer einen
// echten Betrieb muss das durch eine serverseitige Authentifizierung ersetzt werden.
const USERS_KEY = "almo_users";
const SESSION_KEY = "almo_session";

function obscure(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return "h" + hash;
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUser(email) {
  const normalized = email.trim().toLowerCase();
  return getUsers().find((u) => u.email === normalized);
}

// Ergebnis: { ok: true } oder { ok: false, error: "exists" }
function registerUser(name, email, password) {
  const normalized = email.trim().toLowerCase();
  if (findUser(normalized)) {
    return { ok: false, error: "exists" };
  }
  const users = getUsers();
  users.push({ name: name.trim(), email: normalized, password: obscure(password) });
  saveUsers(users);
  setSession(normalized, name.trim());
  return { ok: true };
}

// Ergebnis: { ok: true } oder { ok: false, error: "invalid" }
function loginUser(email, password) {
  const user = findUser(email);
  if (!user || user.password !== obscure(password)) {
    return { ok: false, error: "invalid" };
  }
  setSession(user.email, user.name);
  return { ok: true };
}

function setSession(email, name) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name }));
  updateAuthUI();
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (e) {
    return null;
  }
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  updateAuthUI();
  window.location.href = "index.html";
}

function updateAuthUI() {
  const user = getCurrentUser();
  document.querySelectorAll("[data-auth-guest]").forEach((el) => {
    el.hidden = !!user;
  });
  document.querySelectorAll("[data-auth-user]").forEach((el) => {
    el.hidden = !user;
  });
  document.querySelectorAll("[data-user-email]").forEach((el) => {
    if (user) el.textContent = user.email;
  });
  document.querySelectorAll("[data-user-name]").forEach((el) => {
    if (user) el.textContent = user.name;
  });
}

function requireLogin(redirectTo) {
  if (!isLoggedIn()) {
    const target = redirectTo || window.location.pathname.split("/").pop();
    window.location.href = "login.html?redirect=" + encodeURIComponent(target);
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", updateAuthUI);
