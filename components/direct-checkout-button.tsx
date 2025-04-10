"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getCookie } from "@/utils/cookies"

interface DirectCheckoutButtonProps {
  className?: string
}

export function DirectCheckoutButton({ className }: DirectCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDirectCheckout = () => {
    setIsLoading(true)

    try {
      // Get necessary cookies
      const cartId = getCookie("unique_order_id")
      const businessId = getCookie("wres_id") || "12675"
      const orderType = getCookie("order_type")
      const branchId = getCookie("branch_id")
      const userLatitude = getCookie("userLatitude") || "0"
      const userLongitude = getCookie("userLongitude") || "0"

      if (!cartId || !orderType || !branchId) {
        alert("Missing required information for checkout. Please try again.")
        setIsLoading(false)
        return
      }

      // Create URL with query parameters
      const params = new URLSearchParams()
      params.append("cartId", cartId)
      params.append("businessId", businessId)
      params.append("orderType", orderType)
      params.append("branchId", branchId)
      params.append("source", "ordrz")
      params.append("websiteLink", window.location.origin)

      // Log the URL for debugging
      const checkoutUrl = `https://checkout.ordrz.com/?${params.toString()}`
      console.log("Opening direct checkout URL:", checkoutUrl)

      // Open in new window
      window.open(checkoutUrl, "_blank")
    } catch (error) {
      console.error("Error opening direct checkout:", error)
      alert("Failed to open checkout. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleDirectCheckout} disabled={isLoading} className={className}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        "Try Direct Checkout"
      )}
    </Button>
  )
}
