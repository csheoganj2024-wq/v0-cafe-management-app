const orders: any[] = []
let orderIdCounter = 1

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
  console.log("[v0] updateOrder() - Order updated successfully:", { id: order.id, status: order.status })
  return order
}
