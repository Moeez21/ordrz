"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { getCookie } from "@/utils/cookies"
import { CheckoutHeader } from "./checkout-header"
import { Button } from "@/components/ui/button"
import { useThemeColors } from "@/context/theme-context"
import { SharedFooter } from "./shared-footer"
import { useOrderPreferences } from "@/context/order-preferences-context"

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}

export function CheckoutContent() {
  const router = useRouter()
  const { colors } = useThemeColors()
  const { items, subtotal, currency } = useCart()
  const { selectedBranch } = useOrderPreferences() // Add this line
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  // Add minimum spend check
  const minimumSpend = selectedBranch?.minimumSpend || 0
  const isMinimumSpendMet = subtotal >= minimumSpend
  const amountNeededToReachMinimum = minimumSpend - subtotal

  // Check if we have the necessary cookies and prepare checkout
  useEffect(() => {
    const prepareCheckout = async () => {
      try {
        // Get required cookies
        const cartId = getCookie("unique_order_id") || getCookie("temp_order_id")
        const businessId = getCookie("wres_id") || "18"
        const orderType = getCookie("order_type")
        const branchId = getCookie("branch_id")
        const userLatitude = getCookie("userLatitude") || "0"
        const userLongitude = getCookie("userLongitude") || "0"

        if (!cartId || !orderType || !branchId) {
          throw new Error("Missing required information for checkout. Please try again.")
        }

        // Check minimum spend requirement
        if (!isMinimumSpendMet) {
          throw new Error(
            `Minimum order amount not met. Please add ${formatCurrency(amountNeededToReachMinimum, currency)} more to your cart.`,
          )
        }

        // Create URL with query parameters for the external checkout
        const params = new URLSearchParams()
        params.append("cartId", cartId)
        params.append("businessId", businessId)
        params.append("orderType", orderType)
        params.append("branchId", branchId)
        params.append("lat", userLatitude)
        params.append("lng", userLongitude)
        params.append("source", "ordrz")
        params.append("websiteLink", window.location.origin)

        // Set the checkout URL
        const url = `https://checkout.ordrz.com/?${params.toString()}`
        console.log("Prepared checkout URL:", url)
        setCheckoutUrl(url)
        setIsLoading(false)
      } catch (err) {
        console.error("Error preparing checkout:", err)
        setError(err instanceof Error ? err.message : "Failed to prepare checkout")
        setIsLoading(false)
      }
    }

    prepareCheckout()
  }, [isMinimumSpendMet, amountNeededToReachMinimum, currency, subtotal])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <CheckoutHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <CheckoutHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Shopping
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-500">Preparing your checkout...</p>
            </div>
          ) : checkoutUrl ? (
            <div className="text-center">
              <p className="mb-6">Your checkout is ready. Please click the button below to complete your order.</p>

              <div className="flex flex-col items-center gap-4">
                <a href={checkoutUrl} target="_self" className="inline-block">
                  <Button
                    className="flex items-center gap-2 px-6 py-2 text-base"
                    style={{
                      backgroundColor: colors.button.bg,
                      color: colors.button.fontColor,
                      borderRadius: colors.button.radius,
                    }}
                  >
                    Continue to Checkout
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>

                <p className="text-sm text-gray-500 mt-2">
                  You'll be redirected to our secure checkout page to complete your order.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-red-500">Failed to prepare checkout. Please try again.</div>
          )}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          {items.length === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.uniqueId} className="flex justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">
                        {item.name} × {item.quantity}
                      </p>
                      {item.options && item.options.length > 0 && (
                        <div className="text-sm text-gray-500">
                          {item.options.map((option, index) => (
                            <div key={index}>
                              {option.optionName}: {option.itemName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="font-medium">
                      {currency} {Number(item.price) * item.quantity}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>
                    {currency} {subtotal}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p>Tax (5%)</p>
                  <p>
                    {currency} {(subtotal * 0.05).toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <p>Total</p>
                  <p>
                    {currency} {(subtotal + subtotal * 0.05).toFixed(2)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <SharedFooter />
    </div>
  )
}
