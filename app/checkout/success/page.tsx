import { Suspense } from "react"
import { ApiProvider } from "@/context/api-context"
import { ThemeProvider } from "@/context/theme-context"
import { OrderPreferencesProvider } from "@/context/order-preferences-context"
import { CartProvider } from "@/context/cart-context"
import { CheckoutSuccessContent } from "@/components/checkout-success-content"

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ApiProvider>
        <ThemeProvider>
          <OrderPreferencesProvider>
            <CartProvider currency="PKR">
              <CheckoutSuccessContent />
            </CartProvider>
          </OrderPreferencesProvider>
        </ThemeProvider>
      </ApiProvider>
    </Suspense>
  )
}
