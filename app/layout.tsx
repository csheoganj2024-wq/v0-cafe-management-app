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



import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
