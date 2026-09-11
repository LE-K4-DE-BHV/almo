// Bestellhistorie ueber localStorage
const ORDERS_KEY = "almo_orders";

function getAllOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function getOrdersForUser(email) {
  return getAllOrders().filter((o) => o.email === email).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function saveOrder(order) {
  const orders = getAllOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function generateOrderNumber() {
  return "ALM-" + Math.floor(100000 + Math.random() * 900000);
}
