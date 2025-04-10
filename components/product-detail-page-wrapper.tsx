"use client"

import ProductDetailPage from "./product-detail-page"
import { useProductsData } from "@/context/api-context"

export function ProductDetailPageWrapper({ productId }: { productId: string }) {
  const { currency } = useProductsData()

  return <ProductDetailPage productId={productId} />
}
