"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

interface LoginScreenProps {
  onLogin: (role: "manager" | "kitchen") => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<"manager" | "kitchen" | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = () => {
    setError("")

    const correctPassword = selectedRole === "manager" ? "manager" : "kitchen"

    if (password === correctPassword) {
      onLogin(selectedRole)
    } else {
      setError("Incorrect password")
      setPassword("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-amber-900">Bloom Cafe</CardTitle>
          <CardDescription className="text-base mt-2">Management System</CardDescription>
          <p className="text-sm text-muted-foreground mt-4">📞 9001160228 | Deora Plaza, Kesarpura Road, Sheoganj</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {!selectedRole ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center text-foreground">Select your role to continue</p>
              <Button
                onClick={() => setSelectedRole("manager")}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
              >
                Manager Login
              </Button>
              <Button
                onClick={() => setSelectedRole("kitchen")}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                size="lg"
              >
                Kitchen Login
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">
                  {selectedRole === "manager" ? "Manager" : "Kitchen"} Password
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedRole(null)
                    setPassword("")
                    setError("")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleLogin} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                  Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
