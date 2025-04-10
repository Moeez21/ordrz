import { Suspense } from "react"
import { ApiProvider } from "@/context/api-context"
import { ThemeProvider } from "@/context/theme-context"
import { OrderPreferencesProvider } from "@/context/order-preferences-context"
import { CartProvider } from "@/context/cart-context"
import { StandaloneCheckout } from "@/components/standalone-checkout"
import { CheckoutBridge } from "@/components/checkout-bridge"
import Head from "next/head"

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ApiProvider>
        <ThemeProvider>
          <OrderPreferencesProvider>
            <CartProvider currency="PKR">
              {/* Add the font link */}
              <Head>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans&display=swap" rel="stylesheet" />
              </Head>
              {/* The CheckoutBridge component ensures business info is available in the DOM */}
              <CheckoutBridge />
              <StandaloneCheckout />
            </CartProvider>
          </OrderPreferencesProvider>
        </ThemeProvider>
      </ApiProvider>
    </Suspense>
  )
}
