"use client"

import { useEffect, useState, useRef } from "react"
import { fetchOrders } from "@/lib/api-client"

export function useRealTimeOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const previousOrdersRef = useRef<any[]>([])

  useEffect(() => {
    const pollOrders = async () => {
      try {
        const data = await fetchOrders()
        setOrders(data.orders)
        previousOrdersRef.current = data.orders
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error fetching orders:", error)
      }
    }

    // Initial fetch
    pollOrders()

    // Poll every 1 second for real-time updates
    const interval = setInterval(pollOrders, 1000)

    return () => clearInterval(interval)
  }, [])

  return { orders, loading }
}
