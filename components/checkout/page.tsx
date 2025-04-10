"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCookie } from "@/utils/cookies"
import { useCart } from "@/context/cart-context"
import { useBranchesData } from "@/context/api-context"
import { useOrderPreferences } from "@/context/order-preferences-context"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUniqueOrderId } from "@/utils/api"
import { useThemeColors } from "@/context/theme-context"
import { CheckoutHeader } from "../checkout-header"
import { SharedFooter } from "../shared-footer"

export function Checkout() {
  const router = useRouter()
  const { colors } = useThemeColors()
  const { items, subtotal, currency, clearCart } = useCart()
  const { branches } = useBranchesData()
  const { orderType, selectedBranch } = useOrderPreferences()

  const [isLoading, setIsLoading] = useState(true)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const mountedRef = useRef(false)
  const scriptsLoadedRef = useRef(false)

  // Generate a unique key for remounting the component
  const pageKey = useRef(`checkout-${Date.now()}`).current

  // Reset the checkout application
  const resetCheckout = () => {
    // Clear any existing checkout app elements
    const rootElement = document.getElementById("checkout-root")
    if (rootElement) {
      rootElement.innerHTML = ""
    }

    // Reset scripts loaded flag
    scriptsLoadedRef.current = false

    // Remove any previously added scripts
    const oldScripts = document.querySelectorAll("script[data-checkout-script]")
    oldScripts.forEach((script) => script.remove())
  }

  // Cleanup function to remove all checkout-related elements
  const cleanupCheckout = () => {
    if (isCleaningUp) return
    setIsCleaningUp(true)

    // Remove any toast elements that might have been added by the checkout app
    const toastElements = document.querySelectorAll(
      '[class*="toast"], [id*="toast"], [class*="notification"], [id*="notification"]',
    )
    toastElements.forEach((el) => el.remove())

    // Remove any modal or overlay elements
    const overlayElements = document.querySelectorAll(
      '[class*="modal"], [id*="modal"], [class*="overlay"], [id*="overlay"], [class*="backdrop"], [id*="backdrop"]',
    )
    overlayElements.forEach((el) => el.remove())

    // Remove any checkout-specific elements that might have been added to the body
    const checkoutElements = document.querySelectorAll(
      '[class*="checkout"], [id*="checkout"], [class*="ordrz"], [id*="ordrz"]',
    )
    checkoutElements.forEach((el) => el.remove())

    // Remove any scripts added by the checkout app
    const checkoutScripts = document.querySelectorAll("script[data-checkout-script]")
    checkoutScripts.forEach((script) => script.remove())

    // Clear the root element
    const rootElement = document.getElementById("checkout-root")
    if (rootElement) {
      rootElement.innerHTML = ""
    }

    // Reset the businessInfo object
    if (window.businessInfo) {
      window.businessInfo = {} as any
    }

    setIsCleaningUp(false)
  }

  // Update the initializeCheckout function to add debugging and prevent premature redirection
  const initializeCheckout = () => {
    // Debug cart state
    console.log("Initializing checkout with cart items:", items)
    console.log("Cart subtotal:", subtotal)
    console.log("Order type:", orderType)
    console.log("Selected branch:", selectedBranch)

    // Only redirect if we're sure the cart is empty AND we've actually loaded the cart data
    if (items.length === 0 && !isLoading) {
      console.log("Cart is empty, redirecting to home")
      router.push("/")
      return
    }

    // Reset any previous checkout state
    resetCheckout()

    // Set loading state
    setIsLoading(true)
    setScriptError(null)

    // Get required parameters
    const cartId = getUniqueOrderId()
    const businessId = getCookie("wres_id") || "18"
    const branchId = getCookie("branch_id") || "18"

    // Debug cookies
    console.log("Cart ID:", cartId)
    console.log("Business ID:", businessId)
    console.log("Branch ID:", branchId)

    // Get user location from cookies or use defaults
    const userLatitude = getCookie("userLatitude") || "0"
    const userLongitude = getCookie("userLongitude") || "0"

    // Get scheduled date and time if available
    const scheduledDate = getCookie("date") || ""
    const scheduledTime = getCookie("Time") || ""

    // Format cart data for the external checkout system
    const businessInfo = {
      cartId: cartId,
      businessId: businessId,
      orderType: orderType,
      branchId: branchId,
      source: "ordrz",
      theme: {
        header_bg: colors.header.bg,
        header_font_color: colors.header.fontColor,
        button_bg: colors.button.bg,
        button_font_color: colors.button.fontColor,
        button_radius: colors.button.radius.replace("px", ""),
      },
      userLocation: {
        lat: userLatitude,
        lng: userLongitude,
      },
      orderSchedule: {
        date: scheduledDate,
        time: scheduledTime,
      },
      websiteLink: window.location.origin,
    }

    console.log("Business info for checkout:", businessInfo)

    // Make the checkout data available to the external checkout application
    window.businessInfo = businessInfo

    // Load external scripts programmatically
    if (!scriptsLoadedRef.current) {
      const loadScript = (src: string) => {
        return new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = src
          script.async = true
          script.defer = true
          script.setAttribute("data-checkout-script", "true")

          script.onload = () => {
            resolve()
          }

          script.onerror = (error) => {
            console.error(`Error loading script: ${src}`, error)
            reject(new Error(`Failed to load script: ${src}`))
          }

          document.body.appendChild(script)
        })
      }

      // Load scripts in sequence
      Promise.all([
        loadScript("https://checkout.ordrz.com/static/js/main.b75be690.js"),
        loadScript("https://checkout.ordrz.com/static/js/179.c3afeb96.chunk.js"),
      ])
        .then(() => {
          scriptsLoadedRef.current = true
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Failed to load checkout scripts:", error)
          setScriptError("Failed to load checkout application. Please try refreshing the page")
          setIsLoading(false)
        })
    } else {
      // Scripts already loaded, just hide loading
      setIsLoading(false)
    }
  }

  // Update the useEffect to wait for cart data to be loaded
  useEffect(() => {
    // Mark component as mounted
    mountedRef.current = true

    // Check if we have cart items before initializing
    console.log("Component mounted, cart items:", items.length)

    // Initialize checkout only if we have items or we're still loading
    // This prevents premature redirection
    if (items.length > 0 || isLoading) {
      initializeCheckout()
    }

    // Cleanup function
    return () => {
      mountedRef.current = false
      // Clean up checkout elements when component unmounts
      cleanupCheckout()
    }
  }, [items.length]) // Run when items change

  // Add event listener for page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && mountedRef.current) {
        initializeCheckout()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Add event listener for navigation
  useEffect(() => {
    // Listen for navigation events
    const handleBeforeUnload = () => {
      cleanupCheckout()
    }

    // Add event listener for page unload
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Clean up on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      cleanupCheckout()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col" key={pageKey}>
      <CheckoutHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
            Back to Shopping
          </Button>
        </div>

        {/* Include external CSS */}
        <link rel="stylesheet" href="https://checkout.ordrz.com/static/css/main.a666252e.css" />

        {/* Include Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans&display=swap" rel="stylesheet" />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
          </div>
        )}

        {/* Show error message if scripts failed to load */}
        {scriptError && (
          <div className="text-center py-10">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Checkout</h2>
              <p className="text-red-600 mb-4">{scriptError}</p>
              <button
                onClick={() => {
                  setIsLoading(true)
                  setScriptError(null)
                  scriptsLoadedRef.current = false
                  initializeCheckout()
                }}
                className="bg-black text-white px-6 py-2 rounded-md"
                style={{
                  backgroundColor: colors.button.bg,
                  color: colors.button.fontColor,
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Container for external checkout app */}
        <div id="checkout-root" className="min-h-[500px] bg-white rounded-lg shadow-sm"></div>
      </main>

      <SharedFooter />
    </div>
  )
}
