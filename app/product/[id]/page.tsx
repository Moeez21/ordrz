import { Suspense } from "react"
import { ProductDetail } from "@/components/product-detail"
import { ApiProvider } from "@/context/api-context"
import { ThemeProvider } from "@/context/theme-context"
import { OrderPreferencesProvider } from "@/context/order-preferences-context"

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ApiProvider>
        <ThemeProvider>
          <OrderPreferencesProvider>
            <ProductDetail productId={params.id} />
          </OrderPreferencesProvider>
        </ThemeProvider>
      </ApiProvider>
    </Suspense>
  )
}
