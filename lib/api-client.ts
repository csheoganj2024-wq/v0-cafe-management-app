export async function fetchOrders() {
  const response = await fetch("/api/orders")
  return response.json()
}

export async function createOrder(items: any[], tableNumber: string, orderType: string) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, tableNumber, orderType }),
  })
  return response.json()
}

export async function updateOrderStatus(orderId: number, status: string) {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  return response.json()
}
