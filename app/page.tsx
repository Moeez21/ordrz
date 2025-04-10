import FoodDelivery from "../food-delivery"
import { Suspense } from "react"
import { ThemeProvider } from "../context/theme-context"
import { OrderPreferencesProvider } from "../context/order-preferences-context"
import { ApiProvider } from "../context/api-context"

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ApiProvider>
        <ThemeProvider>
          <OrderPreferencesProvider>
            <FoodDelivery />
          </OrderPreferencesProvider>
        </ThemeProvider>
      </ApiProvider>
    </Suspense>
  )
}
