import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "Narae Won",
  description: "Narae Won Artist Portfolio Websit",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased ">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
