"use client"

import { useEffect, useRef } from "react"
import { playNotificationSound, showBrowserNotification } from "@/lib/notifications"

export function useOrderNotifications(orders: any[]) {
  const previousOrdersRef = useRef<any[]>([])

  useEffect(() => {
    const previousOrders = previousOrdersRef.current

    // Check for new completed orders
    orders.forEach((order) => {
      const previousOrder = previousOrders.find((o) => o.id === order.id)

      if (previousOrder && previousOrder.status !== "completed" && order.status === "completed") {
        playNotificationSound()
        showBrowserNotification("Order Ready!", {
          body: `Table ${order.tableNumber || "Takeaway"} - Order #${order.id} is ready!`,
          icon: "/diverse-food-spread.png",
        })
      }

      if (previousOrder && previousOrder.status !== "pending" && order.status === "pending") {
        playNotificationSound()
        showBrowserNotification("New Order!", {
          body: `New order for ${order.tableNumber ? `Table ${order.tableNumber}` : "Takeaway"} - Order #${order.id}`,
          icon: "/abstract-order.png",
        })
      }
    })

    previousOrdersRef.current = orders
  }, [orders])
}
