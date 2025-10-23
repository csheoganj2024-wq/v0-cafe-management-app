import { getOrders, createOrder as storeCreateOrder } from "@/lib/orders-store"

export async function GET() {
  const orders = getOrders()
  return Response.json({ orders })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { items, tableNumber, orderType } = body

  const newOrder = storeCreateOrder({
    items,
    tableNumber,
    orderType,
  })

  return Response.json(newOrder, { status: 201 })
}
