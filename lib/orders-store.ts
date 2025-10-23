const orders: any[] = []
let orderIdCounter = 1

export function getOrders() {
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
  return newOrder
}

export function getOrderById(id: number) {
  return orders.find((o) => o.id === id)
}

export function updateOrder(id: number, updates: any) {
  const order = orders.find((o) => o.id === id)
  if (!order) return null

  Object.assign(order, updates)
  return order
}
