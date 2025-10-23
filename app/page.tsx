"use client"

import { useState } from "react"
import { LoginScreen } from "@/components/login-screen"
import { KitchenDashboard } from "@/components/kitchen-dashboard"
import { ManagerDashboard } from "@/components/manager-dashboard"

export default function Home() {
  const [userRole, setUserRole] = useState<"manager" | "kitchen" | null>(null)

  if (!userRole) {
    return <LoginScreen onLogin={setUserRole} />
  }

  if (userRole === "kitchen") {
    return <KitchenDashboard onLogout={() => setUserRole(null)} />
  }

  return <ManagerDashboard onLogout={() => setUserRole(null)} />
}
