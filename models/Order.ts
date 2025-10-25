import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  userId: string;
  items: any[];
  total: number;
  timestamp: Date;
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    total: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "orders" }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
