const orders: any[] = []
let orderIdCounter = 1

export async function GET() {
  return Response.json({ orders })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { items, tableNumber, orderType } = body

  const newOrder = {
    id: orderIdCounter++,
    items,
    tableNumber,
    orderType,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
    billedAt: null,
  }

  orders.push(newOrder)
  return Response.json(newOrder, { status: 201 })
}
