"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { X, Minus, Plus, Loader2 } from "lucide-react"
import { useThemeColors } from "../context/theme-context"
import type { Product, ProductOption } from "../types/product"
import { formatCurrency } from "../utils/format"
import { useCart } from "../context/cart-context"
// Add import for BranchSelectionModal
import { BranchSelectionModal } from "./branch-selection-modal"
import { ProductOptionsModalSkeleton } from "./product-options-modal-skeleton"

interface ProductOptionsModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, selectedOptions: Record<string, any>, quantity: number) => void
  currency: string
}

interface ValidationState {
  isValid: boolean
  message: string
  status: "error" | "success" | "warning" | "info"
  interacted: boolean // Track if user has interacted with this option
}

function ProductOptionsModal({ product, isOpen, onClose, onAddToCart, currency }: ProductOptionsModalProps) {
  const { colors } = useThemeColors()
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({})
  const [optionQuantities, setOptionQuantities] = useState<Record<string, Record<string, number>>>({})
  const [basePrice, setBasePrice] = useState<number>(0)
  const [totalPrice, setTotalPrice] = useState<number>(0)

  const [validationState, setValidationState] = useState<Record<string, ValidationState>>({})
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({})
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null)
  const [optionSections, setOptionSections] = useState<{ required: ProductOption[]; optional: ProductOption[] }>({
    required: [],
    optional: [],
  })
  const [imageError, setImageError] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const { isLoading, isItemLoading, resetAllLoadingStates } = useCart() // Add this line to get isLoading from cart context

  const optionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const contentRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Add a new state to track the loading state specifically for the modal's Add to Cart button
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  // Add state for branch selection modal
  const [isBranchModalOpen, setBranchModalOpen] = useState(false)
  // Add state for modal closing animation
  const [isClosing, setIsClosing] = useState(false)

  // Handle smooth closing of the modal
  const handleCloseModal = useCallback(() => {
    if (isAddingToCart) return // Don't close if we're in the middle of adding to cart

    setIsClosing(true)
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }, [isAddingToCart, onClose])

  // Update the initialization logic to properly handle required options
  useEffect(() => {
    if (!isOpen) return

    // Reset image error state when modal opens
    setImageError(false)
    setIsImageLoading(true)
    setSelectedOptions({})
    setOptionQuantities({})
    setQuantity(1)
    setBasePrice(Number(product.price) || 0)
    setShowValidationErrors(false)
    setFormSubmitted(false)
    setIsAddingToCart(false) // Reset the local loading state when modal opens
    setIsClosing(false) // Reset closing state

    // Initialize validation state and expanded state
    const initialValidation: Record<string, ValidationState> = {}
    const initialExpanded: Record<string, boolean> = {}
    const initialQuantities: Record<string, Record<string, number>> = {}

    // Separate required and optional options
    const required: ProductOption[] = []
    const optional: ProductOption[] = []

    if (product.options && product.options.length > 0) {
      // Find the first required option or the first option if none are required
      let firstOptionToExpand: string | null = null

      product.options.forEach((option, index) => {
        const optionType = getOptionType(option)
        const minQuantity = Number.parseInt(option.min_quantity) || 0
        const maxQuantity = Number.parseInt(option.quantity) || 0
        const isRequired = isOptionRequired(option)

        // Add to appropriate array
        if (isRequired) {
          required.push(option)
        } else {
          optional.push(option)
        }

        // Set initial validation state based on whether the option is required
        initialValidation[option.id] = {
          isValid: !isRequired, // Optional options start as valid, required ones as invalid
          message: isRequired ? `Please select at least ${minQuantity || 1} option(s)` : "This selection is optional",
          status: isRequired ? "error" : "info",
          interacted: false, // Initially not interacted with
        }

        // By default, collapse all options
        initialExpanded[option.id] = false

        // Initialize counter options
        if (optionType === "counter") {
          initialQuantities[option.id] = {}
        }

        // Find the first required option to expand
        if (firstOptionToExpand === null) {
          if (isRequired) {
            firstOptionToExpand = option.id
          } else if (index === 0) {
            // If no required options, use the first one
            firstOptionToExpand = option.id
          }
        }
      })

      // Expand the first option
      if (firstOptionToExpand) {
        initialExpanded[firstOptionToExpand] = true
        setActiveOptionId(firstOptionToExpand)
      }
    }

    setOptionSections({ required, optional })
    setValidationState(initialValidation)
    setExpandedOptions(initialExpanded)
    setOptionQuantities(initialQuantities)
  }, [isOpen, product.price, product.options])

  // Find this useEffect that's causing the issue
  useEffect(() => {
    if (isOpen) {
      // Only reset loading states when the modal opens
      resetAllLoadingStates()
    }
  }, [isOpen, resetAllLoadingStates])

  // Calculate total price whenever selections or quantity changes
  useEffect(() => {
    if (!isOpen) return

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

    // Calculate price from counter selections
    Object.entries(optionQuantities).forEach(([optionId, items]) => {
      const option = product.options?.find((opt) => opt.id === optionId)
      Object.entries(items).forEach(([itemId, qty]) => {
        const item = option?.items.find((item) => item.id === itemId)
        if (item && qty > 0) {
          optionsTotal += (Number(item.price) || 0) * qty
        }
      })
    })

    const total = (basePrice + optionsTotal) * quantity
    setTotalPrice(total)
  }, [selectedOptions, optionQuantities, quantity, basePrice, product.options, isOpen])

  // Update the validation logic to match the new requirements
  useEffect(() => {
    if (!isOpen || !product.options) return

    // Use setTimeout to avoid immediate state updates causing jerky UI
    const timer = setTimeout(() => {
      const newValidationState = { ...validationState }

      product.options.forEach((option) => {
        const optionType = getOptionType(option)
        const minQuantity = Number.parseInt(option.min_quantity) || 0
        const maxQuantity = Number.parseInt(option.quantity) || 0
        const isRequired = isOptionRequired(option)
        const currentValidation = newValidationState[option.id] || {
          isValid: !isRequired,
          message: "",
          status: "info",
          interacted: false,
        }

        let selectedCount = 0
        let isValid = true
        let message = ""
        let status: "error" | "success" | "warning" | "info" = "info"

        // Calculate selected count based on option type
        if (optionType === "radio") {
          selectedCount = selectedOptions[option.id] ? 1 : 0

          if (isRequired && selectedCount < 1) {
            isValid = false
            message = "Please select an option"
            status = "error"
          } else if (selectedCount === 1) {
            isValid = true
            const selectedItem = option.items.find((item) => item.id === selectedOptions[option.id])
            message = selectedItem ? `Selected: ${selectedItem.name}` : ""
            status = "success"
          } else {
            message = isRequired ? "Selection required" : "This selection is optional"
            status = isRequired ? "warning" : "info"
          }
        } else if (optionType === "checkbox") {
          const selection = selectedOptions[option.id] || []
          selectedCount = Array.isArray(selection) ? selection.length : 0

          if (isRequired && selectedCount < minQuantity) {
            isValid = false
            message =
              selectedCount === 0
                ? `Please select at least ${minQuantity} option(s)`
                : `Please select ${minQuantity - selectedCount} more option(s)`
            status = "error"
          } else if (maxQuantity > 0 && selectedCount > maxQuantity) {
            isValid = false
            message = `Maximum ${maxQuantity} selections allowed`
            status = "error"
          } else if (selectedCount > 0) {
            message = `${selectedCount} option(s) selected`
            status = "success"
          } else {
            message = isRequired ? "Selection required" : "This selection is optional"
            status = isRequired ? "warning" : "info"
          }
        } else if (optionType === "counter") {
          const totalQuantity = getTotalQuantityForOption(option.id)

          if (isRequired && totalQuantity < (minQuantity || 1)) {
            isValid = false
            message =
              totalQuantity === 0
                ? `Please select at least ${minQuantity || 1} item(s)`
                : `Please select ${(minQuantity || 1) - totalQuantity} more item(s)`
            status = "error"
          } else if (maxQuantity > 0 && totalQuantity > maxQuantity) {
            isValid = false
            message = `Maximum ${maxQuantity} items allowed`
            status = "error"
          } else if (totalQuantity > 0) {
            isValid = true
            message = `${totalQuantity} item(s) selected`
            status = "success"
          } else {
            message = isRequired ? "Selection required" : "This selection is optional"
            status = isRequired ? "warning" : "info"
          }
        }

        newValidationState[option.id] = {
          isValid,
          message,
          status,
          interacted: currentValidation.interacted, // Preserve the interacted state
        }
      })

      setValidationState(newValidationState)
    }, 10) // Small delay to batch updates

    return () => clearTimeout(timer)
  }, [selectedOptions, optionQuantities, product.options, isOpen, validationState])

  // Auto-navigate to next option set when current one is valid
  useEffect(() => {
    if (!isOpen || !product.options || !activeOptionId) return

    const currentValidation = validationState[activeOptionId]

    // If the current option is valid and has success status, find the next required option
    if (currentValidation?.isValid && currentValidation?.status === "success") {
      // Find the index of the current active option
      const currentIndex = product.options.findIndex((option) => option.id === activeOptionId)

      if (currentIndex >= 0 && currentIndex < product.options.length - 1) {
        // Look for the next required option that's not valid yet
        for (let i = currentIndex + 1; i < product.options.length; i++) {
          const nextOption = product.options[i]
          const nextValidation = validationState[nextOption.id]
          const isRequired = isOptionRequired(nextOption)

          if (isRequired && (!nextValidation?.isValid || nextValidation?.status !== "success")) {
            // Found the next required option that needs attention
            const timer = setTimeout(() => {
              // Expand the next option and collapse the current one
              setExpandedOptions((prev) => ({
                ...prev,
                [activeOptionId]: false,
                [nextOption.id]: true,
              }))

              // Set the next option as active
              setActiveOptionId(nextOption.id)

              // Scroll to the next option
              if (optionRefs.current[nextOption.id]) {
                optionRefs.current[nextOption.id]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }
            }, 300) // Small delay for better UX

            return () => clearTimeout(timer)
          }
        }
      }
    }
  }, [validationState, activeOptionId, product.options, isOpen])

  // Determine option type based on min_quantity and quantity
  const getOptionType = (option: ProductOption) => {
    const minQuantity = Number.parseInt(option.min_quantity) || 0
    const maxQuantity = Number.parseInt(option.quantity) || 0

    // Radio button: If min_quantity == 1 && quantity == 1, enforce a single selection
    if (minQuantity === 1 && maxQuantity === 1) {
      return "radio"
    }

    // Number input (counter): If quantity > 1, allow users to increase/decrease quantity
    if (maxQuantity > 1) {
      return "counter"
    }

    // Checkbox: For all other cases, allow multiple selections where applicable
    return "checkbox"
  }

  // Determine if option is required
  const isOptionRequired = (option: ProductOption) => {
    // Check if the flag indicates this is a required option
    // Flag "1" typically means required in this API
    if (option.flag === "1") {
      return true
    }

    // For counter options, they're required if quantity > 0 (even if min_quantity is 0)
    const optionType = getOptionType(option)
    if (optionType === "counter" && Number.parseInt(option.quantity) > 0) {
      return true
    }

    // For other option types, they're required if min_quantity > 0
    const minQuantity = Number.parseInt(option.min_quantity) || 0
    return minQuantity > 0
  }

  // Toggle accordion expansion
  const toggleOption = (optionId: string) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }))

    setActiveOptionId(optionId)

    // Mark this option as interacted with
    setValidationState((prev) => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        interacted: true,
      },
    }))

    // Scroll to the option if it's being expanded
    if (!expandedOptions[optionId] && optionRefs.current[optionId]) {
      optionRefs.current[optionId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  // Handle radio button selection
  const handleRadioSelect = (optionId: string, itemId: string, itemPrice: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: itemId,
    }))

    // If this is a size option, update the base price
    const option = product.options?.find((opt) => opt.id === optionId)
    if (option?.name.toLowerCase().includes("size")) {
      setBasePrice(Number(itemPrice) || 0)
    }

    // Mark this option as interacted with
    setValidationState((prev) => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        interacted: true,
      },
    }))

    // Show validation errors after first selection
    if (!showValidationErrors) {
      setShowValidationErrors(true)
    }
  }

  // Handle checkbox selection
  const handleCheckboxSelect = (optionId: string, itemId: string, option: ProductOption) => {
    const maxAllowed = Number.parseInt(option.quantity)

    setSelectedOptions((prev) => {
      const currentSelection = prev[optionId] || []

      // If already selected, remove it
      if (Array.isArray(currentSelection) && currentSelection.includes(itemId)) {
        return {
          ...prev,
          [optionId]: currentSelection.filter((id) => id !== itemId),
        }
      }
      // If not selected and not exceeding max, add it
      else if (!maxAllowed || (Array.isArray(currentSelection) && currentSelection.length < maxAllowed)) {
        return {
          ...prev,
          [optionId]: Array.isArray(currentSelection) ? [...currentSelection, itemId] : [itemId],
        }
      }

      return prev
    })

    // Mark this option as interacted with
    setValidationState((prev) => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        interacted: true,
      },
    }))

    // Show validation errors after first selection
    if (!showValidationErrors) {
      setShowValidationErrors(true)
    }
  }

  // Handle counter changes with improved validation
  const handleCounterChange = (optionId: string, itemId: string, count: number, option: ProductOption) => {
    const maxAllowed = Number.parseInt(option.quantity) || 0
    const minRequired = Number.parseInt(option.min_quantity) || 0
    const isRequired = isOptionRequired(option)

    // Get current quantities for this option
    const currentQuantities = { ...(optionQuantities[optionId] || {}) }

    // Calculate total quantity across all items in this option (excluding current item)
    const otherItemsTotal = Object.entries(currentQuantities)
      .filter(([id, _]) => id !== itemId)
      .reduce((sum, [_, qty]) => sum + qty, 0)

    // Determine the minimum allowed count for this item
    let minAllowed = 0

    // If this is the only item with a quantity and the option is required,
    // ensure we maintain at least the minimum required quantity
    if (isRequired && otherItemsTotal < (minRequired || 1)) {
      // Calculate how much this item needs to contribute to meet minimum
      minAllowed = Math.max(0, (minRequired || 1) - otherItemsTotal)
    }

    // Ensure count is within allowed range - never go below 0
    const newCount = Math.max(0, count)

    // Check if the new total would exceed maximum (if set)
    const newTotal = otherItemsTotal + newCount
    if (maxAllowed > 0 && newTotal > maxAllowed) {
      // Adjust to maximum allowed
      const adjustedCount = Math.max(minAllowed, newCount - (newTotal - maxAllowed))

      // Update with adjusted count
      setOptionQuantities((prev) => ({
        ...prev,
        [optionId]: {
          ...currentQuantities,
          [itemId]: adjustedCount,
        },
      }))

      // Show a toast or message about maximum limit
      return
    }

    // Update the quantities state
    setOptionQuantities((prev) => ({
      ...prev,
      [optionId]: {
        ...currentQuantities,
        [itemId]: newCount,
      },
    }))

    // Mark this option as interacted with
    setValidationState((prev) => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        interacted: true,
      },
    }))

    // Show validation errors after first selection
    if (!showValidationErrors) {
      setShowValidationErrors(true)
    }

    // Immediately update validation state for better UX
    setValidationState((prev) => {
      const totalQuantity = otherItemsTotal + newCount
      const isValid = !isRequired || totalQuantity >= (minRequired || 1)

      return {
        ...prev,
        [optionId]: {
          isValid,
          message: isValid
            ? `${totalQuantity} item(s) selected`
            : `Please select ${(minRequired || 1) - totalQuantity} more item(s)`,
          status: isValid ? "success" : "error",
          interacted: true,
        },
      }
    })
  }

  // Get the current quantity for a counter option
  const getCounterQuantity = (optionId: string, itemId: string) => {
    return (optionQuantities[optionId] && optionQuantities[optionId][itemId]) || 0
  }

  // Check if an item is selected (for radio and checkbox)
  const isItemSelected = (optionId: string, itemId: string, optionType: string) => {
    if (optionType === "radio") {
      return selectedOptions[optionId] === itemId
    } else if (optionType === "checkbox") {
      const selection = selectedOptions[optionId] || []
      return Array.isArray(selection) && selection.includes(itemId)
    }
    return false
  }

  // Check if all required options are valid
  const isFormValid = () => {
    // Check each option's validation state
    for (const option of product.options || []) {
      const optionId = option.id
      const validation = validationState[optionId]

      // If this is a required option and it's not valid, the form is invalid
      if (isOptionRequired(option) && (!validation || !validation.isValid)) {
        return false
      }
    }

    return true
  }

  // Check if a counter can be decremented
  const canDecrementCounter = (optionId: string, itemId: string, option: ProductOption) => {
    const currentQuantity = getCounterQuantity(optionId, itemId)
    const minRequired = Number.parseInt(option.min_quantity) || 0
    const isRequired = isOptionRequired(option)

    // If quantity is already 0, can't decrement further
    if (currentQuantity <= 0) return false

    // If this option is required, check if decrementing would violate minimum requirement
    if (isRequired) {
      const currentQuantities = optionQuantities[optionId] || {}
      const totalQuantity = Object.values(currentQuantities).reduce((sum, qty) => sum + qty, 0)
      const otherItemsQuantity = totalQuantity - currentQuantity

      // If total would fall below minimum required, don't allow decrement
      if (totalQuantity <= (minRequired || 1)) {
        return false // Never go below minimum required
      }
    }

    return true
  }

  // Update the handleAddToCart function
  const handleAddToCart = async () => {
    setFormSubmitted(true)
    setShowValidationErrors(true)
    setIsAddingToCart(true) // Set local loading state to true when starting the operation

    // Mark all options as interacted with
    const updatedValidation = { ...validationState }
    product.options?.forEach((option) => {
      if (updatedValidation[option.id]) {
        updatedValidation[option.id].interacted = true
      }
    })
    setValidationState(updatedValidation)

    // Check if all required options are valid
    if (!isFormValid()) {
      console.log("Form validation failed", validationState)
      setIsAddingToCart(false) // Reset loading state if validation fails

      // Find the first invalid option
      const firstInvalidOption = product.options?.find((option) => {
        const validation = validationState[option.id]
        return isOptionRequired(option) && (!validation || !validation.isValid)
      })

      if (firstInvalidOption) {
        // Expand the invalid option and collapse others for focus
        const newExpandedState = {} as Record<string, boolean>

        // First collapse all options
        product.options?.forEach((opt) => {
          newExpandedState[opt.id] = false
        })

        // Then expand only the invalid one
        newExpandedState[firstInvalidOption.id] = true

        // Update expanded state
        setExpandedOptions(newExpandedState)
        setActiveOptionId(firstInvalidOption.id)

        // Scroll to the invalid option with a slight delay to ensure DOM updates
        setTimeout(() => {
          if (optionRefs.current[firstInvalidOption.id]) {
            optionRefs.current[firstInvalidOption.id]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }
        }, 100)
      }

      return
    }

    // Process options for cart
    const processedOptions = { ...selectedOptions }

    // Add quantity information for counter options
    Object.keys(optionQuantities).forEach((optionId) => {
      if (Object.keys(optionQuantities[optionId]).length > 0) {
        processedOptions[optionId] = optionQuantities[optionId]
      }
    })

    try {
      // Call the addItem function and wait for it to complete
      await onAddToCart(product, processedOptions, quantity)

      // Reset options and quantities after successful add
      setSelectedOptions({})
      setOptionQuantities({})
      setQuantity(1)

      // Only close the modal if the API call was successful
      handleCloseModal()
    } catch (error: any) {
      // If there's an error, the modal stays open and the button is re-enabled
      console.error("Error adding item to cart:", error)
      setIsAddingToCart(false) // Reset loading state on error

      // Check if we need to show branch selection
      if (error.code === "BRANCH_SELECTION_REQUIRED") {
        setBranchModalOpen(true)
      }
    }
  }

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  // Get plain description text
  const getPlainDescription = (html: string) => {
    return html.replace(/<\/?[^>]+(>|$)/g, "").trim()
  }

  // Add this helper function to get the total quantity for an option
  const getTotalQuantityForOption = (optionId: string) => {
    const quantities = optionQuantities[optionId] || {}
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
  }

  // Get the best available product image
  const getProductImage = () => {
    // If we already know the image has an error, use placeholder
    if (imageError) {
      return "/placeholder.svg?height=600&width=500"
    }

    // Check if product has large_image and it's not a no_image placeholder
    if (
      product.large_image &&
      !product.large_image.includes("no_image") &&
      product.large_image !== "https://static.tossdown.com/images/150x150/no_image.jpg"
    ) {
      return product.large_image
    }

    // Check if product has images array with at least one valid image
    if (product.images && product.images.length > 0) {
      // Find the first valid image in the array
      const validImage = product.images.find((img) => img.image && !img.image.includes("no_image"))
      if (validImage && validImage.image) {
        return validImage.image
      }
    }

    // Check if product has regular image
    if (
      product.image &&
      !product.image.includes("no_image") &&
      product.image !== "https://static.tossdown.com/images/150x150/no_image.jpg"
    ) {
      return product.image
    }

    // Fallback to placeholder
    return "/placeholder.svg?height=600&width=500"
  }

  // Handle image error with improved logging and fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const targetSrc = (e.target as HTMLImageElement).src
    console.error("Error loading product image:", {
      productName: product.name,
      productId: product.menu_item_id,
      attemptedUrl: targetSrc,
      availableSources: {
        large_image: product.large_image,
        image: product.image,
        images_count: product.images?.length || 0,
      },
    })

    // Set error state to trigger fallback
    setImageError(true)

    // Update the image source to placeholder
    if (e.target instanceof HTMLImageElement) {
      e.target.src = "/placeholder.svg?height=600&width=500"
    }
  }

  // Add this function to handle image load
  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  if (!isOpen) return null

  const description = getPlainDescription(product.desc)
  const hasDiscount = product.discount && Number.parseFloat(product.discount) > 0
  const originalPrice = hasDiscount ? product.originalPrice : ""
  const productImage = getProductImage()

  // Enhance the renderOptionSection function to add visual feedback for invalid options
  const renderOptionSection = (option: ProductOption) => {
    const validation = validationState[option.id] || {
      isValid: true,
      message: "",
      status: "info",
      interacted: false,
    }
    const isRequired = isOptionRequired(option)
    const optionType = getOptionType(option)
    const minQuantity = Number.parseInt(option.min_quantity) || 0
    const hasInteracted = validation.interacted
    const showError = isRequired && !validation.isValid && (hasInteracted || formSubmitted)

    // Determine header color based on validation state
    const headerBgColor = isRequired
      ? validation.isValid && validation.status === "success"
        ? "bg-green-100 border-green-200"
        : showError
          ? "bg-red-100 border-red-200"
          : "bg-gray-200"
      : "bg-gray-200"

    return (
      <div
        key={option.id}
        className="mb-6 last:mb-0"
        ref={(el) => (optionRefs.current[option.id] = el)}
        onClick={() => {
          if (!expandedOptions[option.id]) {
            toggleOption(option.id)
          }
        }}
      >
        <div
          className={`p-3 rounded-md flex items-center justify-between mb-3 cursor-pointer transition-colors duration-200 ${headerBgColor}`}
          onClick={(e) => {
            e.stopPropagation()
            toggleOption(option.id)
          }}
        >
          <h3 className="text-base font-semibold">{option.name}</h3>
          {isRequired && (
            <span
              className={`text-xs text-white px-2 py-0.5 rounded ${validation.isValid && validation.status === "success" ? "bg-green-500" : "bg-red-500"}`}
            >
              {validation.isValid && validation.status === "success" ? "Selected" : "Required"}
            </span>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          {option.items.map((item) => {
            const isSelected = isItemSelected(option.id, item.id, optionType)
            const itemPrice = Number(item.price) || 0
            const originalItemPrice = hasDiscount ? itemPrice * (1 + Number(product.discount) / 100) : 0
            const itemQuantity = getCounterQuantity(option.id, item.id)
            const canDecrement = canDecrementCounter(option.id, item.id, option)

            if (optionType === "radio") {
              return (
                <div
                  key={item.id}
                  className={`flex items-center py-3 px-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200"
                      : showError
                        ? "bg-red-50/30 hover:bg-red-50/50"
                        : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleRadioSelect(option.id, item.id, item.price)}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                      isSelected ? "border-2" : showError ? "border-red-400" : "border-gray-300"
                    }`}
                    style={isSelected ? { borderColor: colors.button.bg } : {}}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.button.bg }}></div>
                    )}
                  </div>
                  <span className="ml-3 text-base font-medium">{item.name}</span>
                  {itemPrice > 0 && (
                    <span className="ml-auto text-sm font-medium text-gray-700">
                      {formatCurrency(itemPrice, currency)}
                    </span>
                  )}
                </div>
              )
            } else if (optionType === "checkbox") {
              return (
                <div
                  key={item.id}
                  className={`flex items-center py-3 px-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200"
                      : showError
                        ? "bg-red-50/30 hover:bg-red-50/50"
                        : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleCheckboxSelect(option.id, item.id, option)}
                >
                  <div
                    className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
                      isSelected ? "" : showError ? "border-red-400" : "border-gray-300"
                    }`}
                    style={isSelected ? { backgroundColor: colors.button.bg, borderColor: colors.button.bg } : {}}
                  >
                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="ml-3 text-base font-medium">{item.name}</span>
                  {itemPrice > 0 && (
                    <span className="ml-auto text-sm font-medium text-gray-700">
                      {formatCurrency(itemPrice, currency)}
                    </span>
                  )}
                </div>
              )
            } else if (optionType === "counter") {
              // Counter UI for counter options
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 rounded-md transition-all duration-200 ${
                    itemQuantity > 0
                      ? "bg-blue-50 border border-blue-200"
                      : showError
                        ? "bg-red-50/30 border border-red-200"
                        : "border border-transparent"
                  }`}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-base sm:text-lg font-medium truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center border rounded-md overflow-hidden">
                    <button
                      type="button"
                      className={`h-8 w-8 flex items-center justify-center border-r transition-colors ${
                        canDecrement
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          : "bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (canDecrement) {
                          handleCounterChange(option.id, item.id, itemQuantity - 1, option)
                        }
                      }}
                      disabled={!canDecrement}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span
                      className={`w-8 text-center text-sm font-medium transition-colors ${
                        isRequired && itemQuantity > 0 ? "text-green-600" : showError ? "text-red-600" : ""
                      }`}
                    >
                      {itemQuantity}
                    </span>
                    <button
                      type="button"
                      className={`h-8 w-8 flex items-center justify-center border-l transition-colors ${
                        isRequired &&
                        Number.parseInt(option.quantity) > 0 &&
                        Object.values(optionQuantities[option.id] || {}).reduce((sum, qty) => sum + qty, 0) >=
                          Number.parseInt(option.quantity)
                          ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                          : showError
                            ? "bg-red-100 hover:bg-red-200 text-red-700"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCounterChange(option.id, item.id, itemQuantity + 1, option)
                      }}
                      disabled={
                        isRequired &&
                        Number.parseInt(option.quantity) > 0 &&
                        Object.values(optionQuantities[option.id] || {}).reduce((sum, qty) => sum + qty, 0) >=
                          Number.parseInt(option.quantity)
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            }
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center font-poppins p-2 sm:p-4 overflow-hidden"
        style={{
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        {isLoading ? (
          <ProductOptionsModalSkeleton />
        ) : (
          <div
            ref={modalRef}
            className={`relative w-full max-w-5xl bg-white rounded-lg overflow-hidden shadow-xl flex flex-col md:flex-row transition-opacity duration-300 ${
              isClosing ? "opacity-0" : "opacity-100"
            }`}
            style={{
              backgroundColor: "white",
              color: "#333",
              borderRadius: "12px",
              maxHeight: "95vh",
              minHeight: "600px",
              height: "auto",
              transform: isClosing ? "scale(0.98)" : "scale(1)",
              transition: "opacity 300ms ease, transform 300ms ease",
            }}
          >
            {/* Close button - positioned absolutely */}
            <button
              className="absolute top-2 right-2 z-30 text-white bg-gray-800/50 hover:bg-gray-800/70 rounded-full p-1.5"
              onClick={handleCloseModal}
              disabled={isAddingToCart}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Product image - Left side */}
            <div className="relative md:w-1/2 w-full h-[250px] sm:h-[300px] md:h-auto overflow-hidden">
              {/* Loading placeholder */}
              <div className="absolute inset-0 bg-gray-100 animate-pulse"></div>

              {/* Actual product image */}
              <Image
                src={productImage || "/placeholder.svg?height=600&width=500"}
                alt={product.name}
                fill
                className={`object-cover z-10 transition-opacity duration-300 ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                priority
                onError={handleImageError}
                onLoad={handleImageLoad}
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={90}
                loading="eager"
              />

              {/* Product title overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{product.name}</h2>
              </div>
            </div>

            {/* Options panel - Right side */}
            <div className="md:w-1/2 w-full flex flex-col md:min-h-[600px] max-h-[calc(95vh-250px)] sm:max-h-[calc(95vh-300px)] md:max-h-full bg-gray-50">
              <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Required options section with heading */}
                {optionSections.required.length > 0 && (
                  <div className="mb-4 sm:mb-6">{optionSections.required.map(renderOptionSection)}</div>
                )}

                {/* Optional options section with heading */}
                {optionSections.optional.length > 0 && (
                  <div className="mb-4 sm:mb-6">{optionSections.optional.map(renderOptionSection)}</div>
                )}
              </div>

              {/* Footer with price and add to cart button */}
              <div className="p-4 border-t flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex items-center">
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md border border-gray-300"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1 || isItemLoading || isAddingToCart}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-10 text-center text-base font-medium">{quantity}</span>
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-md border border-gray-300"
                    onClick={incrementQuantity}
                    disabled={isItemLoading || isAddingToCart}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center">
                  <div className="mr-3 text-lg font-bold">{formatCurrency(totalPrice, currency)}</div>
                  {/* Update the button in the footer to use the local isAddingToCart state instead of isItemLoading */}
                  <button
                    className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md min-w-[120px] transition-all duration-300"
                    onClick={handleAddToCart}
                    style={{
                      backgroundColor: colors.button.bg,
                      color: colors.button.fontColor,
                      borderRadius: colors.button.radius,
                      opacity: isAddingToCart ? 0.7 : 1,
                    }}
                    disabled={isAddingToCart}
                  >
                    {isAddingToCart ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Add To Cart"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add branch selection modal */}
      <BranchSelectionModal
        isOpen={isBranchModalOpen}
        setIsOpen={setBranchModalOpen}
        onBranchSelected={() => {
          setBranchModalOpen(false)
          // Try adding to cart again after branch is selected
          const processedOptions = { ...selectedOptions }

          // Add quantity information for counter options
          Object.keys(optionQuantities).forEach((optionId) => {
            if (Object.keys(optionQuantities[optionId]).length > 0) {
              processedOptions[optionId] = optionQuantities[optionId]
            }
          })

          onAddToCart(product, processedOptions, quantity)
            .then(() => handleCloseModal())
            .catch((error) => {
              console.error("Error adding item after branch selection:", error)
              setIsAddingToCart(false)
            })
        }}
      />
    </>
  )
}

export default ProductOptionsModal
