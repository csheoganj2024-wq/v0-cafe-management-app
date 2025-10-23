"use client"

import { useEffect, useRef } from "react"
import {
  playNewOrderSound,
  playOrderReadySound,
  playBillGeneratedSound,
  playTakeawayOrderSound,
  showBrowserNotification,
} from "@/lib/notifications"

export function useOrderNotifications(orders: any[]) {
  const previousOrdersRef = useRef<any[]>([])

  useEffect(() => {
    const previousOrders = previousOrdersRef.current

    // Check for new completed orders
    orders.forEach((order) => {
      const previousOrder = previousOrders.find((o) => o.id === order.id)

      if (previousOrder && previousOrder.status !== "completed" && order.status === "completed") {
        playOrderReadySound()
        showBrowserNotification("Order Ready!", {
          body: `Table ${order.tableNumber || "Takeaway"} - Order #${order.id} is ready!`,
          icon: "/diverse-food-spread.png",
        })
      }

      if (previousOrder && previousOrder.status !== "billed" && order.status === "billed") {
        playBillGeneratedSound()
        showBrowserNotification("Bill Generated!", {
          body: `Order #${order.id} - ₹${order.totalAmount}`,
          icon: "/abstract-order.png",
        })
      }

      if (previousOrder && previousOrder.status !== "pending" && order.status === "pending") {
        if (order.orderType === "takeaway") {
          playTakeawayOrderSound()
          showBrowserNotification("Takeaway Order!", {
            body: `New takeaway order #${order.id}`,
            icon: "/abstract-order.png",
          })
        } else {
          playNewOrderSound()
          showBrowserNotification("New Order!", {
            body: `New order for Table ${order.tableNumber} - Order #${order.id}`,
            icon: "/abstract-order.png",
          })
        }
      }
    })

    previousOrdersRef.current = orders
  }, [orders])
}
