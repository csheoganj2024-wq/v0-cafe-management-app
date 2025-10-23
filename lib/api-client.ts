export async function fetchOrders() {
  try {
    const response = await fetch("/api/orders")
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status}`)
    }
    return response.json()
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    throw error
  }
}

export async function createOrder(items: any[], tableNumber: string, orderType: string) {
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, tableNumber, orderType }),
    })
    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.status}`)
    }
    return response.json()
  } catch (error) {
    console.error("[v0] Error creating order:", error)
    throw error
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    console.log("[v0] Updating order", orderId, "to status", status)
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to update order: ${response.status}`)
    }
    const result = await response.json()
    console.log("[v0] Order updated successfully:", result)
    return result
  } catch (error) {
    console.error("[v0] Error updating order:", error)
    throw error
  }
}
