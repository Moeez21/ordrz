"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteCookie } from "@/utils/cookies"
import { useCart } from "@/context/cart-context"
import { useThemeColors } from "@/context/theme-context"
import { CheckoutHeader } from "./checkout-header"

export function CheckoutSuccessContent() {
  const router = useRouter()
  const { clearCart } = useCart()
  const { colors } = useThemeColors()

  useEffect(() => {
    // Clear the cart when the success page loads
    clearCart()

    // Also clear cart-related cookies
    deleteCookie("unique_order_id")
    deleteCookie("temp_order_id")
  }, [clearCart])

  return (
    <div className="min-h-screen flex flex-col">
      <CheckoutHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. We've received your order and will begin processing it right away.
          </p>
          <Button
            onClick={() => router.push("/")}
            className="w-full"
            style={{
              backgroundColor: colors.button.bg,
              color: colors.button.fontColor,
              borderRadius: colors.button.radius,
            }}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
