"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Check, FileText, BarChart3, Clock, AlertCircle, RefreshCw, Printer, Plus, Minus } from "lucide-react";
import { MENU_ITEMS as DEFAULT_MENU_ITEMS, CATEGORIES } from "@/lib/menu-data";
import type { OrderItem } from "@/lib/store";
import { useRealTimeOrders } from "@/hooks/use-real-time-orders";
import { useOrderNotifications } from "@/hooks/use-order-notifications";
import { requestNotificationPermission } from "@/lib/notifications";
import { playBillGeneratedSound, showBrowserNotification } from "@/lib/notifications";

interface ManagerDashboardProps {
  onLogout: () => void;
}

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type LocalOrder = {
  id: string;
  userId?: string;
  items: OrderItem[];
  tableNumber?: string | null;
  orderType: "dine-in" | "takeaway";
  createdAt: string;
  status: "pending" | "completed" | "billed";
  totalAmount: number;
  synced?: boolean;
  billedAt?: string | null;
};

export function ManagerDashboard({ onLogout }: ManagerDashboardProps) {
  // Tabs & UI state
  const [activeTab, setActiveTab] = useState<"orders" | "takeaway" | "billing" | "history" | "analytics" | "menu">("orders");
  const [refreshTime, setRefreshTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Takeaway creation
  const [takeawayItems, setTakeawayItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  // History / clear
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("");
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearPassword, setClearPassword] = useState("");
  const [clearError, setClearError] = useState("");

  // Local storage caches
  const [localOrders, setLocalOrders] = useState<LocalOrder[]>([]);
  const [localMenu, setLocalMenu] = useState<MenuItem[]>([]);

  // Realtime server orders (from your existing hook)
  const { orders: apiOrders, loading } = useRealTimeOrders();
  useOrderNotifications(apiOrders);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // clock
  useEffect(() => {
    const interval = setInterval(() => setRefreshTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // load local orders/menu
  useEffect(() => {
    const saved = localStorage.getItem("localOrders");
    if (saved) {
      try {
        setLocalOrders(JSON.parse(saved));
      } catch {
        setLocalOrders([]);
      }
    }
    const savedMenu = localStorage.getItem("localMenu");
    if (savedMenu) {
      try {
        setLocalMenu(JSON.parse(savedMenu));
      } catch {
        setLocalMenu(DEFAULT_MENU_ITEMS as MenuItem[]);
      }
    } else {
      // initialize local menu with default menu items if not present
      setLocalMenu(DEFAULT_MENU_ITEMS as MenuItem[]);
      localStorage.setItem("localMenu", JSON.stringify(DEFAULT_MENU_ITEMS));
    }
  }, []);

  // keep localOrders in sync with localStorage
  const persistLocalOrders = (orders: LocalOrder[]) => {
    setLocalOrders(orders);
    localStorage.setItem("localOrders", JSON.stringify(orders));
  };

  // helper API functions (use internal fetch so no external dependency)
  const apiCreateOrder = async (payload: Partial<LocalOrder>) => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("API create failed");
      const data = await res.json();
      return data;
    } catch (err) {
      // network error or API down
      console.warn("apiCreateOrder failed:", err);
      throw err;
    }
  };

  const apiUpdateOrderStatus = async (orderId: number | string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("API update failed");
      return await res.json();
    } catch (err) {
      console.warn("apiUpdateOrderStatus failed:", err);
      throw err;
    }
  };

  const apiClearHistory = async (password: string) => {
    try {
      const res = await fetch("/api/orders/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password or server error");
      return await res.json();
    } catch (err) {
      console.warn("apiClearHistory failed:", err);
      throw err;
    }
  };

  const apiAddMenuItem = async (menuItem: MenuItem) => {
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(menuItem),
      });
      if (!res.ok) throw new Error("Failed to add menu item on server");
      return await res.json();
    } catch (err) {
      console.warn("apiAddMenuItem failed:", err);
      throw err;
    }
  };

  // try to sync any unsynced local orders to server when online
  useEffect(() => {
    const syncPending = async () => {
      if (!navigator.onLine) return;
      const pending = localOrders.filter((o) => !o.synced);
      if (pending.length === 0) return;
      for (const p of pending) {
        try {
          // Try create on server
          const serverResp = await apiCreateOrder({
            userId: p.userId || "manager",
            items: p.items,
            totalAmount: p.totalAmount,
            orderType: p.orderType,
            tableNumber: p.tableNumber,
            createdAt: p.createdAt,
            status: p.status,
          });
          // mark as synced locally (keep server id if available)
          p.synced = true;
          // if server returns id, try store it locally as order.id
          if (serverResp && serverResp.id) {
            p.id = serverResp.id;
          }
          persistLocalOrders([...localOrders.filter((x) => x.id !== p.id), p]);
        } catch (err) {
          // if any single order fails, skip and continue next time
          console.warn("Failed to sync a local order:", p.id, err);
        }
      }
    };

    // run once immediately and whenever localOrders change or online event fires
    syncPending();

    const onOnline = () => syncPending();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localOrders]);

  // clear local orders and server (via API)
  const handleClearHistory = async () => {
    if (!clearPassword) {
      setClearError("Please enter password");
      return;
    }
    try {
      await apiClearHistory(clearPassword);
      // clear local too
      persistLocalOrders([]);
      setClearPassword("");
      setClearError("");
      setShowClearDialog(false);
      setRefreshTime(new Date());
    } catch (err) {
      setClearError("Invalid password or server error");
    }
  };

  // Takeaway helpers
  const addItemToTakeaway = (itemId: string) => {
    const item = localMenu.find((m) => m.id === itemId) || DEFAULT_MENU_ITEMS.find((m) => m.id === itemId);
    if (!item) return;
    setTakeawayItems((prev) => {
      const existing = prev.find((oi) => oi.itemId === itemId);
      if (existing) {
        return prev.map((oi) => (oi.itemId === itemId ? { ...oi, quantity: oi.quantity + 1 } : oi));
      }
      return [...prev, { itemId, itemName: item.name, quantity: 1, price: item.price }];
    });
  };

  const removeItemFromTakeaway = (itemId: string) => {
    setTakeawayItems((prev) => {
      const existing = prev.find((oi) => oi.itemId === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((oi) => (oi.itemId === itemId ? { ...oi, quantity: oi.quantity - 1 } : oi));
      }
      return prev.filter((oi) => oi.itemId !== itemId);
    });
  };

  const submitTakeawayOrder = async () => {
    if (takeawayItems.length === 0) return;
    const total = takeawayItems.reduce((s, it) => s + it.price * it.quantity, 0);
    const newOrder: LocalOrder = {
      id: `local-${Date.now()}`,
      userId: "manager",
      items: takeawayItems,
      tableNumber: "takeaway",
      orderType: "takeaway",
      createdAt: new Date().toISOString(),
      status: "pending",
      totalAmount: total,
      synced: false,
    };

    // save locally
    persistLocalOrders([newOrder, ...localOrders]);

    // attempt to push to server (best-effort)
    try {
      const resp = await apiCreateOrder({
        userId: newOrder.userId,
        items: newOrder.items,
        totalAmount: newOrder.totalAmount,
        orderType: newOrder.orderType,
        tableNumber: newOrder.tableNumber,
        createdAt: newOrder.createdAt,
        status: newOrder.status,
      });
      if (resp && resp.id) {
        newOrder.id = resp.id;
        newOrder.synced = true;
        persistLocalOrders([newOrder, ...localOrders.filter((o) => o.id !== newOrder.id)]);
      }
    } catch {
      // server down — it's saved locally and will be attempted to sync later
    }

    setTakeawayItems([]);
    setActiveTab("orders");
  };

  // mark order ready/completed -> will update server and leave local copy synced as possible
  const markOrderReady = async (orderId: number | string) => {
    try {
      await apiUpdateOrderStatus(orderId, "completed");
    } catch {
      // if server fails, also update local copy if present
      const updated = localOrders.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o));
      persistLocalOrders(updated);
    } finally {
      setRefreshTime(new Date());
    }
  };

  const markOrderBilled = async (orderId: number | string) => {
    try {
      const resp = await apiUpdateOrderStatus(orderId, "billed");
      // if server gives billedAt or total, you can use it
    } catch {
      // fallback local update
      const updated = localOrders.map((o) =>
        o.id === orderId ? { ...o, status: "billed", billedAt: new Date().toISOString() } : o,
      );
      persistLocalOrders(updated);
    } finally {
      setRefreshTime(new Date());
    }
  };

  // printing bill (same layout as your previous code)
  const handlePrintBill = (order: any) => {
    playBillGeneratedSound();
    showBrowserNotification("Bill Printed!", {
      body: `Order #${order.id} - ₹${order.totalAmount}`,
    });

    const printWindow = window.open("", "", "height=600,width=400");
    if (!printWindow) return;

    const billHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill - ${order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; width: 80mm; max-width: 80mm; margin: 0 auto; padding: 0; background: white; font-size: 12px; line-height: 1.2;}
            .container { width: 100%; padding: 8px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .cafe-name { font-size: 14px; font-weight: bold; margin-bottom: 2px; letter-spacing: 1px; }
            .cafe-details { font-size: 10px; line-height: 1.3; margin-bottom: 4px; }
            .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
            .items-header { display:flex; justify-content: space-between; font-size:11px; font-weight:bold; border-bottom:1px dashed #000; padding-bottom:4px; margin-bottom:4px; }
            .item-row { display:flex; justify-content: space-between; font-size:11px; padding:3px 0; border-bottom:1px dotted #ccc;}
            .total-section { border-top:1px solid #000; border-bottom:1px solid #000; padding:6px 0; margin:8px 0; font-weight:bold; display:flex; justify-content:space-between; font-size:13px; }
            .footer { text-align:center; font-size:10px; margin-top:8px; border-top:1px dashed #000; padding-top:6px; }
            @media print { body { width:80mm; margin:0; padding:0; } .container{ padding:4px; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="cafe-name">BLOOM CAFE</div>
              <div class="cafe-details">
                <div>Deora Plaza</div>
                <div>Kesarpura Road, Sheoganj</div>
                <div>Ph: 9001160228</div>
              </div>
            </div>
            <div>
              <div><strong>Bill #${order.id}</strong></div>
              <div style="font-size:10px">${new Date(order.billedAt || order.createdAt).toLocaleString()}</div>
              <div style="padding:6px 0; background:#f7f7f7; margin-top:6px; text-align:center;">
                ${order.orderType === "dine-in" ? `TABLE ${order.tableNumber || ""}` : "TAKEAWAY"}
              </div>
            </div>
            <div class="divider"></div>
            <div class="items-header">
              <div style="flex:1;">Item</div>
              <div style="width:15mm; text-align:center;">Qty</div>
              <div style="width:15mm; text-align:right;">Price</div>
            </div>
            ${order.items
              .map(
                (item: any) => `<div class="item-row"><div style="flex:1;">${item.itemName}</div><div style="width:15mm;text-align:center;">${item.quantity}</div><div style="width:15mm;text-align:right;">₹${item.price * item.quantity}</div></div>`,
              )
              .join("")}
            <div class="total-section"><span>TOTAL</span><span>₹${order.totalAmount}</span></div>
            <div class="footer"><div>Thank You!</div><div>Visit Again</div><div style="margin-top:4px;font-size:9px;">${new Date().toLocaleString()}</div></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // analytics derived
  const pendingOrders = apiOrders.filter((o) => o.status === "pending");
  const completedOrders = apiOrders.filter((o) => o.status === "completed");
  const billedOrders = apiOrders.filter((o) => o.status === "billed");
  const totalRevenue = billedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalOrders = apiOrders.length;
  const completionRate = totalOrders > 0 ? Math.round(((completedOrders.length + billedOrders.length) / totalOrders) * 100) : 0;

  const categoryItems = localMenu.filter((item) => item.category === selectedCategory);
  const takeawayTotal = takeawayItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // history filter
  const getFilteredOrders = () => {
    if (!historyDateFilter) return apiOrders;
    const filterDate = new Date(historyDateFilter);
    filterDate.setHours(0, 0, 0, 0);
    return apiOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === filterDate.getTime();
    });
  };
  const filteredHistoryOrders = getFilteredOrders();

  // Menu management: add local item (and try to push to server)
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuPrice, setNewMenuPrice] = useState<number | "">("");
  const [newMenuCategory, setNewMenuCategory] = useState(CATEGORIES[0]);
  const addMenuItem = async () => {
    if (!newMenuName || !newMenuPrice) return;
    const newItem: MenuItem = {
      id: `local-menu-${Date.now()}`,
      name: newMenuName,
      price: Number(newMenuPrice),
      category: newMenuCategory,
    };
    const updated = [newItem, ...localMenu];
    setLocalMenu(updated);
    localStorage.setItem("localMenu", JSON.stringify(updated));
    setNewMenuName("");
    setNewMenuPrice("");
    setNewMenuCategory(CATEGORIES[0]);

    // try server push (best-effort)
    try {
      await apiAddMenuItem(newItem);
    } catch {
      // ignore; local menu will be used anyway
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshTime(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Manager Dashboard</h1>
            <p className="text-sm text-muted-foreground">Bloom Cafe • Last updated: {refreshTime.toLocaleTimeString()}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleManualRefresh} variant="outline" className="gap-2 bg-transparent" disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={onLogout} variant="outline" className="gap-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Alert for pending orders */}
        {pendingOrders.length > 0 && (
          <div className="mb-6 p-4 bg-orange-100 border border-orange-300 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-900">{pendingOrders.length} order{pendingOrders.length !== 1 ? "s" : ""} waiting in kitchen</p>
              <p className="text-sm text-orange-800">Check the Live Orders tab for details</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold text-amber-600">{totalOrders}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={pendingOrders.length > 0 ? "border-orange-300 bg-orange-50" : ""}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className={`text-3xl font-bold ${pendingOrders.length > 0 ? "text-orange-600 animate-pulse" : "text-orange-600"}`}>
                  {pendingOrders.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-amber-600">₹{totalRevenue}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button onClick={() => setActiveTab("orders")} variant={activeTab === "orders" ? "default" : "outline"} className={activeTab === "orders" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""} size="sm">
            <Clock className="w-4 h-4 mr-2" /> Live Orders {pendingOrders.length > 0 && `(${pendingOrders.length})`}
          </Button>
          <Button onClick={() => setActiveTab("takeaway")} variant={activeTab === "takeaway" ? "default" : "outline"} className={activeTab === "takeaway" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Takeaway Orders
          </Button>
          <Button onClick={() => setActiveTab("billing")} variant={activeTab === "billing" ? "default" : "outline"} className={activeTab === "billing" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""} size="sm">
            <FileText className="w-4 h-4 mr-2" /> Billing
          </Button>
          <Button onClick={() => setActiveTab("history")} variant={activeTab === "history" ? "default" : "outline"} className={activeTab === "history" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""} size="sm">
            <Clock className="w-4 h-4 mr-2" /> History
          </Button>
          <Button onClick={() => setActiveTab("analytics")} variant={activeTab === "analytics" ? "default" : "outline"} className={activeTab === "analytics" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""} size="sm">
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics
          </Button>
          <Button onClick={() => setActiveTab("menu")} variant={activeTab === "menu" ? "default" : "outline"} className={activeTab === "menu" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""} size="sm">
            Menu
          </Button>
        </div>

        {/* Content */}
        <div>
          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Live Order Tracking</h2>
              <div className="grid gap-4">
                {pendingOrders.length === 0 && completedOrders.length === 0 ? (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground">No active orders</CardContent></Card>
                ) : (
                  <>
                    {pendingOrders.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 text-orange-700">Pending Orders</h3>
                        <div className="grid gap-3">
                          {pendingOrders.map((order) => (
                            <Card key={order.id} className="border-orange-200 animate-pulse">
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="font-bold text-lg">{order.id}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.orderType === "dine-in" ? `Table ${order.tableNumber}` : "Takeaway"} • {new Date(order.createdAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <Button onClick={() => markOrderReady(order.id)} className="bg-green-600 hover:bg-green-700 text-white gap-2" size="sm">
                                    <Check className="w-4 h-4" /> Mark Ready
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  {order.items.map((item: any) => <p key={item.itemId} className="text-sm">{item.quantity}x {item.itemName} - ₹{item.price * item.quantity}</p>)}
                                </div>
                                <p className="font-bold mt-3 text-amber-600">Total: ₹{order.totalAmount}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {completedOrders.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 text-green-700">Ready for Billing</h3>
                        <div className="grid gap-3">
                          {completedOrders.map((order) => (
                            <Card key={order.id} className="border-green-200">
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="font-bold text-lg">{order.id}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {order.orderType === "dine-in" ? `Table ${order.tableNumber}` : "Takeaway"} • Ready at {new Date(order.completedAt || order.createdAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <Button onClick={() => markOrderBilled(order.id)} className="bg-amber-600 hover:bg-amber-700 text-white gap-2" size="sm">
                                    <FileText className="w-4 h-4" /> Generate Bill
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  {order.items.map((item: any) => <p key={item.itemId} className="text-sm">{item.quantity}x {item.itemName} - ₹{item.price * item.quantity}</p>)}
                                </div>
                                <p className="font-bold mt-3 text-amber-600">Total: ₹{order.totalAmount}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAKEAWAY TAB */}
          {activeTab === "takeaway" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Create Takeaway Order</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => (
                      <Button key={category} onClick={() => setSelectedCategory(category)} variant={selectedCategory === category ? "default" : "outline"} className={selectedCategory === category ? "bg-purple-600 hover:bg-purple-700 text-white" : ""} size="sm">
                        {category}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => addItemToTakeaway(item.id)}>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                          <p className="text-purple-600 font-bold mt-2">₹{item.price}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Card className="sticky top-4">
                    <CardHeader><CardTitle>Takeaway Order</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {takeawayItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No items added yet</p>
                      ) : (
                        <>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {takeawayItems.map((item) => (
                              <div key={item.itemId} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                                <div className="flex-1">
                                  <p className="text-sm font-medium line-clamp-1">{item.itemName}</p>
                                  <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => removeItemFromTakeaway(item.itemId)} className="h-6 w-6 p-0"><Minus className="w-3 h-3" /></Button>
                                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                                  <Button size="sm" variant="ghost" onClick={() => addItemToTakeaway(item.itemId)} className="h-6 w-6 p-0"><Plus className="w-3 h-3" /></Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-3 space-y-2">
                            <div className="flex justify-between font-bold"><span>Total:</span><span className="text-purple-600">₹{takeawayTotal}</span></div>
                            <Button onClick={submitTakeawayOrder} className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"><Check className="w-4 h-4" /> Send to Kitchen</Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Billing</h2>
              {billedOrders.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground">No billed orders yet</CardContent></Card>
              ) : (
                <div className="grid gap-3">
                  {billedOrders.map((order) => (
                    <Card key={order.id} className="border-green-200">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.orderType === "dine-in" ? `Table ${order.tableNumber}` : "Takeaway"} • Billed at {new Date(order.billedAt || order.createdAt).toLocaleTimeString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handlePrintBill(order)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2" size="sm"><Printer className="w-4 h-4" /> Print</Button>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Completed</span>
                          </div>
                        </div>
                        <div className="space-y-1">{order.items.map((item: any) => <p key={item.itemId} className="text-sm">{item.quantity}x {item.itemName} - ₹{item.price * item.quantity}</p>)}</div>
                        <p className="font-bold mt-3 text-amber-600">Total: ₹{order.totalAmount}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Order History</h2>
                <Button onClick={() => setShowClearDialog(true)} variant="destructive" size="sm" className="gap-2">Clear History</Button>
              </div>

              <div className="flex gap-2">
                <input type="date" value={historyDateFilter} onChange={(e) => setHistoryDateFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm" />
                {historyDateFilter && <Button onClick={() => setHistoryDateFilter("")} variant="outline" size="sm">Clear Filter</Button>}
              </div>

              {showClearDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <Card className="w-96">
                    <CardHeader><CardTitle>Clear All History</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">This will permanently delete all orders and history. This action cannot be undone.</p>
                      <div>
                        <label className="text-sm font-medium">Enter Password</label>
                        <input type="password" value={clearPassword} onChange={(e) => { setClearPassword(e.target.value); setClearError(""); }} placeholder="Enter password" className="w-full px-3 py-2 border rounded-md mt-1 text-sm" />
                      </div>
                      {clearError && <p className="text-sm text-red-600">{clearError}</p>}
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => { setShowClearDialog(false); setClearPassword(""); setClearError(""); }} variant="outline">Cancel</Button>
                        <Button onClick={handleClearHistory} variant="destructive">Clear History</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {filteredHistoryOrders.length === 0 ? (
                <Card><CardContent className="pt-6 text-center text-muted-foreground">{historyDateFilter ? "No orders found for this date" : "No orders yet"}</CardContent></Card>
              ) : (
                <div className="grid gap-3">
                  {filteredHistoryOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.orderType === "dine-in" ? `Table ${order.tableNumber}` : "Takeaway"} • {new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === "pending" ? "bg-orange-100 text-orange-700" : order.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="space-y-1">{order.items.map((item: any) => <p key={item.itemId} className="text-sm">{item.quantity}x {item.itemName} - ₹{item.price * item.quantity}</p>)}</div>
                        <p className="font-bold mt-3 text-amber-600">Total: ₹{order.totalAmount}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Analytics & Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card><CardHeader><CardTitle>Order Summary</CardTitle></CardHeader><CardContent className="space-y-3">
                  <div className="flex justify-between"><span>Total Orders:</span><span className="font-bold">{totalOrders}</span></div>
                  <div className="flex justify-between"><span>Pending:</span><span className="font-bold text-orange-600">{pendingOrders.length}</span></div>
                  <div className="flex justify-between"><span>Completed:</span><span className="font-bold text-blue-600">{completedOrders.length}</span></div>
                  <div className="flex justify-between"><span>Billed:</span><span className="font-bold text-green-600">{billedOrders.length}</span></div>
                </CardContent></Card>

                <Card><CardHeader><CardTitle>Revenue Summary</CardTitle></CardHeader><CardContent className="space-y-3">
                  <div className="flex justify-between"><span>Total Revenue:</span><span className="font-bold text-amber-600">₹{totalRevenue}</span></div>
                  <div className="flex justify-between"><span>Average Order Value:</span><span className="font-bold">₹{billedOrders.length > 0 ? Math.round(totalRevenue / billedOrders.length) : 0}</span></div>
                  <div className="flex justify-between"><span>Completion Rate:</span><span className="font-bold text-green-600">{completionRate}%</span></div>
                </CardContent></Card>

                <Card className="md:col-span-2"><CardHeader><CardTitle>Top Items</CardTitle></CardHeader><CardContent>
                  {(() => {
                    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
                    apiOrders.forEach((order) => {
                      order.items.forEach((item: any) => {
                        if (!itemCounts[item.itemId]) itemCounts[item.itemId] = { name: item.itemName, count: 0, revenue: 0 };
                        itemCounts[item.itemId].count += item.quantity;
                        itemCounts[item.itemId].revenue += item.price * item.quantity;
                      });
                    });
                    return Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b last:border-b-0"><span>{item.name}</span><span className="font-bold">{item.count}x (₹{item.revenue})</span></div>
                    ));
                  })()}
                </CardContent></Card>
              </div>
            </div>
          )}

          {/* MENU MANAGEMENT TAB */}
          {activeTab === "menu" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Menu Management</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => (
                      <Button key={category} onClick={() => setSelectedCategory(category)} variant={selectedCategory === category ? "default" : "outline"} className={selectedCategory === category ? "bg-amber-600 hover:bg-amber-700 text-white" : ""} size="sm">
                        {category}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {localMenu.filter((m) => m.category === selectedCategory).map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                          <p className="text-amber-600 font-bold mt-2">₹{item.price}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <Card className="sticky top-4">
                    <CardHeader><CardTitle>Add Menu Item</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <input type="text" value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} placeholder="Item name" className="w-full px-3 py-2 border rounded-md" />
                      <input type="number" value={newMenuPrice as any} onChange={(e) => setNewMenuPrice(e.target.value ? Number(e.target.value) : "")} placeholder="Price" className="w-full px-3 py-2 border rounded-md" />
                      <div>
                        <label className="text-sm">Category</label>
                        <select value={newMenuCategory} onChange={(e) => setNewMenuCategory(e.target.value)} className="w-full px-3 py-2 border rounded-md mt-1">
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <Button onClick={addMenuItem} className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2">Add Item</Button>
                      <p className="text-xs text-muted-foreground mt-2">New items are stored locally and a best-effort sync is attempted to the server.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
