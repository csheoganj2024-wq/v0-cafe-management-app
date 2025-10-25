"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LogOut,
  Check,
  FileText,
  BarChart3,
  Clock,
  AlertCircle,
  RefreshCw,
  Printer,
  Plus,
  Minus,
} from "lucide-react"
import { MENU_ITEMS, CATEGORIES } from "@/lib/menu-data"
import type { OrderItem } from "@/lib/store"
import { requestNotificationPermission, playBillGeneratedSound, showBrowserNotification } from "@/lib/notifications"

interface ManagerDashboardProps {
  onLogout: () => void
}

export function ManagerDashboard({ onLogout }: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "takeaway" | "billing" | "history" | "analytics">("orders")
  const [refreshTime, setRefreshTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [takeawayItems, setTakeawayItems] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("")
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [clearPassword, setClearPassword] = useState("")
  const [clearError, setClearError] = useState("")
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // ------------------------------
  // FETCH ORDERS FROM SERVER
  // ------------------------------
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const res = await fetch("/api/orders") // MongoDB-backed API
      if (!res.ok) throw new Error("Failed to fetch orders")
      const data = await res.json()
      setOrders(data)
      localStorage.setItem("localOrders", JSON.stringify(data))
    } catch (err) {
      console.error(err)
      const cached = localStorage.getItem("localOrders")
      if (cached) setOrders(JSON.parse(cached))
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    requestNotificationPermission()
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000) // live updates
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setRefreshTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    fetchOrders().finally(() => setIsRefreshing(false))
  }

  // ------------------------------
  // ORDER OPERATIONS
  // ------------------------------
  const updateOrderStatusServer = async (
    orderId: string,
    status: "pending" | "completed" | "billed"
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      const updatedOrder = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)))
      localStorage.setItem("localOrders", JSON.stringify(orders))
    } catch (err) {
      console.error(err)
    }
  }

  const submitTakeawayOrder = async () => {
    if (takeawayItems.length === 0) return
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: takeawayItems, type: "takeaway" }),
      })
      if (!res.ok) throw new Error("Failed to create order")
      const newOrder = await res.json()
      setOrders((prev) => [...prev, newOrder])
      setTakeawayItems([])
      localStorage.setItem("localOrders", JSON.stringify([...orders, newOrder]))
    } catch (err) {
      console.error(err)
    }
  }

  const addItemToTakeaway = (itemId: string) => {
    const item = MENU_ITEMS.find((m) => m.id === itemId)
    if (!item) return

    setTakeawayItems((prev) => {
      const existing = prev.find((oi) => oi.itemId === itemId)
      if (existing) {
        return prev.map((oi) => (oi.itemId === itemId ? { ...oi, quantity: oi.quantity + 1 } : oi))
      }
      return [
        ...prev,
        { itemId, itemName: item.name, quantity: 1, price: item.price },
      ]
    })
  }

  const removeItemFromTakeaway = (itemId: string) => {
    setTakeawayItems((prev) => {
      const existing = prev.find((oi) => oi.itemId === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map((oi) => (oi.itemId === itemId ? { ...oi, quantity: oi.quantity - 1 } : oi))
      }
      return prev.filter((oi) => oi.itemId !== itemId)
    })
  }

  const handleClearHistory = async () => {
    if (!clearPassword) {
      setClearError("Please enter password")
      return
    }
    try {
      const res = await fetch("/api/orders/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: clearPassword }),
      })
      if (!res.ok) {
        setClearError("Invalid password")
        return
      }
      setOrders([])
      localStorage.removeItem("localOrders")
      setShowClearDialog(false)
      setClearPassword("")
    } catch (err) {
      console.error(err)
      setClearError("Failed to clear history")
    }
  }

  // ------------------------------
  // FILTER / STATS
  // ------------------------------
  const getFilteredOrders = () => {
    if (!historyDateFilter) return orders
    const filterDate = new Date(historyDateFilter)
    filterDate.setHours(0, 0, 0, 0)
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      orderDate.setHours(0, 0, 0, 0)
      return orderDate.getTime() === filterDate.getTime()
    })
  }

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const completedOrders = orders.filter((o) => o.status === "completed")
  const billedOrders = orders.filter((o) => o.status === "billed")

  const totalRevenue = billedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalOrders = orders.length
  const completionRate =
    totalOrders > 0 ? Math.round(((completedOrders.length + billedOrders.length) / totalOrders) * 100) : 0

  const categoryItems = MENU_ITEMS.filter((item) => item.category === selectedCategory)
  const takeawayTotal = takeawayItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const filteredHistoryOrders = getFilteredOrders()

  // ------------------------------
  // PRINT BILL
  // ------------------------------
  const handlePrintBill = (order: any) => {
    playBillGeneratedSound()
    showBrowserNotification("Bill Printed!", { body: `Order #${order.id} - ₹${order.totalAmount}` })
    const printWindow = window.open("", "", "height=600,width=400")
    if (!printWindow) return

    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head><title>Bill - ${order.id}</title></head>
      <body>
      <h3>BLOOM CAFE</h3>
      <p>Bill #${order.id}</p>
      <p>${order.orderType === "dine-in" ? `Table ${order.tableNumber}` : "Takeaway"}</p>
      <hr/>
      ${order.items.map((i: any) => `<p>${i.quantity} x ${i.itemName} - ₹${i.price * i.quantity}</p>`).join("")}
      <hr/>
      <p>Total: ₹${order.totalAmount}</p>
      </body>
      </html>
    `
    printWindow.document.write(billHTML)
    printWindow.document.close()
    printWindow.print()
  }

  // ------------------------------
  // RENDER UI
  // ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
      {/* ... UI code remains mostly the same as your original ManagerDashboard ... */}
      {/* Just replace `apiOrders` with `orders` */}
      {/* Use updateOrderStatusServer instead of updateOrderStatus */}
    </div>
  )
}
