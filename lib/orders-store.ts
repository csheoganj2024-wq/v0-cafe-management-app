const STORAGE_KEY = "bloom_cafe_orders"
const COUNTER_KEY = "bloom_cafe_order_counter"

// Initialize from localStorage
let orders: any[] = []
let orderIdCounter = 1

function loadFromStorage() {
  if (typeof window === "undefined") return // Skip on server
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const storedCounter = localStorage.getItem(COUNTER_KEY)
    if (stored) {
      orders = JSON.parse(stored)
      console.log("[v0] Loaded", orders.length, "orders from localStorage")
    }
    if (storedCounter) {
      orderIdCounter = Number.parseInt(storedCounter)
    }
  } catch (error) {
    console.error("[v0] Error loading from localStorage:", error)
  }
}

function saveToStorage() {
  if (typeof window === "undefined") return // Skip on server
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    localStorage.setItem(COUNTER_KEY, orderIdCounter.toString())
  } catch (error) {
    console.error("[v0] Error saving to localStorage:", error)
  }
}

// Load on module initialization
loadFromStorage()

export function getOrders() {
  console.log(
    "[v0] getOrders() called - returning",
    orders.length,
    "orders:",
    orders.map((o) => ({ id: o.id, status: o.status })),
  )
  return orders
}

export function createOrder(orderData: any) {
  const newOrder = {
    id: orderIdCounter++,
    ...orderData,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
    billedAt: null,
  }
  orders.push(newOrder)
  saveToStorage() // Save to localStorage after creating order
  console.log("[v0] createOrder() - Created order with ID:", newOrder.id, "Total orders now:", orders.length)
  return newOrder
}

export function getOrderById(id: number) {
  console.log(
    "[v0] getOrderById() called with ID:",
    id,
    "Available orders:",
    orders.map((o) => o.id),
  )
  const order = orders.find((o) => o.id === id)
  console.log("[v0] getOrderById() - Found order:", order ? { id: order.id, status: order.status } : "NOT FOUND")
  return order
}

export function updateOrder(id: number, updates: any) {
  console.log("[v0] updateOrder() called with ID:", id, "updates:", updates)
  const order = orders.find((o) => o.id === id)
  if (!order) {
    console.log("[v0] updateOrder() - Order not found!")
    return null
  }

  Object.assign(order, updates)
  saveToStorage() // Save to localStorage after updating order
  console.log("[v0] updateOrder() - Order updated successfully:", { id: order.id, status: order.status })
  return order
}

export function clearAllOrders() {
  console.log("[v0] clearAllOrders() - Clearing all", orders.length, "orders")
  orders = []
  orderIdCounter = 1
  saveToStorage() // Clear localStorage when clearing orders
  return true
}
