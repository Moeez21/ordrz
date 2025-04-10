"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { Loader2 } from "lucide-react"

interface CheckoutGuardProps {
  children: React.ReactNode
}

export function CheckoutGuard({ children }: CheckoutGuardProps) {
  const { items, isLoading } = useCart()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const checkCart = () => {
      // Only proceed if cart is not loading
      if (!isLoading) {
        // Add a small delay to ensure cart is properly loaded
        timeoutId = setTimeout(() => {
          if (items.length === 0) {
            console.log("Cart is empty, redirecting to home from guard")
            router.push("/")
          } else {
            setIsChecking(false)
          }
        }, 1000) // 1 second delay
      }
    }

    checkCart()

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [items, isLoading, router])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading cart...</span>
      </div>
    )
  }

  return <>{children}</>
}
