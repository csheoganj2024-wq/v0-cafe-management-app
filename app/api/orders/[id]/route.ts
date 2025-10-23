import { getOrderById, updateOrder, getOrders } from "@/lib/orders-store"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { status } = body

  const orderId = Number.parseInt(params.id)
  console.log("[v0] PATCH /api/orders/[id] - Received request for order ID:", orderId, "new status:", status)
  console.log(
    "[v0] PATCH /api/orders/[id] - Current orders in store:",
    getOrders().map((o) => ({ id: o.id, status: o.status })),
  )

  const order = getOrderById(orderId)

  if (!order) {
    console.log("[v0] PATCH /api/orders/[id] - Order not found for ID:", orderId)
    return Response.json({ error: "Order not found" }, { status: 404 })
  }

  const updates: any = { status }

  if (status === "completed") {
    updates.completedAt = new Date().toISOString()
  } else if (status === "billed") {
    updates.billedAt = new Date().toISOString()
  }

  console.log("[v0] PATCH /api/orders/[id] - Updating order", orderId, "with updates:", updates)
  const updatedOrder = updateOrder(orderId, updates)
  console.log("[v0] PATCH /api/orders/[id] - Updated order:", { id: updatedOrder?.id, status: updatedOrder?.status })
  return Response.json(updatedOrder)
}
