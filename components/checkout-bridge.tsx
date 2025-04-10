"use client"

import { useEffect, useState } from "react"
import { getCookie } from "@/utils/cookies"
import { useThemeColors } from "@/context/theme-context"

interface CheckoutBridgeProps {
  onBusinessInfoReady?: (info: any) => void
}

export function CheckoutBridge({ onBusinessInfoReady }: CheckoutBridgeProps) {
  const { colors } = useThemeColors()
  const [businessInfo, setBusinessInfo] = useState<any>(null)

  useEffect(() => {
    // Get required parameters from cookies
    const cartId = getCookie("unique_order_id") || getCookie("temp_order_id")
    const businessId = getCookie("wres_id") || "18"
    const orderType = getCookie("order_type") || "delivery"
    const branchId = getCookie("branch_id") || "18"
    const userLatitude = getCookie("userLatitude") || "0"
    const userLongitude = getCookie("userLongitude") || "0"

    // Format checkout data
    const info = {
      cartId,
      businessId,
      orderType,
      branchId,
      source: "ordrz",
      theme: {
        header_bg: colors.header.bg,
        header_font_color: colors.header.fontColor,
        button_bg: colors.button.bg,
        button_font_color: colors.button.fontColor,
        button_radius: colors.button.radius.replace("px", ""),
        font_family: "'Plus Jakarta Sans', sans-serif", // Add font family to theme
      },
      userLocation: {
        lat: userLatitude,
        lng: userLongitude,
      },
      websiteLink: window.location.origin,
      fontFamily: "'Plus Jakarta Sans', sans-serif", // Add font family at the top level
    }

    // Store the business info in state
    setBusinessInfo(info)

    // Make it available globally
    window.businessInfo = info

    // Store in localStorage for redundancy
    localStorage.setItem("businessInfo", JSON.stringify(info))

    // Call the callback if provided
    if (onBusinessInfoReady) {
      onBusinessInfoReady(info)
    }

    // Dispatch an event to notify that business info is ready
    document.dispatchEvent(
      new CustomEvent("businessInfoReady", {
        detail: info,
      }),
    )

    // Apply the font to the document
    document.documentElement.style.setProperty("--checkout-font", "'Plus Jakarta Sans', sans-serif")

    // Add a style tag to ensure the font is applied
    const styleTag = document.createElement("style")
    styleTag.textContent = `
      #root, 
      .checkout-container,
      [id*="checkout"],
      [class*="checkout"] {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
      }
    `
    document.head.appendChild(styleTag)
  }, [colors, onBusinessInfoReady])

  // Render the business info in the DOM
  return businessInfo ? (
    <div id="checkout-bridge" className="hidden" data-business-info={JSON.stringify(businessInfo)}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans&display=swap" rel="stylesheet" />
      <script type="application/json" id="checkout-data-json">
        {JSON.stringify(businessInfo)}
      </script>
    </div>
  ) : null
}
