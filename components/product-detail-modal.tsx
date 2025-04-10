"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Heart, Minus, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeColors } from "@/context/theme-context"
import { useCart } from "@/context/cart-context"
import { formatCurrency } from "@/utils/format"
import { getCookie } from "@/utils/cookies"
import type { Product } from "@/types/product"

interface ProductDetailModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
}

interface OptionItem {
  id: string
  name: string
  price: string
}

interface OptionGroup {
  id: string
  name: string
  flag: string
  quantity: string
  min_quantity: string
  items: OptionItem[]
  isRequired: boolean
}

interface GroupedOptions {
  required: OptionGroup[]
  extras: OptionGroup[]
  sides: OptionGroup[]
  dips: OptionGroup[]
}

export function ProductDetailModal({ productId, isOpen, onClose }: ProductDetailModalProps) {
  const { colors } = useThemeColors()
  const { addItem, isLoading, isItemLoading } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoadingProduct, setIsLoadingProduct] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const [groupedOptions, setGroupedOptions] = useState<GroupedOptions>({
    required: [],
    extras: [],
    sides: [],
    dips: [],
  })
  const [totalPrice, setTotalPrice] = useState(0)
  const [basePrice, setBasePrice] = useState(0)
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})

  // Fetch product details
  useEffect(() => {
    if (!isOpen || !productId) return

    const fetchProductDetails = async () => {
      try {
        setIsLoadingProduct(true)
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
          setBasePrice(Number(productData.price))

          // Group options by type
          if (productData.options && productData.options.length > 0) {
            const grouped: GroupedOptions = {
              required: [],
              extras: [],
              sides: [],
              dips: [],
            }

            productData.options.forEach((option: any) => {
              const isRequired = option.flag === "1" || Number(option.min_quantity) > 0

              // Categorize options based on name
              const optionName = option.name.toLowerCase()
              if (isRequired) {
                grouped.required.push({ ...option, isRequired })
              } else if (optionName.includes("topping") || optionName.includes("extra")) {
                grouped.extras.push({ ...option, isRequired })
              } else if (
                optionName.includes("side") ||
                optionName.includes("fries") ||
                optionName.includes("lasagna") ||
                optionName.includes("spaghetti")
              ) {
                grouped.sides.push({ ...option, isRequired })
              } else if (
                optionName.includes("dip") ||
                optionName.includes("sauce") ||
                optionName.includes("mayo") ||
                optionName.includes("peri")
              ) {
                grouped.dips.push({ ...option, isRequired })
              } else {
                // Default to extras if we can't categorize
                grouped.extras.push({ ...option, isRequired })
              }
            })

            setGroupedOptions(grouped)

            // Initialize selected options for required radio options
            const initialOptions: Record<string, any> = {}
            grouped.required.forEach((option) => {
              if (
                option.isRequired &&
                option.min_quantity === "1" &&
                option.quantity === "1" &&
                option.items.length > 0
              ) {
                initialOptions[option.id] = option.items[0].id
              }
            })

            setSelectedOptions(initialOptions)
          }
        } else {
          throw new Error("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product details:", error)
        setError(error instanceof Error ? error.message : "Failed to load product details")
      } finally {
        setIsLoadingProduct(false)
      }
    }

    fetchProductDetails()
    setQuantity(1)
  }, [productId, isOpen])

  // Calculate total price
  useEffect(() => {
    if (!product) return

    let optionsTotal = 0

    // Calculate price from radio selections
    Object.entries(selectedOptions).forEach(([optionId, itemId]) => {
      if (typeof itemId === "string") {
        const option = product.options?.find((opt) => opt.id === optionId)
        const item = option?.items.find((item) => item.id === itemId)
        if (item) {
          optionsTotal += Number(item.price) || 0
        }
      }
    })

    // Calculate price from checkbox selections
    Object.entries(selectedOptions).forEach(([optionId, itemIds]) => {
      if (Array.isArray(itemIds)) {
        const option = product.options?.find((opt) => opt.id === optionId)
        itemIds.forEach((itemId) => {
          const item = option?.items.find((item) => item.id === itemId)
          if (item) {
            optionsTotal += Number(item.price) || 0
          }
        })
      }
    })

    const total = (basePrice + optionsTotal) * quantity
    setTotalPrice(total)
  }, [product, selectedOptions, quantity, basePrice])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setValidationErrors({})
    }
  }, [isOpen])

  // Handle radio option selection
  const handleRadioChange = (optionId: string, itemId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: itemId,
    }))

    // Clear validation error
    if (validationErrors[optionId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[optionId]
        return newErrors
      })
    }
  }

  // Handle checkbox option selection
  const handleCheckboxChange = (optionId: string, itemId: string) => {
    setSelectedOptions((prev) => {
      const currentSelection = prev[optionId] || []

      if (Array.isArray(currentSelection)) {
        // If already selected, remove it
        if (currentSelection.includes(itemId)) {
          return {
            ...prev,
            [optionId]: currentSelection.filter((id) => id !== itemId),
          }
        }
        // Otherwise add it
        else {
          return {
            ...prev,
            [optionId]: [...currentSelection, itemId],
          }
        }
      } else {
        // Initialize as array if not already
        return {
          ...prev,
          [optionId]: [itemId],
        }
      }
    })
  }

  // Check if a radio option is selected
  const isRadioSelected = (optionId: string, itemId: string) => {
    return selectedOptions[optionId] === itemId
  }

  // Check if a checkbox option is selected
  const isCheckboxSelected = (optionId: string, itemId: string) => {
    const selection = selectedOptions[optionId]
    return Array.isArray(selection) && selection.includes(itemId)
  }

  // Validate required options
  const validateOptions = () => {
    const errors: Record<string, boolean> = {}

    groupedOptions.required.forEach((option) => {
      if (option.isRequired) {
        if (!selectedOptions[option.id]) {
          errors[option.id] = true
        }
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return

    // Validate required options
    if (!validateOptions()) {
      return
    }

    try {
      // Process options for cart
      const processedOptions: Record<string, any> = {}

      // Process radio options
      Object.entries(selectedOptions).forEach(([optionId, value]) => {
        if (typeof value === "string") {
          const option = product.options?.find((opt) => opt.id === optionId)
          const item = option?.items.find((item) => item.id === value)
          if (option && item) {
            processedOptions[option.id] = value
          }
        }
      })

      // Process checkbox options
      Object.entries(selectedOptions).forEach(([optionId, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          const option = product.options?.find((opt) => opt.id === optionId)
          if (option) {
            processedOptions[option.id] = value
          }
        }
      })

      // Add to cart
      await addItem(product, processedOptions, quantity)

      // Close modal after successful add
      onClose()
    } catch (error) {
      console.error("Error adding to cart:", error)
    }
  }

  // Increment quantity
  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  // Decrement quantity
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  // Format description from HTML
  const formatDescription = (html: string) => {
    // Extract content between short_desc tags if present
    const shortDescMatch = html.match(/<short_desc>(.*?)<\/short_desc>/s)
    return shortDescMatch ? shortDescMatch[1] : html
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4"
      style={{
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="relative bg-white w-full max-w-4xl mx-4 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button className="absolute top-4 right-4 z-10 p-1 rounded-full bg-white/80 hover:bg-white" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>

        {/* Favorite button */}
        <button className="absolute top-4 right-14 z-10 p-1 rounded-full bg-white/80 hover:bg-white">
          <Heart className="h-5 w-5" />
        </button>

        {isLoadingProduct ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading product details...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : product ? (
          <>
            {/* Product header */}
            <div className="flex flex-col md:flex-row">
              {/* Product image */}
              <div className="relative w-full md:w-2/5 h-64 md:h-auto">
                <Image
                  src={
                    product.large_image && !product.large_image.includes("no_image")
                      ? product.large_image
                      : "/placeholder.svg?height=400&width=400"
                  }
                  alt={product.name}
                  fill
                  className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                {product.discount && Number(product.discount) > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    {product.discount}% OFF
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="p-6 md:w-3/5">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
                    <div className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {product.category}
                    </div>
                  </div>
                  <div className="text-xl font-bold" style={{ color: colors.button.bg }}>
                    {formatCurrency(Number(product.price), product.currency)}
                  </div>
                </div>

                <div
                  className="mt-4 text-gray-600"
                  dangerouslySetInnerHTML={{ __html: formatDescription(product.desc) }}
                />
              </div>
            </div>

            {/* Options section */}
            <div className="flex-1 overflow-y-auto p-6 pt-0">
              {/* Required options */}
              {groupedOptions.required.length > 0 && (
                <div className="mb-6">
                  {groupedOptions.required.map((option) => (
                    <div key={option.id} className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">
                          Select Your {option.name}
                          {option.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        {option.isRequired && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Required</span>
                        )}
                      </div>

                      {validationErrors[option.id] && (
                        <p className="text-red-500 text-sm mb-2">Please select an option</p>
                      )}

                      <div className="bg-gray-100 rounded-md p-2">
                        {option.items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer ${
                              isRadioSelected(option.id, item.id) ? "bg-blue-50" : ""
                            }`}
                            onClick={() => handleRadioChange(option.id, item.id)}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                  isRadioSelected(option.id, item.id) ? "border-2 border-blue-500" : "border-gray-300"
                                }`}
                              >
                                {isRadioSelected(option.id, item.id) && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                )}
                              </div>
                              <span className="ml-3">{item.name}</span>
                            </div>

                            {Number(item.price) > 0 && (
                              <span className="text-sm">+{formatCurrency(Number(item.price), product.currency)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra toppings */}
              {groupedOptions.extras.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Extra Toppings</h3>
                  <div className="bg-gray-100 rounded-md p-2">
                    {groupedOptions.extras.map((option) =>
                      option.items.map((item) => (
                        <div
                          key={`${option.id}-${item.id}`}
                          className="flex items-center justify-between p-3 border-b last:border-b-0"
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`extra-${option.id}-${item.id}`}
                              checked={isCheckboxSelected(option.id, item.id)}
                              onChange={() => handleCheckboxChange(option.id, item.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <label htmlFor={`extra-${option.id}-${item.id}`} className="ml-3 cursor-pointer">
                              Extra {item.name}
                            </label>
                          </div>

                          {Number(item.price) > 0 && (
                            <span className="text-sm">{formatCurrency(Number(item.price), product.currency)}</span>
                          )}
                        </div>
                      )),
                    )}
                  </div>
                </div>
              )}

              {/* Sidelines */}
              {groupedOptions.sides.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Sidelines</h3>
                  <div className="bg-gray-100 rounded-md p-2">
                    {groupedOptions.sides.map((option) =>
                      option.items.map((item) => (
                        <div
                          key={`${option.id}-${item.id}`}
                          className="flex items-center justify-between p-3 border-b last:border-b-0"
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`side-${option.id}-${item.id}`}
                              checked={isCheckboxSelected(option.id, item.id)}
                              onChange={() => handleCheckboxChange(option.id, item.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <label htmlFor={`side-${option.id}-${item.id}`} className="ml-3 cursor-pointer">
                              {item.name}
                            </label>
                          </div>

                          {Number(item.price) > 0 && (
                            <span className="text-sm">{formatCurrency(Number(item.price), product.currency)}</span>
                          )}
                        </div>
                      )),
                    )}
                  </div>
                </div>
              )}

              {/* Dips */}
              {groupedOptions.dips.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Dips</h3>
                  <div className="bg-gray-100 rounded-md p-2">
                    {groupedOptions.dips.map((option) =>
                      option.items.map((item) => (
                        <div
                          key={`${option.id}-${item.id}`}
                          className="flex items-center justify-between p-3 border-b last:border-b-0"
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`dip-${option.id}-${item.id}`}
                              checked={isCheckboxSelected(option.id, item.id)}
                              onChange={() => handleCheckboxChange(option.id, item.id)}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <label htmlFor={`dip-${option.id}-${item.id}`} className="ml-3 cursor-pointer">
                              {item.name}
                            </label>
                          </div>

                          {Number(item.price) > 0 && (
                            <span className="text-sm">{formatCurrency(Number(item.price), product.currency)}</span>
                          )}
                        </div>
                      )),
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with quantity and add to cart */}
            <div className="border-t p-4 flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="w-10 h-10 flex items-center justify-center border rounded-l-md"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="w-12 h-10 flex items-center justify-center border-t border-b">{quantity}</div>
                <button
                  className="w-10 h-10 flex items-center justify-center border rounded-r-md"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center">
                <div className="mr-4 font-semibold">from {formatCurrency(totalPrice, product.currency)}</div>
                <Button
                  className="min-w-[120px]"
                  style={{
                    backgroundColor: colors.button.bg,
                    color: colors.button.fontColor,
                    borderRadius: colors.button.radius,
                  }}
                  onClick={handleAddToCart}
                  disabled={isLoading || isItemLoading(product.menu_item_id)}
                >
                  {isItemLoading(product.menu_item_id) ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Add To Cart"
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
