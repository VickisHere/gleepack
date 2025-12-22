// Simple in-memory store for local development fallback
const users = new Map(); // email -> { id, email, passwordHash, name, role, createdAt }
let nextId = 1;

const orders = new Map(); // orderId -> order object
let nextOrderId = 1;

module.exports = {
	users,
	getNextId: () => String(nextId++),
	orders,
	getNextOrderId: () => String(nextOrderId++),
};
