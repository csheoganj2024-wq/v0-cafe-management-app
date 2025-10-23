import { getOrderById, updateOrder } from "@/lib/orders-store"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { status } = body

  const order = getOrderById(Number.parseInt(params.id))

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 })
  }

  const updates: any = { status }

  if (status === "completed") {
    updates.completedAt = new Date().toISOString()
  } else if (status === "billed") {
    updates.billedAt = new Date().toISOString()
  }

  const updatedOrder = updateOrder(Number.parseInt(params.id), updates)
  return Response.json(updatedOrder)
}
