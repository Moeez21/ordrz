"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { CartSidebar } from "./cart-sidebar"
import { CartNotificationWrapper } from "./cart-notification-wrapper"
import { ViewCartButton } from "./view-cart-button"
import { SharedHeader } from "./shared-header"
import { getCookie } from "@/utils/cookies"
import { formatCurrency } from "@/utils/format"
import type { Product, ProductOption } from "@/types/product"
import { SharedFooter } from "./shared-footer"
import { useThemeColors } from "@/context/theme-context"
import { useThemeData } from "@/context/api-context"

interface ProductDetailPageProps {
  productId: string
}

// Using default export as required
export default function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const router = useRouter()
  const { addItem, isItemLoading, setIsCartOpen } = useCart()
  const { colors } = useThemeColors()
  const { logoImage } = useThemeData()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isBranchModalOpen, setBranchModalOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [imageError, setImageError] = useState(false)

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get wres_id from cookie or use default
        const wresId = getCookie("wres_id") || "18"

        const response = await fetch(`/api/product-details?business_id=${wresId}&item_id=${productId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch product details: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.items && data.items.length > 0) {
          const productData = data.items[0]
          setProduct(productData)

          // Initialize selected options for required options
          const initialOptions: Record<string, any> = {}
          productData.options?.forEach((option: ProductOption) => {
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
  }, [productId])

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

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

  // Function to open cart sidebar
  const openCart = () => {
    setIsCartOpen(true)
  }

  // Extract description text from HTML
  const getPlainDescription = (html: string) => {
    // Extract content between short_desc tags if present
    const shortDescMatch = html?.match(/<short_desc>(.*?)<\/short_desc>/s)
    if (shortDescMatch) return shortDescMatch[1]

    // Otherwise return the HTML as is
    return html || ""
  }

  // Handle image errors
  const handleImageError = () => {
    setImageError(true)
  }

  // Get optimized image URL
  const getProductImage = () => {
    if (
      imageError ||
      !product?.large_image ||
      product.large_image.includes("no_image") ||
      product.large_image === "https://static.tossdown.com/images/150x150/no_image.jpg"
    ) {
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
        {/* Free delivery banner */}
        <div className="bg-black text-white text-center py-2 text-sm">Free delivery on orders over PKR 1000</div>

        {/* Header placeholder */}
        <div className="border-b py-4 px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div>
                <div className="h-4 w-32 bg-gray-200 animate-pulse mb-1 rounded"></div>
                <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-10 w-20 rounded-md bg-gray-200 animate-pulse hidden md:block"></div>
              <div className="h-10 w-20 rounded-md bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Breadcrumb placeholder */}
        <div className="bg-white py-2 px-4 md:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center">
              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
              <span className="mx-2">/</span>
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              <span className="mx-2">/</span>
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Product Image placeholder */}
            <div className="md:w-1/2">
              <div className="relative h-[500px] w-full rounded-lg overflow-hidden bg-gray-200 animate-pulse"></div>
            </div>

            {/* Product Info placeholder */}
            <div className="md:w-1/2 flex flex-col">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-8 w-3/4 bg-gray-200 animate-pulse rounded mb-3"></div>
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-4 w-full bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded mb-6"></div>

              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mb-8"></div>

              {/* Options placeholder */}
              <div className="space-y-6 mb-8">
                {[1, 2].map((i) => (
                  <div key={i} className="mb-6">
                    <div className="h-12 w-full bg-gray-200 animate-pulse rounded-md mb-3"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-14 w-full bg-gray-200 animate-pulse rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quantity and Add to Cart placeholder */}
              <div className="flex items-center mb-8">
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-md mr-4"></div>
                <div className="h-10 flex-1 bg-gray-200 animate-pulse rounded-md"></div>
              </div>

              {/* Social Sharing placeholder */}
              <div className="mt-6">
                <div className="flex items-center">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mr-4"></div>
                  <div className="flex space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error || "Product not found"}</div>
        <Button onClick={() => router.push("/")}>Return to Home</Button>
      </div>
    )
  }

  const hasDiscount = product.discount && Number.parseFloat(product.discount) > 0
  const originalPrice = hasDiscount && product.originalPrice ? product.originalPrice : null
  const description = getPlainDescription(product.desc)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Free delivery banner */}
      <div className="bg-black text-white text-center py-2 text-sm">Free delivery on orders over PKR 1000</div>

      {/* Use the shared header component */}
      <SharedHeader />

      {/* Breadcrumb */}
      <div className="bg-white py-4 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:underline" style={{ color: colors.body.fontColor || "#000000" }}>
              Home
            </Link>
            <span className="mx-2">/</span>
            <a
              href={`/?category=${product?.menu_cat_id}`}
              className="hover:underline"
              style={{ color: colors.body.fontColor || "#000000" }}
              onClick={(e) => handleCategoryClick(e, product?.menu_cat_id)}
            >
              {product?.category || "Menu"}
            </a>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{product?.name}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Image - Left Side */}
          <div className="md:w-1/2">
            <div className="relative h-[500px] w-full rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={getProductImage() || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                onError={handleImageError}
              />
              {product?.discount && Number.parseFloat(product.discount) > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                  {product.discount}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Product Info and Options - Right Side */}
          <div className="md:w-1/2 flex flex-col">
            {/* Category */}
            <div className="text-sm text-gray-700 uppercase mb-1">{product?.category}</div>

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold mb-3">{product?.name}</h1>

            {/* Description - Updated to properly render HTML */}
            <div
              className="prose prose-sm max-w-none text-gray-700 mb-4"
              dangerouslySetInnerHTML={{ __html: product ? getPlainDescription(product.desc) : "" }}
            />

            {/* Price */}
            <div className="flex items-center mt-2 mb-6">
              <span className="text-2xl font-bold" style={{ color: colors.button.bg || "#000000" }}>
                {product ? formatCurrency(Number(product.price), product.currency || "PKR") : ""}
              </span>
              {product?.discount && Number.parseFloat(product.discount) > 0 && product.originalPrice && (
                <span className="ml-2 text-lg line-through text-gray-400">
                  {formatCurrency(Number(product.originalPrice), product.currency || "PKR")}
                </span>
              )}
            </div>

            {/* Dynamic Options */}
            {product?.options && product.options.length > 0 && (
              <div className="space-y-6 mb-8">
                {product.options.map((option) => {
                  const isRequired = option.flag === "1" || Number(option.min_quantity) > 0
                  const hasError = !!validationErrors[option.id]

                  return (
                    <div key={option.id} className="mb-6">
                      <div
                        className={`p-3 rounded-md flex items-center justify-between mb-3 ${
                          isRequired
                            ? hasError
                              ? "bg-red-100 border-red-200"
                              : selectedOptions[option.id]
                                ? "bg-green-100 border-green-200"
                                : "bg-gray-200"
                            : "bg-gray-200"
                        }`}
                      >
                        <h3 className="text-base font-semibold">{option.name}</h3>
                        {isRequired && (
                          <span
                            className={`text-xs text-white px-2 py-0.5 rounded ${
                              selectedOptions[option.id] ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {selectedOptions[option.id] ? "Selected" : "Required"}
                          </span>
                        )}
                      </div>

                      {hasError && <div className="text-red-500 text-sm mb-2">{validationErrors[option.id]}</div>}

                      <div className="space-y-2">
                        {option.items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center py-3 px-3 cursor-pointer last:border-b-0 ${
                              selectedOptions[option.id] === item.id
                                ? "bg-blue-50"
                                : hasError
                                  ? "bg-red-50/30 hover:bg-red-50/50"
                                  : "hover:bg-gray-50"
                            }`}
                            style={{
                              borderBottomWidth: "1px",
                              borderBottomStyle: "solid",
                              borderBottomColor: "#f3f4f6",
                              ...(selectedOptions[option.id] === item.id
                                ? {
                                    borderWidth: "1px",
                                    borderStyle: "solid",
                                    borderColor: colors.button.bg || "#000000",
                                  }
                                : {}),
                            }}
                            onClick={() => handleOptionChange(option.id, item.id)}
                          >
                            <div
                              className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center`}
                              style={
                                selectedOptions[option.id] === item.id
                                  ? {
                                      borderWidth: "2px",
                                      borderStyle: "solid",
                                      borderColor: colors.button.bg || "#000000",
                                    }
                                  : hasError
                                    ? { borderWidth: "1px", borderStyle: "solid", borderColor: "#f87171" }
                                    : { borderWidth: "1px", borderStyle: "solid", borderColor: "#d1d5db" }
                              }
                            >
                              {selectedOptions[option.id] === item.id && (
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: colors.button.bg || "#000000" }}
                                ></div>
                              )}
                            </div>
                            <span className="ml-3 text-base font-medium">{item.name}</span>
                            {Number(item.price) > 0 && (
                              <span className="ml-auto text-sm font-medium text-gray-700">
                                {formatCurrency(Number(item.price), product.currency || "PKR")}
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

            {/* Quantity and Add to Cart */}
            <div className="flex items-center mb-8">
              <div
                className="flex items-center overflow-hidden mr-4"
                style={{
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "#e5e7eb",
                  borderRadius: "0.375rem",
                }}
              >
                <button
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-12 h-10 flex items-center justify-center bg-white">{quantity}</div>
                <button
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                  onClick={() => handleQuantityChange(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                className="flex-1 h-10 text-base"
                style={{
                  backgroundColor: colors.button.bg || "#000000",
                  color: colors.button.fontColor || "#ffffff",
                  borderRadius: colors.button.radius || "8px",
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <SharedFooter />

      {/* Cart Sidebar */}
      <CartSidebar />

      {/* Cart Notification */}
      <CartNotificationWrapper />

      {/* View Cart Button */}
      <ViewCartButton />
    </div>
  )
}
