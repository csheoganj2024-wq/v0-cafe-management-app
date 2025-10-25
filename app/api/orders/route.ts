import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose, { Schema } from "mongoose";

// Define Order schema (quick inline version so you don’t *need* /models yet)
const OrderSchema = new Schema({
  items: { type: Array, required: true },
  tableNumber: { type: String },
  orderType: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Order =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

// GET /api/orders
export async function GET() {
  console.log("[v0] GET /api/orders called");
  await connectDB();

  const orders = await Order.find().sort({ createdAt: -1 });
  console.log("[v0] GET /api/orders - Returning", orders.length, "orders");

  return NextResponse.json({ orders });
}

// POST /api/orders
export async function POST(request: Request) {
  console.log("[v0] POST /api/orders called");
  await connectDB();

  const body = await request.json();
  const { items, tableNumber, orderType } = body;

  if (!items || !items.length) {
    return NextResponse.json(
      { error: "Items are required" },
      { status: 400 }
    );
  }

  const newOrder = await Order.create({
    items,
    tableNumber,
    orderType,
  });

  console.log("[v0] POST /api/orders - Order created with ID:", newOrder._id);

  return NextResponse.json(newOrder, { status: 201 });
}
