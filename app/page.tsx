<a
  href="https://www.instagram.com/pixncraftstudio/"
  target="_blank"
  rel="noopener noreferrer"
  className="instagram-badge"
>
  <img
    src="/instagram-icon.png"
    alt="Instagram"
    style={{ width: '20px', height: '20px', marginRight: '5px' }}
  />
  @pixncraftstudio
</a>



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
