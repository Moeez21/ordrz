"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getCookie } from "@/utils/cookies"
import { useThemeColors } from "@/context/theme-context"

export function DirectCheckoutLink({ isMinimumSpendMet = true }: { isMinimumSpendMet?: boolean }) {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { colors } = useThemeColors()

  useEffect(() => {
    // Get necessary cookies
    const cartId = getCookie("unique_order_id") || getCookie("temp_order_id")
    const businessId = getCookie("wres_id") || "18"
    const orderType = getCookie("order_type") || "pickup"
    const branchId = getCookie("branch_id") || "18"
    const userLatitude = getCookie("userLatitude") || "0"
    const userLongitude = getCookie("userLongitude") || "0"

    if (cartId && businessId && orderType && branchId) {
      // Create URL with query parameters
      const params = new URLSearchParams()
      params.append("cartId", cartId)
      params.append("businessId", businessId)
      params.append("orderType", orderType)
      params.append("branchId", branchId)
      params.append("lat", userLatitude)
      params.append("lng", userLongitude)
      params.append("source", "ordrz")
      params.append("websiteLink", window.location.origin)

      const url = `https://checkout.ordrz.com/?${params.toString()}`
      setCheckoutUrl(url)
    }

    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (!checkoutUrl || !isMinimumSpendMet) {
    return null
  }

  // return (
  //   <a href={checkoutUrl} target="_self" className="block w-full">
  //     <Button
  //       className="w-full flex items-center justify-center gap-2"
  //       style={{
  //         backgroundColor: colors.button.bg,
  //         color: colors.button.fontColor,
  //         borderRadius: colors.button.radius,
  //       }}
  //     >
  //       Proceed to Checkout
  //       <ExternalLink className="h-4 w-4" />
  //     </Button>
  //   </a>
  // )
}
