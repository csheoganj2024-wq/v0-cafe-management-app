import { clearAllOrders } from "@/lib/orders-store"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (password !== "Kalpesh#1006") {
      console.log("[v0] Clear history attempt with wrong password")
      return Response.json({ error: "Invalid password" }, { status: 401 })
    }

    clearAllOrders()
    console.log("[v0] History cleared successfully")
    return Response.json({ success: true, message: "All history cleared" })
  } catch (error) {
    console.error("[v0] Error clearing history:", error)
    return Response.json({ error: "Failed to clear history" }, { status: 500 })
  }
}
