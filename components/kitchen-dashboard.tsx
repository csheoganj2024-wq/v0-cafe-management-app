"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MENU_ITEMS, CATEGORIES } from "@/lib/menu-data";
import { useStore, type OrderItem } from "@/lib/store";
import { Plus, Minus, LogOut, Check, Bell, Loader2 } from "lucide-react";
import { useRealTimeOrders } from "@/hooks/use-real-time-orders";
import { useOrderNotifications } from "@/hooks/use-order-notifications";
import { requestNotificationPermission, playNewOrderSound, showBrowserNotification } from "@/lib/notifications";

interface KitchenDashboardProps {
  onLogout: () => void;
}

export function KitchenDashboard({ onLogout }: KitchenDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState<number | "">("");
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("dine-in");
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [completingOrderId, setCompletingOrderId] = useState<number | null>(null);
  const { orders } = useStore();
  const { orders: apiOrders, loading } = useRealTimeOrders();

  useOrderNotifications(apiOrders);

  // Ask for notification permission
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Auto-refresh time every 2s
  useEffect(() => {
    const interval = setInterval(() => setRefreshTime(new Date()), 2000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Auto-sync local orders to server when app starts
  useEffect(() => {
    const syncLocalOrders = async () => {
      const localOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      if (!localOrders.length) return;

      for (const order of localOrders) {
        try {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order),
          });
        } catch (err) {
          console.warn("⚠️ Could not sync local order:", err);
        }
      }

      localStorage.removeItem("orders");
    };

    syncLocalOrders();
  }, []);

  const categoryItems = MENU_ITEMS.filter((item) => item.category === selectedCategory);

  const addItemToOrder = (itemId: string) => {
    const item = MENU_ITEMS.find((m) => m.id === itemId);
    if (!item) return;

    setCurrentOrder((prev) => {
      const existing = prev.find((oi) => oi.itemId === itemId);
      if (existing) {
        return prev.map((oi) =>
          oi.itemId === itemId ? { ...oi, quantity: oi.quantity + 1 } : oi
        );
      }
      return [
        ...prev,
        {
          itemId,
          itemName: item.name,
          quantity: 1,
          price: item.price,
        },
      ];
    });
  };

  const removeItemFromOrder = (itemId: string) => {
    setCurrentOrder((prev) => {
      const existing = prev.find((oi) => oi.itemId === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((oi) =>
          oi.itemId === itemId ? { ...oi, quantity: oi.quantity - 1 } : oi
        );
      }
      return prev.filter((oi) => oi.itemId !== itemId);
    });
  };

  // ✅ Save both locally and to server
  const submitOrder = async () => {
    if (currentOrder.length === 0) return;
    if (orderType === "dine-in" && !tableNumber) {
      alert("Please enter a table number for dine-in orders");
      return;
    }

    const newOrder = {
      items: currentOrder,
      tableNumber: orderType === "dine-in" ? String(tableNumber) : "takeaway",
      orderType,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    // ✅ Save to localStorage
    const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    localStorage.setItem("orders", JSON.stringify([newOrder, ...existingOrders]));

    // ✅ Try saving to MongoDB via API
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder),
      });
      console.log("✅ Order synced with server");
    } catch (err) {
      console.warn("⚠️ Server sync failed, saved locally only", err);
    }

    // ✅ Notifications
    playNewOrderSound();
    showBrowserNotification("Order Submitted!", {
      body: `${orderType === "dine-in" ? `Table ${tableNumber}` : "Takeaway"} order submitted successfully`,
    });

    // ✅ Reset state
    setCurrentOrder([]);
    setTableNumber("");
    setOrderType("dine-in");
  };

  const handleMarkComplete = async (orderId: number) => {
    try {
      setCompletingOrderId(orderId);
      const result = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!result.ok) throw new Error("Failed to update order");
      console.log("✅ Order completed successfully");
    } catch (error) {
      console.error("[v0] Error marking order complete:", error);
      alert("Failed to mark order as complete. Please try again.");
    } finally {
      setCompletingOrderId(null);
    }
  };

  const orderTotal = currentOrder.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const pendingOrders = apiOrders.filter((o) => o.status === "pending");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-orange-900">
              Kitchen Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Bloom Cafe • Last updated: {refreshTime.toLocaleTimeString()}
            </p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="gap-2 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  className={
                    selectedCategory === category
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : ""
                  }
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addItemToOrder(item.id)}
                >
                  <CardContent className="p-3">
                    <p className="font-medium text-sm line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-orange-600 font-bold mt-2">
                      ₹{item.price}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  Pending Orders ({pendingOrders.length})
                </h3>
                <div className="grid gap-3">
                  {pendingOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="border-orange-300 bg-orange-50"
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-orange-900">
                            {order.id}
                          </p>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              order.orderType === "dine-in"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {order.orderType === "dine-in"
                              ? `Table ${order.tableNumber}`
                              : "Takeaway"}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {order.items.map((item) => (
                            <p key={item.itemId} className="text-sm">
                              {item.quantity}x {item.itemName}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Ordered:{" "}
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                        <Button
                          onClick={() => handleMarkComplete(order.id)}
                          disabled={completingOrderId === order.id}
                          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          size="sm"
                        >
                          {completingOrderId === order.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Completing...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Mark Complete
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Current Order</CardTitle>
                <CardDescription>Items in order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 pb-3 border-b">
                  <div>
                    <label className="text-sm font-medium">Order Type</label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        size="sm"
                        variant={
                          orderType === "dine-in" ? "default" : "outline"
                        }
                        onClick={() => setOrderType("dine-in")}
                        className={
                          orderType === "dine-in"
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }
                      >
                        Dine-in
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          orderType === "takeaway" ? "default" : "outline"
                        }
                        onClick={() => setOrderType("takeaway")}
                        className={
                          orderType === "takeaway"
                            ? "bg-purple-600 hover:bg-purple-700"
                            : ""
                        }
                      >
                        Takeaway
                      </Button>
                    </div>
                  </div>

                  {orderType === "dine-in" && (
                    <div>
                      <label className="text-sm font-medium">
                        Table Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tableNumber}
                        onChange={(e) =>
                          setTableNumber(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                        placeholder="Enter table number"
                        className="w-full mt-1 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  )}
                </div>

                {currentOrder.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No items added yet
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {currentOrder.map((item) => (
                        <div
                          key={item.itemId}
                          className="flex items-center justify-between p-2 bg-orange-50 rounded"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">
                              {item.itemName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ₹{item.price} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItemFromOrder(item.itemId)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addItemToOrder(item.itemId)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-orange-600">₹{orderTotal}</span>
                      </div>
                      <Button
                        onClick={submitOrder}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Submit Order
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
