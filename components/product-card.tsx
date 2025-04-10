"use client"

import type React from "react"
import { useState, useEffect, memo, useCallback } from "react"
import Image from "next/image"
import { Plus, Minus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "../types/product"
import { useCart } from "../context/cart-context"
import { formatCurrency } from "../utils/format"
import { useThemeColors } from "../context/theme-context"
import { useThemeData } from "@/context/api-context"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { BranchSelectionModal } from "./branch-selection-modal"

// Dynamically import the modal with loading state
const ProductOptionsModal = dynamic(() => import("./product-options-modal"), {
  ssr: false,
  loading: () => null,
})

interface ProductCardProps {
  product: Product
  currency: string
}

function ProductCardComponent({ product, currency }: ProductCardProps) {
  const router = useRouter()
  const { addItem, getItemQuantity, updateQuantity, isLoading, isItemLoading, resetAllLoadingStates } = useCart()
  const { colors } = useThemeColors()
  const { logoImage } = useThemeData()
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const [isBranchModalOpen, setBranchModalOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Get the current quantity of this product in the cart
  const quantity = getItemQuantity(product.menu_item_id)
  const hasOptions = product.options && product.options.length > 0
  const isItemLoadingState = isItemLoading(product.menu_item_id)

  // Extract description text from HTML - memoize to avoid recalculation
  const description = useCallback(() => {
    return product.desc.replace(/<\/?[^>]+(>|$)/g, "").trim()
  }, [product.desc])

  const hasDiscount = product.discount && Number.parseFloat(product.discount) > 0
  const discountDisplay = product.discount_display || (hasDiscount ? `${product.discount}% OFF` : "")

  // Reset loading states when component mounts
  useEffect(() => {
    resetAllLoadingStates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProductClick = useCallback(() => {
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

  const handleIncrement = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        await addItem(product)
      } catch (error) {
        console.error("Failed to increment item quantity:", error)
      }
    },
    [addItem, product],
  )

  const handleDecrement = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      try {
        await updateQuantity(product.menu_item_id, quantity - 1)
      } catch (error) {
        console.error("Failed to decrement item quantity:", error)
      }
    },
    [updateQuantity, product.menu_item_id, quantity],
  )

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
        : "/placeholder.svg?height=160&width=160"
    }
    return product.image
  }, [imageError, product.image, logoImage])

  return (
    <>
      <div
        className="flex border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer mb-4"
        onClick={handleProductClick}
      >
        <div className="p-4 flex-1">
          <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: colors.productCard.fontColor }}>
            {product.name}
          </h3>

          <p className="text-[13px] mb-3 line-clamp-2 leading-tight" style={{ color: colors.productCard.descColor }}>
            {description()}
          </p>

          <div className="flex items-center">
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
        </div>

        <div className="relative h-auto w-32 md:w-40">
          {discountDisplay && (
            <div className="absolute top-2 left-2 bg-[#e41e3f] text-white text-[10px] px-1.5 py-0.5 rounded-sm font-medium z-10">
              {discountDisplay}
            </div>
          )}

          {/* Image loading skeleton */}
          {!imageLoaded && !imageError && <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>}

          <Image
            src={getImageUrl() || "/placeholder.svg"}
            alt={product.name}
            width={160}
            height={160}
            className={`h-full w-full object-contain transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            sizes="(max-width: 768px) 128px, 160px"
            onLoad={handleImageLoad}
            onError={handleImageError}
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
            placeholder="blur"
          />

          {quantity > 0 && !hasOptions ? (
            <div
              className="absolute bottom-2 right-2 flex items-center rounded-lg overflow-hidden"
              style={{
                backgroundColor: colors.button.bg,
                color: colors.button.fontColor,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-none hover:bg-black/20 hover:text-white"
                style={{
                  backgroundColor: "transparent",
                  color: colors.button.fontColor,
                }}
                onClick={handleDecrement}
                disabled={isLoading || isItemLoadingState}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-5 text-center text-xs font-medium">{quantity}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 rounded-none hover:bg-black/20 hover:text-white"
                style={{
                  backgroundColor: "transparent",
                  color: colors.button.fontColor,
                }}
                onClick={handleIncrement}
                disabled={isLoading || isItemLoadingState}
              >
                {isItemLoadingState ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="absolute bottom-2 right-2 h-7 w-7 p-0 rounded-full"
              style={{
                backgroundColor: colors.button.bg,
                color: colors.button.fontColor,
                borderRadius: colors.button.radius,
              }}
              onClick={handleAddToCart}
              disabled={isLoading || isItemLoadingState}
            >
              {isItemLoadingState ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {isOptionsModalOpen && (
        <ProductOptionsModal
          product={product}
          isOpen={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          onAddToCart={addItem}
          currency={currency}
        />
      )}

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
      />
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent)
