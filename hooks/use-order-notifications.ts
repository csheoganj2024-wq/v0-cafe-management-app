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
  const notifiedOrdersRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const previousOrders = previousOrdersRef.current

    orders.forEach((order) => {
      const previousOrder = previousOrders.find((o) => o.id === order.id)
      const orderId = order.id

      // New order detection
      if (!previousOrder && order.status === "pending") {
        if (!notifiedOrdersRef.current.has(orderId)) {
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
          notifiedOrdersRef.current.add(orderId)
        }
      }

      // Order completed detection
      if (previousOrder && previousOrder.status !== "completed" && order.status === "completed") {
        if (!notifiedOrdersRef.current.has(orderId + 1000)) {
          playOrderReadySound()
          showBrowserNotification("Order Ready!", {
            body: `Table ${order.tableNumber || "Takeaway"} - Order #${order.id} is ready!`,
            icon: "/diverse-food-spread.png",
          })
          notifiedOrdersRef.current.add(orderId + 1000)
        }
      }

      // Bill generated detection
      if (previousOrder && previousOrder.status !== "billed" && order.status === "billed") {
        if (!notifiedOrdersRef.current.has(orderId + 2000)) {
          playBillGeneratedSound()
          showBrowserNotification("Bill Generated!", {
            body: `Order #${order.id} - ₹${order.totalAmount}`,
            icon: "/abstract-order.png",
          })
          notifiedOrdersRef.current.add(orderId + 2000)
        }
      }
    })

    previousOrdersRef.current = JSON.parse(JSON.stringify(orders))
  }, [orders])
}
