import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

export interface OrderItem {
  itemId: string
  itemName: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  items: OrderItem[]
  status: "pending" | "completed" | "billed"
  createdAt: Date
  completedAt?: Date
  billedAt?: Date
  totalAmount: number
  lastUpdated: Date
  tableNumber?: number
  orderType: "dine-in" | "takeaway"
}

interface StoreState {
  orders: Order[]
  addOrder: (order: Order) => void
  updateOrderStatus: (orderId: string, status: Order["status"]) => void
  getOrders: () => Order[]
  getOrderById: (id: string) => Order | undefined
  getRecentlyUpdatedOrders: (seconds: number) => Order[]
}

export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
    orders: [],
    addOrder: (order) =>
      set((state) => ({
        orders: [...state.orders, { ...order, lastUpdated: new Date() }],
      })),
    updateOrderStatus: (orderId, status) =>
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status,
                completedAt: status === "completed" ? new Date() : order.completedAt,
                billedAt: status === "billed" ? new Date() : order.billedAt,
                lastUpdated: new Date(),
              }
            : order,
        ),
      })),
    getOrders: () => get().orders,
    getOrderById: (id) => get().orders.find((order) => order.id === id),
    getRecentlyUpdatedOrders: (seconds) => {
      const now = new Date()
      return get().orders.filter((order) => {
        const timeDiff = (now.getTime() - order.lastUpdated.getTime()) / 1000
        return timeDiff <= seconds
      })
    },
  })),
)
