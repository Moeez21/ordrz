"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCookie } from "@/utils/cookies"

export function CheckoutPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutInfo, setCheckoutInfo] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState(false)

  useEffect(() => {
    // Check if we have the necessary cookies
    const cartId = getCookie("unique_order_id")
    const businessId = getCookie("wres_id")
    const orderType = getCookie("order_type")
    const branchId = getCookie("branch_id")

    if (!cartId || !businessId || !orderType || !branchId) {
      setError("Missing required information for checkout. Please try again.")
      setIsLoading(false)
      return
    }

    // Get user location from cookies or use defaults
    const userLatitude = getCookie("userLatitude") || "0"
    const userLongitude = getCookie("userLongitude") || "0"

    // Get scheduled date and time if available
    const scheduledDate = getCookie("date") || ""
    const scheduledTime = getCookie("Time") || ""

    // Prepare checkout info object
    const info = {
      cartId,
      businessId,
      orderType,
      branchId,
      source: "ordrz",
      theme: {
        // Provide minimal theme info directly
        header_bg: "#ffffff",
        header_font_color: "#000000",
        button_bg: "#d05749",
        button_font_color: "#ffffff",
        button_radius: "6",
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

    console.log("Checkout info:", info)
    setCheckoutInfo(info)
    setIsLoading(false)
  }, [])

  // Handle script loading success
  const handleScriptLoad = () => {
    console.log("Checkout script loaded successfully")
    setScriptLoaded(true)
  }

  // Handle script loading error
  const handleScriptError = () => {
    console.error("Failed to load checkout script")
    setScriptError(true)
    setError("Failed to load checkout script. Please try again later.")
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b py-4 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-medium">Checkout</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500">Loading checkout...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </div>
        ) : (
          <>
            {/* Load external CSS */}
            <link rel="stylesheet" href="https://checkout.ordrz.com/static/css/main.a666252e.css" />

            {/* Checkout container */}
            <div id="root" className="min-h-[500px] bg-white rounded-lg shadow-sm p-4">
              {!scriptLoaded && !scriptError && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-500">Loading checkout interface...</p>
                </div>
              )}
            </div>

            {/* Set business info and load scripts */}
            <Script id="checkout-data" strategy="afterInteractive">
              {`
                window.businessInfo = ${JSON.stringify(checkoutInfo)};
                console.log("Business info set:", window.businessInfo);
              `}
            </Script>

            <Script
              src="https://checkout.ordrz.com/static/js/main.b75be690.js"
              strategy="afterInteractive"
              onLoad={handleScriptLoad}
              onError={handleScriptError}
            />

            <Script
              src="https://checkout.ordrz.com/static/js/179.c3afeb96.chunk.js"
              strategy="afterInteractive"
              onError={handleScriptError}
            />
          </>
        )}
      </main>

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && checkoutInfo && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white p-2 text-xs">
          <details>
            <summary>Debug Info</summary>
            <pre>{JSON.stringify(checkoutInfo, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  )
}
