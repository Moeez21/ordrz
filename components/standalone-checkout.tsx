"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getCookie } from "@/utils/cookies"
import { useCart } from "@/context/cart-context"
import { useThemeColors } from "@/context/theme-context"
import { Loader2, ArrowLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CheckoutHeader } from "./checkout-header"
import { SharedFooter } from "./shared-footer"
import Link from "next/link"
import Script from "next/script"

export function StandaloneCheckout() {
  const router = useRouter()
  const { colors } = useThemeColors()
  const { items } = useCart()
  const [isLoading, setIsLoading] = useState(true)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [isCheckoutReady, setIsCheckoutReady] = useState(false)
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const businessInfoRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  // Generate a unique key for remounting the component
  const pageKey = useRef(`checkout-${Date.now()}`).current

  // Initialize checkout
  const initializeCheckout = async () => {
    try {
      setIsLoading(true)
      setScriptError(null)

      // Get required parameters from cookies
      const cartId = getCookie("unique_order_id") || getCookie("temp_order_id")
      const businessId = getCookie("wres_id") || "18"
      const orderType = getCookie("order_type") || "delivery"
      const branchId = getCookie("branch_id") || "18"

      // Log the values for debugging
      console.log("Checkout initialization:", {
        cartId,
        businessId,
        orderType,
        branchId,
        itemsCount: items.length,
      })

      // If we don't have the necessary cookies, show an error
      if (!cartId || !businessId || !orderType || !branchId) {
        setScriptError("Missing required information for checkout. Please add items to your cart first.")
        setIsLoading(false)
        return
      }

      // Get user location from cookies or use defaults
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
        },
        userLocation: {
          lat: userLatitude,
          lng: userLongitude,
        },
        websiteLink: window.location.origin,
      }

      // Store the business info in state
      setBusinessInfo(info)

      // Also make it available globally
      window.businessInfo = info

      // Set checkout as ready
      setIsCheckoutReady(true)
    } catch (error) {
      console.error("Error initializing checkout:", error)
      setScriptError("An error occurred while initializing checkout. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Cleanup function
  const cleanupCheckout = () => {
    // Clean up any scripts or elements added by the checkout
    const checkoutRoot = document.getElementById("root")
    if (checkoutRoot) {
      checkoutRoot.innerHTML = ""
    }
  }

  useEffect(() => {
    // Mark component as mounted
    mountedRef.current = true

    // Wait a bit before checking cart state
    const timeoutId = setTimeout(() => {
      // Only redirect if we're sure the cart is empty AND we've actually loaded the cart data
      if (items.length === 0 && !isLoading) {
        console.log("Cart is empty, redirecting to home")
        router.push("/")
        return
      }

      // Initialize checkout if we have items
      if (items.length > 0) {
        initializeCheckout()
      }
    }, 1500) // 1.5 second delay

    // Cleanup function
    return () => {
      mountedRef.current = false
      clearTimeout(timeoutId)
      cleanupCheckout()
    }
  }, [items.length, isLoading])

  // Show empty cart message if no items
  const showEmptyCartMessage = !isLoading && items.length === 0 && !scriptError

  return (
    <div className="min-h-screen flex flex-col" key={pageKey}>
      <CheckoutHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Shopping
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-500">Loading checkout...</p>
            </div>
          </div>
        ) : scriptError ? (
          <div className="text-center py-10">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-red-700 mb-2">Checkout Error</h2>
              <p className="text-red-600 mb-4">{scriptError}</p>
              <Button
                onClick={() => router.push("/")}
                style={{
                  backgroundColor: colors.button.bg,
                  color: colors.button.fontColor,
                }}
              >
                Return to Home
              </Button>
            </div>
          </div>
        ) : showEmptyCartMessage ? (
          <div className="text-center py-10">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md mx-auto">
              <ShoppingCart className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-amber-700 mb-2">Your Cart is Empty</h2>
              <p className="text-amber-600 mb-4">Add some items to your cart before proceeding to checkout.</p>
              <Button
                onClick={() => router.push("/")}
                style={{
                  backgroundColor: colors.button.bg,
                  color: colors.button.fontColor,
                }}
              >
                Browse Menu
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6">Checkout</h1>

            {/* Business Info Display - This makes the data available in the DOM */}
            {businessInfo && (
              <div
                id="business-info-container"
                ref={businessInfoRef}
                className="hidden"
                data-business-info={JSON.stringify(businessInfo)}
              >
                {/* This pre tag makes the data visible in the DOM inspector */}
                <pre id="business-info-data">{JSON.stringify(businessInfo, null, 2)}</pre>
              </div>
            )}

            {/* Checkout container */}
            <div
              id="root"
              ref={rootRef}
              className="min-h-[500px] bg-white rounded-lg shadow-sm font-['Plus_Jakarta_Sans']"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            ></div>

            {/* Load external CSS */}
            <link rel="stylesheet" href="https://checkout.ordrz.com/static/css/main.a666252e.css" />
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans&display=swap" rel="stylesheet" />

            {/* Set business info and load scripts */}
            {businessInfo && (
              <>
                <Script id="checkout-data" strategy="afterInteractive">
                  {`
                    // Apply the font to the document
                    document.documentElement.style.setProperty('--checkout-font', "'Plus Jakarta Sans', sans-serif");
                    
                    window.businessInfo = ${JSON.stringify(businessInfo)};
                    console.log("Business info set:", window.businessInfo);
                    
                    // Also store in localStorage for redundancy
                    localStorage.setItem('businessInfo', JSON.stringify(window.businessInfo));
                    
                    // Create a global function to access business info
                    window.getBusinessInfo = function() {
                      return window.businessInfo;
                    };
                    
                    // Dispatch an event to notify that business info is ready
                    document.dispatchEvent(new CustomEvent('businessInfoReady', { 
                      detail: window.businessInfo 
                    }));
                  `}
                </Script>

                <Script
                  src="https://checkout.ordrz.com/static/js/main.b75be690.js"
                  strategy="afterInteractive"
                  onError={() => setScriptError("Failed to load checkout script")}
                />

                <Script
                  src="https://checkout.ordrz.com/static/js/179.c3afeb96.chunk.js"
                  strategy="afterInteractive"
                  onError={() => setScriptError("Failed to load checkout dependencies")}
                />
              </>
            )}

            {/* Debug information in development mode */}
            {process.env.NODE_ENV === "development" && businessInfo && (
              <div className="mt-8 p-4 border rounded-md bg-gray-50">
                <h3 className="font-semibold mb-2">Debug Information</h3>
                <div className="text-xs overflow-auto max-h-40">
                  <pre>{JSON.stringify(businessInfo, null, 2)}</pre>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <SharedFooter />
    </div>
  )
}
