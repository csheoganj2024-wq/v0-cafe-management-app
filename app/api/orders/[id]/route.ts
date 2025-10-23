const orders: any[] = []

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { status } = body

  // In a real app, fetch from database
  const order = orders.find((o) => o.id === Number.parseInt(params.id))

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 })
  }

  if (status === "completed") {
    order.status = "completed"
    order.completedAt = new Date().toISOString()
  } else if (status === "billed") {
    order.status = "billed"
    order.billedAt = new Date().toISOString()
  }

  return Response.json(order)
}
