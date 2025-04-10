"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Minus, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeColors } from "@/context/theme-context"
import { useThemeData } from "@/context/api-context"
import { useCart } from "@/context/cart-context"
import { formatCurrency } from "@/utils/format"
import { useRouter } from "next/navigation"
import { CartSidebar } from "./cart-sidebar"
import { CartNotificationWrapper } from "./cart-notification-wrapper"
import { ViewCartButton } from "./view-cart-button"
import type { Product, ProductOption } from "@/types/product"
import { BranchSelectionModal } from "./branch-selection-modal"
import { useOrderPreferences } from "@/context/order-preferences-context"
import { SharedHeader } from "./shared-header"
import { ProductImageSkeleton, ProductInfoSkeleton } from "./skeleton-loaders"
import { SharedFooter } from "./shared-footer"
import Link from "next/link"

interface ProductDetailProps {
  productId: string
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter()
  const { colors } = useThemeColors()
  const { logoImage, brandName } = useThemeData()
  const { addItem, isItemLoading, resetAllLoadingStates } = useCart()
  const { orderType, selectedBranch } = useOrderPreferences()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get wres_id from cookie or use default
        const wresId =
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("wres_id="))
            ?.split("=")[1] || "18"

        const response = await fetch(`/api/product-details?business_id=${wresId}&item_id=${productId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch product details: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.items && data.items.length > 0) {
          setProduct(data.items[0])

          // Initialize selected options for required options
          const initialOptions: Record<string, any> = {}
          data.items[0].options?.forEach((option: ProductOption) => {
            if (option.flag === "1" && option.items.length > 0) {
              // For radio options, select the first item by default
              if (option.min_quantity === "1" && option.quantity === "1") {
                initialOptions[option.id] = option.items[0].id
              }
            }
          })

          setSelectedOptions(initialOptions)
        } else {
          throw new Error("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product details:", error)
        setError(error instanceof Error ? error.message : "Failed to load product details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductDetails()

    // Reset loading states when component mounts
    resetAllLoadingStates()
  }, [productId, resetAllLoadingStates])

  // Handle quantity changes
  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  // Handle option selection
  const handleOptionChange = (optionId: string, itemId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: itemId,
    }))

    // Clear validation error for this option
    if (validationErrors[optionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[optionId]
        return newErrors
      })
    }
  }

  // Validate options before adding to cart
  const validateOptions = (): boolean => {
    if (!product || !product.options) return true

    const errors: Record<string, string> = {}

    product.options.forEach((option) => {
      // Check if option is required
      const isRequired = option.flag === "1" || Number(option.min_quantity) > 0
      if (isRequired) {
        if (!selectedOptions[option.id]) {
          errors[option.id] = `Please select a ${option.name.toLowerCase()}`
        }
      }
    })

    // Set validation errors
    setValidationErrors(errors)

    return Object.keys(errors).length === 0
  }

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return

    // Validate options
    if (!validateOptions()) {
      return
    }

    setIsAddingToCart(true)

    try {
      await addItem(product, selectedOptions, quantity)
      // Reset the selected options after successfully adding to cart
      const initialOptions: Record<string, any> = {}
      product.options?.forEach((option: ProductOption) => {
        if (option.flag === "1" && option.items.length > 0) {
          // For radio options, select the first item by default
          if (option.min_quantity === "1" && option.quantity === "1") {
            initialOptions[option.id] = option.items[0].id
          }
        }
      })
      setSelectedOptions(initialOptions)

      // Reset quantity back to 1
      setQuantity(1)
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Get formatted description
  const getFormattedDescription = (html: string) => {
    // Extract content between <short_desc> tags
    const shortDescMatch = html.match(/<short_desc>(.*?)<\/short_desc>/s)
    return shortDescMatch ? shortDescMatch[1] : html
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Get optimized image URL
  const getImageUrl = () => {
    if (imageError || !product?.large_image || product.large_image.includes("no_image")) {
      // Return the business logo if available, otherwise use a placeholder
      return logoImage && logoImage !== "undefined" && logoImage !== "null"
        ? logoImage
        : "/placeholder.svg?height=600&width=600"
    }
    return product.large_image
  }

  // Handle category navigation with hard reload
  const handleCategoryClick = (e: React.MouseEvent<HTMLAnchorElement>, categoryId: string) => {
    e.preventDefault()
    console.log(`Category clicked from product detail: ${categoryId}`)

    // Create a URL with the category parameter
    const url = `/?category=${categoryId}`

    // Use a standard HTML anchor with target="_self" to force a full page reload
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.target = "_self"
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Header */}
        <SharedHeader />

        {/* Breadcrumb */}
        <div className="bg-white py-4 px-4 md:px-6 lg:px-8 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center text-sm text-gray-500">
              <button onClick={() => router.push("/")} className="hover:text-gray-700">
                Home
              </button>
              <span className="mx-2">/</span>
              <button onClick={() => router.push("/")} className="hover:text-gray-700">
                Menu
              </button>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Loading...</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Product Image - Left Side */}
            <div className="md:w-1/2">
              <ProductImageSkeleton />
            </div>

            {/* Product Info and Options - Right Side */}
            <div className="md:w-1/2 flex flex-col">
              <ProductInfoSkeleton />
            </div>
          </div>
        </main>

        {/* Branch Selection Modal */}
        <BranchSelectionModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />

        {/* Cart Sidebar */}
        <CartSidebar />

        {/* Cart Notification */}
        <CartNotificationWrapper />

        {/* View Cart Button */}
        <ViewCartButton />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error || "Product not found"}</div>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    )
  }

  const hasDiscount = product.discount && Number.parseFloat(product.discount) > 0
  const originalPrice = hasDiscount
    ? (Number.parseInt(product.price) / (1 - Number.parseFloat(product.discount) / 100)).toFixed(0)
    : null
  const formattedDescription = getFormattedDescription(product.desc)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <SharedHeader />

      {/* Breadcrumb */}
      <div className="bg-white py-4 px-4 md:px-6 lg:px-8 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <a
              href={`/?category=${product?.menu_cat_id}`}
              className="hover:text-gray-700"
              style={{ color: colors.body.fontColor || "#000000" }}
              onClick={(e) => handleCategoryClick(e, product?.menu_cat_id)}
            >
              {product?.category || "Menu"}
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product?.name}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Image - Left Side */}
          <div className="md:w-1/2">
            <div className="relative h-[600px] w-full rounded-lg overflow-hidden bg-gray-100">
              {/* Image loading skeleton */}
              {!imageLoaded && !imageError && <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>}

              <Image
                src={getImageUrl() || "/placeholder.svg"}
                alt={product.name}
                fill
                className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                onLoad={handleImageLoad}
                onError={handleImageError}
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                placeholder="blur"
              />

              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm px-2 py-1 rounded font-medium">
                  {product.discount}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Product Info and Options - Right Side */}
          <div className="md:w-1/2 flex flex-col">
            {/* Category */}
            <div className="text-sm text-gray-500 uppercase tracking-wide mb-1">{product.category || "Food Item"}</div>

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>

            {/* Description - Updated to properly render HTML */}
            <div
              className="prose prose-sm max-w-none text-gray-600 mb-4"
              dangerouslySetInnerHTML={{ __html: formattedDescription }}
            />

            {/* Price */}
            <div className="flex items-center mt-2 mb-6">
              <span className="text-2xl font-bold" style={{ color: colors.button.bg }}>
                {formatCurrency(Number(product.price), product.currency)}
              </span>
              {originalPrice && (
                <span className="ml-2 text-lg line-through text-gray-400">
                  {formatCurrency(Number(originalPrice), product.currency)}
                </span>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center mb-8">
              <div className="flex items-center border rounded-md overflow-hidden mr-4">
                <button
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1 || isAddingToCart}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-12 h-10 flex items-center justify-center bg-white">{quantity}</div>
                <button
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                  onClick={incrementQuantity}
                  disabled={isAddingToCart}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                className="flex-1 h-10 text-base"
                style={{
                  backgroundColor: colors.button.bg,
                  color: colors.button.fontColor,
                  borderRadius: colors.button.radius,
                }}
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Adding...</span>
                  </div>
                ) : (
                  "Add to Cart"
                )}
              </Button>
            </div>

            {/* Options */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-6">
                {product.options.map((option) => {
                  const isRequired = option.flag === "1" || Number(option.min_quantity) > 0
                  return (
                    <div key={option.id} className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg">{option.name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {isRequired ? "(Required)" : "(Optional)"}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {option.items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                              selectedOptions[option.id] === item.id ? "bg-blue-50" : ""
                            }`}
                            style={
                              selectedOptions[option.id] === item.id
                                ? { borderWidth: "1px", borderStyle: "solid", borderColor: colors.button.bg }
                                : { borderWidth: "1px", borderStyle: "solid", borderColor: "#e5e7eb" }
                            }
                            onClick={() => handleOptionChange(option.id, item.id)}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  selectedOptions[option.id] === item.id ? "border-2" : "border-gray-300"
                                }`}
                                style={
                                  selectedOptions[option.id] === item.id
                                    ? { borderWidth: "2px", borderStyle: "solid", borderColor: colors.button.bg }
                                    : { borderWidth: "1px", borderStyle: "solid", borderColor: "#d1d5db" }
                                }
                              >
                                {selectedOptions[option.id] === item.id && (
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: colors.button.bg }}
                                  ></div>
                                )}
                              </div>
                              <span className="ml-3">{item.name}</span>
                            </div>

                            {Number(item.price) > 0 && (
                              <span className="text-sm font-medium">
                                {formatCurrency(Number(item.price), product.currency)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <SharedFooter />

      {/* Branch Selection Modal */}
      <BranchSelectionModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />

      {/* Cart Sidebar */}
      <CartSidebar />

      {/* Cart Notification */}
      <CartNotificationWrapper />

      {/* View Cart Button */}
      <ViewCartButton />
    </div>
  )
}
