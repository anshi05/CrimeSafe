import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { Shield } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CrimeSafe - Crime Analysis & Prediction Platform",
  description: "AI-powered crime analysis, prediction, and personalized safety recommendations",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                <Shield className="h-6 w-6 text-blue-600" />
                CrimeSafe
              </Link>

              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">
                  Dashboard
                </Link>
                <Link href="/map" className="text-slate-600 hover:text-slate-900 transition-colors">
                  Map
                </Link>
                <Link href="/predict" className="text-slate-600 hover:text-slate-900 transition-colors">
                  Predict
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {children}

        <footer className="border-t bg-slate-50 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-sm text-slate-600">
              <p>CrimeSafe - Crime Analysis & Prediction Platform</p>
              <p className="mt-2">Built with Next.js, TypeScript, and Machine Learning</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
