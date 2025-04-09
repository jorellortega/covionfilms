import type React from "react"
import { Orbitron, Rajdhani } from "next/font/google"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { Home, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalStyles } from "@/components/GlobalStyles"
import { MobileMenu } from "@/components/mobile-menu"
import "./globals.css"

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-orbitron",
})

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable}`}>
      <body className="bg-background text-foreground gradient-bg">
        <AuthProvider>
          <header className="bg-card py-4 border-b border-gray-700 glass relative z-50">
            <div className="container mx-auto px-4 flex items-center">
              <div className="flex items-center space-x-4 flex-grow">
                <Link href="/">
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground hover:bg-accent">
                    <Home className="h-5 w-5" />
                    <span className="sr-only">Home</span>
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold futuristic-text">
                    <span className="bg-gradient-to-r from-primary to-[#8e2de2] text-transparent bg-clip-text">
                      COVION
                    </span>{" "}
                    <span className="bg-gradient-to-r from-[#ff0050] to-[#ff2975] text-transparent bg-clip-text">
                      FILMS
                    </span>
                  </h1>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground futuristic-subtext">
                    Movie Streaming Platform
                  </p>
                </div>
              </div>
              <nav className="hidden md:flex items-center space-x-4 futuristic-subtext">
                <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/creator" className="text-foreground hover:text-primary transition-colors">
                  Creator
                </Link>
                <Link href="/upload" className="text-foreground hover:text-primary transition-colors">
                  Upload
                </Link>
                <Link href="/login" className="text-foreground hover:text-primary transition-colors">
                  Login
                </Link>
                <Link href="/subscribe" className="text-foreground hover:text-primary transition-colors">
                  Subscribe
                </Link>
                <Link href="/clips" className="text-foreground hover:text-primary transition-colors">
                  Clips
                </Link>
                <Link href="/vee" className="text-foreground hover:text-primary transition-colors">
                  Vee
                </Link>
              </nav>
              <div className="flex items-center space-x-2">
                <Link href="/account">
                  <Button variant="ghost" size="icon" className="text-foreground hover:text-foreground hover:bg-accent">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Account</span>
                  </Button>
                </Link>
                <MobileMenu />
              </div>
            </div>
          </header>
          <main className="relative z-0">{children}</main>
          <Toaster />
        </AuthProvider>
        <GlobalStyles />
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
