"use client"

import type React from "react"
import { useState, useEffect, memo, useCallback } from "react"
import Image from "next/image"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "../types/product"
import { useCart } from "../context/cart-context"
import { formatCurrency } from "../utils/format"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
import { BranchSelectionModal } from "./branch-selection-modal"
import { useTheme } from "@/context/theme-context"
import { useThemeData } from "@/context/api-context"

// Dynamically import the modal with loading state
const ProductOptionsModal = dynamic(() => import("./product-options-modal"), {
  ssr: false,
  loading: () => null,
})

interface FeaturedCardProps {
  product: Product
  currency: string
}

function FeaturedCardComponent({ product, currency }: FeaturedCardProps) {
  const router = useRouter()
  const { addItem, isItemLoading, resetAllLoadingStates } = useCart()
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isBranchModalOpen, setBranchModalOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { colors } = useTheme()
  const { logoImage } = useThemeData()

  const hasOptions = product.options && product.options.length > 0
  const hasDiscount = product.discount && Number.parseFloat(product.discount) > 0
  const discountDisplay = product.discount_display || (hasDiscount ? `${product.discount}% OFF` : "")
  const isLoading = isItemLoading(product.menu_item_id)

  // Set mounted state after component mounts to enable client-side rendering for portal
  useEffect(() => {
    setIsMounted(true)
    resetAllLoadingStates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCardClick = useCallback(() => {
    // Create a clean, SEO-friendly slug from the product name
    const slug = product.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .concat(`-${product.menu_item_id}`)

    // Navigate to the product detail page
    router.push(`/${slug}`)
  }, [product.name, product.menu_item_id, router])

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()

      try {
        if (hasOptions) {
          setIsOptionsModalOpen(true)
        } else {
          await addItem(product)
        }
      } catch (error: any) {
        console.error("Failed to add item to cart:", error)

        // Check if we need to show branch selection
        if (error.code === "BRANCH_SELECTION_REQUIRED") {
          setBranchModalOpen(true)
        }
      }
    },
    [addItem, hasOptions, product],
  )

  // Extract description text from HTML - memoize to avoid recalculation
  const description = useCallback(() => {
    return product.desc.replace(/<\/?[^>]+(>|$)/g, "").trim()
  }, [product.desc])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  // Get optimized image URL
  const getImageUrl = useCallback(() => {
    if (imageError || product.image === "https://static.tossdown.com/images/150x150/no_image.jpg") {
      // Return the business logo if available, otherwise use a placeholder
      return logoImage && logoImage !== "undefined" && logoImage !== "null"
        ? logoImage
        : "/placeholder.svg?height=192&width=256"
    }
    return product.image
  }, [imageError, product.image, logoImage])

  return (
    <>
      <div
        className="rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative">
          {discountDisplay && (
            <div className="absolute top-2 left-2 bg-[#e41e3f] text-white text-[10px] px-1.5 py-0.5 rounded-sm font-medium z-10">
              {discountDisplay}
            </div>
          )}
          <div className="h-48 relative">
            {/* Image loading skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gray-300 animate-pulse object-cover"></div>
            )}

            <Image
              src={getImageUrl() || "/placeholder.svg"}
              alt={product.name}
              fill
              className={` transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              onLoad={handleImageLoad}
              onError={handleImageError}
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              placeholder="blur"
            />
          </div>
        </div>

        <div className="p-3">
          <h3 className="text-[15px] font-semibold mb-1.5 line-clamp-1" style={{ color: colors.productCard.fontColor }}>
            {product.name}
          </h3>

          <p className="text-[13px] mb-3 line-clamp-2 leading-tight" style={{ color: colors.productCard.descColor }}>
            {description()}
          </p>

          <div className="flex items-center justify-between">
            <div>
              {Number(product.price) > 0 ? (
                <>
                  <span className="font-semibold text-[15px]" style={{ color: colors.button.bg }}>
                    {formatCurrency(Number(product.price), currency)}
                  </span>
                  {hasDiscount && (
                    <span className="line-through ml-2 text-[12px] text-gray-500">
                      {formatCurrency(Number(product.originalPrice || "0"), currency)}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-semibold text-[15px] text-[#e41e3f]">
                  {product.options && product.options.length > 0 ? (
                    <>
                      from{" "}
                      {formatCurrency(
                        Math.min(
                          ...product.options
                            .flatMap((option) => option.items)
                            .map((item) => Number(item.price))
                            .filter((price) => price > 0),
                        ) || 0,
                        currency,
                      )}
                    </>
                  ) : (
                    formatCurrency(0, currency)
                  )}
                </span>
              )}
            </div>

            <Button
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              style={{
                backgroundColor: colors.button.bg,
                color: colors.button.fontColor,
                borderRadius: colors.button.radius,
              }}
              onClick={handleAddToCart}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Use React Portal to render the modal outside of any container constraints */}
      {isMounted &&
        isOptionsModalOpen &&
        createPortal(
          <ProductOptionsModal
            product={product}
            isOpen={isOptionsModalOpen}
            onClose={() => setIsOptionsModalOpen(false)}
            onAddToCart={addItem}
            currency={currency}
          />,
          document.body,
        )}

      {/* Add branch selection modal */}
      {isMounted &&
        isBranchModalOpen &&
        createPortal(
          <BranchSelectionModal
            isOpen={isBranchModalOpen}
            setIsOpen={setBranchModalOpen}
            onBranchSelected={() => {
              setBranchModalOpen(false)
              // Try adding to cart again after branch is selected
              addItem(product).catch((error) => {
                console.error("Error adding item after branch selection:", error)
              })
            }}
          />,
          document.body,
        )}
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const FeaturedCard = memo(FeaturedCardComponent)
