import { Suspense } from "react"
import { ApiProvider } from "@/context/api-context"
import { ThemeProvider } from "@/context/theme-context"
import { OrderPreferencesProvider } from "@/context/order-preferences-context"
import { CartProvider } from "@/context/cart-context"
import ProductDetailPage from "@/components/product-detail-page"

// This is a server component that extracts the product ID from the slug
export default function ProductPage({ params }: { params: { slug: string } }) {
  // Extract the product ID from the slug (format: product-slug-productId)
  const productIdMatch = params.slug.match(/-(\d+)$/)
  const productId = productIdMatch ? productIdMatch[1] : "1" // Default to 1 if no match

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ApiProvider>
        <ThemeProvider>
          <OrderPreferencesProvider>
            <CartProvider currency="PKR">
              <ProductDetailPage productId={productId} />
            </CartProvider>
          </OrderPreferencesProvider>
        </ThemeProvider>
      </ApiProvider>
    </Suspense>
  )
}
