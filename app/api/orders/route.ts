import { getOrders, createOrder as storeCreateOrder } from "@/lib/orders-store"

export async function GET() {
  console.log("[v0] GET /api/orders called")
  const orders = getOrders()
  console.log("[v0] GET /api/orders - Returning", orders.length, "orders")
  return Response.json({ orders })
}

export async function POST(request: Request) {
  console.log("[v0] POST /api/orders called")
  const body = await request.json()
  const { items, tableNumber, orderType } = body
  console.log("[v0] POST /api/orders - Creating order with:", { items: items.length, tableNumber, orderType })

  const newOrder = storeCreateOrder({
    items,
    tableNumber,
    orderType,
  })

  console.log("[v0] POST /api/orders - Order created with ID:", newOrder.id)
  return Response.json(newOrder, { status: 201 })
}
