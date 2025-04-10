"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Product } from "../types/product"
// Import the API functions
import {
  addToCartApi,
  deleteFromCartApi,
  subtractFromCartApi,
  getCartApi,
  clearCartApi,
  getUniqueOrderId,
} from "../utils/api"
import { getCookie, setCookie } from "../utils/cookies"

// Update the CartItem interface to include category information
export interface CartItem {
  id: string
  name: string
  price: string
  image: string
  quantity: number
  originalPrice?: string
  discount?: string
  options?: {
    optionId: string
    optionName: string
    itemId: string
    itemName: string
    itemPrice: string
    quantity?: number // Add quantity for counter options
  }[]
  uniqueId?: string // Unique identifier for items with different options
  categoryId?: string // Add category ID
  categoryName?: string // Add category name
}

// Update the CartContextType to include API-related states
interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, selectedOptions?: Record<string, string>, quantity?: number) => Promise<any>
  removeItem: (uniqueId: string) => void
  updateQuantity: (uniqueId: string, quantity: number) => void
  clearCart: () => void
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
  totalItems: number
  subtotal: number
  currency: string
  getItemQuantity: (productId: string, selectedOptions?: Record<string, string>) => number
  isCartNotificationVisible: boolean
  cartNotificationMessage: string
  showCartNotification: (message: string) => void
  hideCartNotification: () => void
  isLoading: boolean
  isItemLoading: (productId: string, selectedOptions?: Record<string, any>) => boolean
  resetAllLoadingStates: () => void
  error: string | null
  hasOrderId: boolean // Add this to track if we have an order ID
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children, currency = "PKR" }: { children: ReactNode; currency?: string }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [isCartNotificationVisible, setIsCartNotificationVisible] = useState(false)
  const [cartNotificationMessage, setCartNotificationMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false) // Keep global loading state for cart operations
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({}) // Track loading state per item
  const [error, setError] = useState<string | null>(null) // Add error state
  const [hasOrderId, setHasOrderId] = useState(false) // Track if we have an order ID

  // Check if we have a unique order ID on initial render
  useEffect(() => {
    const orderId = getUniqueOrderId()
    setHasOrderId(!!orderId)
  }, [])

  // Load cart from API on initial render
  useEffect(() => {
    const loadCart = async () => {
      // Check if we have a unique order ID
      const orderId = getUniqueOrderId()

      // If no order ID, don't try to load the cart
      if (!orderId) {
        console.log("No unique order ID found, skipping cart load")
        return
      }

      setIsLoading(true)
      setError(null)
      resetAllLoadingStates() // Reset all loading states when loading the cart

      try {
        // Try to get cart from API
        const apiCart = await getCartApi()

        if (apiCart && apiCart.status === 200 && apiCart.result) {
          // Store the temp_order_id if available
          if (apiCart.result.temp_order_id) {
            setCookie("temp_order_id", apiCart.result.temp_order_id)
            if (typeof window !== "undefined") {
              localStorage.setItem("temp_order_id", apiCart.result.temp_order_id)
            }
          }

          // Check if there are items in the cart
          if (apiCart.result.items && apiCart.result.items.length > 0) {
            // Transform API items to our format
            const transformedItems = apiCart.result.items.map((item: any) => {
              // Process options - parse the option_set JSON string
              const options = []
              if (item.option_set) {
                try {
                  const optionSet = typeof item.option_set === "string" ? JSON.parse(item.option_set) : item.option_set

                  // Iterate through each option group
                  Object.entries(optionSet).forEach(([optionName, selections]: [string, any]) => {
                    if (Array.isArray(selections)) {
                      selections.forEach((selection: any) => {
                        options.push({
                          optionId: optionName, // Use the option name as ID since we don't have a real ID
                          optionName: optionName,
                          itemId: selection.name, // Use the name as ID since we don't have a real ID
                          itemName: selection.name,
                          itemPrice: selection.price || "0",
                          quantity: selection.quantity || 1,
                        })
                      })
                    }
                  })
                } catch (e) {
                  console.error("Error parsing option_set:", e, item.option_set)
                }
              }

              // Generate a unique ID for this item
              const uniqueId = `${item.menu_item_id}_${item.odetailid}`

              return {
                id: item.menu_item_id?.toString() || "",
                name: item.dname || "",
                price: item.dprice?.toString() || "0",
                image: "", // API doesn't provide image, will need to be handled
                quantity: item.dqty || 1,
                discount: item.discount?.toString() || "0",
                categoryId: item.category_id?.toString() || "",
                categoryName: item.category_name || "",
                options,
                uniqueId,
              }
            })

            setItems(transformedItems)
            setHasOrderId(true)
          } else {
            // Empty cart
            setItems([])
          }
        } else {
          // Fallback to localStorage
          const savedCart = localStorage.getItem("cart")
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart)
              setItems(parsedCart)
            } catch (error) {
              console.error("Failed to parse cart from localStorage:", error)
            }
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error)
        setError("Failed to load cart. Using local storage instead.")

        // Fallback to localStorage
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart)
            setItems(parsedCart)
          } catch (error) {
            console.error("Failed to parse cart from localStorage:", error)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCart()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))

    // Calculate total items and subtotal
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    setTotalItems(itemCount)

    // Calculate subtotal from items
    const total = items.reduce((sum, item) => sum + Number.parseFloat(item.price) * item.quantity, 0)
    setSubtotal(total)
  }, [items])

  // Generate a unique ID for cart items with options
  const generateUniqueId = (productId: string, selectedOptions: Record<string, any> = {}) => {
    if (Object.keys(selectedOptions).length === 0) {
      return productId
    }

    // Create a consistent string representation of the options
    const optionsString = Object.entries(selectedOptions)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([optionId, selection]) => {
        // Handle different selection types
        if (typeof selection === "string") {
          // Radio button selection
          return `${optionId}:${selection}`
        } else if (Array.isArray(selection)) {
          // Checkbox selection
          return `${optionId}:[${selection.sort().join(",")}]`
        } else if (typeof selection === "object") {
          // Counter selection with quantities
          const items = Object.entries(selection)
            .filter(([_, qty]) => (qty as number) > 0)
            .sort(([idA], [idB]) => idA.localeCompare(idB))
            .map(([itemId, qty]) => `${itemId}:${qty}`)
            .join(",")
          return `${optionId}:{${items}}`
        }
        return ""
      })
      .filter(Boolean)
      .join("|")

    return `${productId}_${optionsString}`
  }

  // Process selected options into a format for the cart
  const processOptions = (product: Product, selectedOptions: Record<string, any> = {}) => {
    if (!product.options || Object.keys(selectedOptions).length === 0) return []

    const result: CartItem["options"] = []

    product.options.forEach((option) => {
      const selection = selectedOptions[option.id]

      if (!selection) return

      // Handle radio button selection (single string)
      if (typeof selection === "string") {
        const item = option.items.find((i) => i.id === selection)
        if (item) {
          result.push({
            optionId: option.id,
            optionName: option.name,
            itemId: item.id,
            itemName: item.name,
            itemPrice: item.price,
          })
        }
      }
      // Handle checkbox selection (array of strings)
      else if (Array.isArray(selection)) {
        selection.forEach((itemId) => {
          const item = option.items.find((i) => i.id === itemId)
          if (item) {
            result.push({
              optionId: option.id,
              optionName: option.name,
              itemId: item.id,
              itemName: item.name,
              itemPrice: item.price,
            })
          }
        })
      }
      // Handle counter selection (object with quantities)
      else if (typeof selection === "object") {
        Object.entries(selection).forEach(([itemId, quantity]) => {
          if ((quantity as number) > 0) {
            const item = option.items.find((i) => i.id === itemId)
            if (item) {
              result.push({
                optionId: option.id,
                optionName: option.name,
                itemId: item.id,
                itemName: item.name,
                itemPrice: item.price,
                quantity: quantity as number,
              })
            }
          }
        })
      }
    })

    return result
  }

  // Calculate the total price including options
  const calculateTotalPrice = (basePrice: string, options: CartItem["options"] = []) => {
    const optionsTotal = options.reduce((sum, option) => {
      const itemPrice = Number.parseFloat(option.itemPrice || "0")
      const quantity = option.quantity || 1
      return sum + itemPrice * quantity
    }, 0)

    return (Number.parseFloat(basePrice) + optionsTotal).toFixed(2)
  }

  const showCartNotification = (message: string) => {
    // If a notification is already visible, hide it first
    if (isCartNotificationVisible) {
      setIsCartNotificationVisible(false)

      // Small delay before showing the new notification
      setTimeout(() => {
        setCartNotificationMessage(message)
        setIsCartNotificationVisible(true)
      }, 300)
    } else {
      // Show notification immediately if none is visible
      setCartNotificationMessage(message)
      setIsCartNotificationVisible(true)
    }
  }

  const hideCartNotification = () => {
    setIsCartNotificationVisible(false)
  }

  // Update the addItem function to send only one item at a time
  const addItem = async (product: Product, selectedOptions: Record<string, any> = {}, quantity = 1) => {
    // Check if branch_id is set in cookie
    const branchId = getCookie("branch_id")
    const orderType = getCookie("order_type")

    // If branch_id or order_type is not set, we need to show the branch selection modal first
    if (!branchId || !orderType) {
      // Return a special error that will be handled by the UI components
      return Promise.reject({ code: "BRANCH_SELECTION_REQUIRED" })
    }

    // Set loading state for this specific item
    const uniqueId = generateUniqueId(product.menu_item_id, selectedOptions)
    setLoadingItems((prev) => ({
      ...prev,
      [uniqueId]: true,
    }))

    try {
      const processedOptions = processOptions(product, selectedOptions)
      const totalPrice = calculateTotalPrice(product.price, processedOptions)

      // Check if item with same options already exists in cart
      const existingItemIndex = items.findIndex((item) => item.uniqueId === uniqueId)
      let updatedItems: CartItem[]
      let itemToAdd: CartItem

      if (existingItemIndex >= 0) {
        // Item exists, increment quantity
        updatedItems = [...items]
        updatedItems[existingItemIndex].quantity += quantity
        itemToAdd = updatedItems[existingItemIndex]
      } else {
        // Item doesn't exist, add new item
        itemToAdd = {
          id: product.menu_item_id,
          name: product.name,
          price: totalPrice,
          image: product.image,
          quantity: quantity,
          originalPrice: product.originalPrice,
          discount: product.discount,
          options: processedOptions,
          uniqueId,
          categoryId: product.menu_cat_id,
          categoryName: product.category,
        }

        updatedItems = [...items, itemToAdd]
      }

      // Optimistic update - update the UI immediately
      setItems(updatedItems)

      // Update hasOrderId state since we now have an order ID
      setHasOrderId(true)

      // Then update the API in the background with just the single item
      const apiResponse = await addToCartApi(itemToAdd)

      // Verify the API response
      if (apiResponse.status !== 200) {
        throw new Error(apiResponse.message || "Failed to add item to cart")
      }

      // Show explicit "Item added to cart" notification after API response
      const successMessage = "Item added to cart"
      showCartNotification(successMessage)

      // Return the successful response
      return apiResponse
    } catch (error: any) {
      console.error("Error adding item to cart:", error)

      // Extract error message from API response if available
      let errorMessage = "Failed to add item to cart. Please try again."
      if (error.message && typeof error.message === "string") {
        errorMessage = error.message
      }

      setError(errorMessage)

      // Show error notification
      showCartNotification(errorMessage)

      // Re-throw the error so the component can handle it
      throw error
    } finally {
      // Clear loading state for this specific item
      setLoadingItems((prev) => ({
        ...prev,
        [uniqueId]: false,
      }))
      setIsLoading(false)
    }
  }

  // Update the removeItem function to send only the specific item
  const removeItem = async (uniqueId: string) => {
    // Store the current items for potential rollback
    const previousItems = [...items]

    // Set loading state for this specific item
    setLoadingItems((prev) => ({
      ...prev,
      [uniqueId]: true,
    }))

    try {
      // Find the item to remove
      const itemToRemove = items.find((item) => item.uniqueId === uniqueId)
      if (!itemToRemove) {
        throw new Error("Item not found")
      }

      // Update local state first (optimistic update)
      const updatedItems = items.filter((item) => item.uniqueId !== uniqueId)
      setItems(updatedItems)

      // Then update the API using the delete action with the specific item
      const apiResponse = await deleteFromCartApi(itemToRemove)

      // Verify the API response
      if (apiResponse.status !== 200) {
        throw new Error(apiResponse.message || "Failed to remove item from cart")
      }

      // Show success notification ONLY after API response
      const successMessage = apiResponse.message || "Item removed from cart."
      showCartNotification(successMessage)
    } catch (error: any) {
      console.error("Error removing item from cart:", error)

      // Extract error message from API response if available
      let errorMessage = "Failed to remove item from cart. Please try again."
      if (error.message && typeof error.message === "string") {
        errorMessage = error.message
      }

      setError(errorMessage)

      // Show error notification
      showCartNotification(errorMessage)

      // Rollback to previous state
      setItems(previousItems)
    } finally {
      // Clear loading state for this specific item
      setLoadingItems((prev) => ({
        ...prev,
        [uniqueId]: false,
      }))
      setIsLoading(false)
    }
  }

  // Update the updateQuantity function to send only the specific item
  const updateQuantity = async (uniqueId: string, quantity: number) => {
    // Store the current items for potential rollback
    const previousItems = [...items]

    // Set loading state for this specific item
    setLoadingItems((prev) => ({
      ...prev,
      [uniqueId]: true,
    }))

    try {
      // Find the item to update
      const itemIndex = items.findIndex((item) => item.uniqueId === uniqueId)
      if (itemIndex === -1) {
        throw new Error("Item not found")
      }

      const item = items[itemIndex]
      const currentQuantity = item.quantity

      let updatedItems: CartItem[]
      let apiResponse

      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        updatedItems = items.filter((item) => item.uniqueId !== uniqueId)

        // Optimistic update - update the UI immediately
        setItems(updatedItems)

        // Use delete action for complete removal with the specific item
        apiResponse = await deleteFromCartApi(item)

        if (apiResponse.status !== 200) {
          throw new Error(apiResponse.message || "Failed to remove item")
        }

        // Show success notification ONLY after API response
        const successMessage = apiResponse.message || "Item removed from cart."
        showCartNotification(successMessage)
      } else if (quantity < currentQuantity) {
        // Decreasing quantity by 1
        const updatedItem = { ...item, quantity }
        updatedItems = [...items]
        updatedItems[itemIndex] = updatedItem

        // Optimistic update - update the UI immediately
        setItems(updatedItems)

        // Use sub action for decreasing quantity with the specific item
        apiResponse = await subtractFromCartApi(updatedItem)

        if (apiResponse.status !== 200) {
          throw new Error(apiResponse.message || "Failed to update quantity")
        }

        // Show success notification ONLY after API response
        const successMessage = apiResponse.message || "Item quantity updated."
        showCartNotification(successMessage)
      } else {
        // Increasing quantity
        const updatedItem = { ...item, quantity }
        updatedItems = [...items]
        updatedItems[itemIndex] = updatedItem

        // Optimistic update - update the UI immediately
        setItems(updatedItems)

        // Use add action for increasing quantity with the specific item
        apiResponse = await addToCartApi(updatedItem)

        if (apiResponse.status !== 200) {
          throw new Error(apiResponse.message || "Failed to update quantity")
        }

        // Show explicit success message when increasing quantity
        const successMessage = "Item added to cart"
        showCartNotification(successMessage)
      }
    } catch (error: any) {
      console.error("Error updating item quantity:", error)

      // Extract error message from API response if available
      let errorMessage = "Failed to update item quantity. Please try again."
      if (error.message && typeof error.message === "string") {
        errorMessage = error.message
      }

      setError(errorMessage)

      // Show error notification
      showCartNotification(errorMessage)

      // Rollback to previous state
      setItems(previousItems)
    } finally {
      // Clear loading state for this specific item
      setLoadingItems((prev) => ({
        ...prev,
        [uniqueId]: false,
      }))
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    // Store the current items for potential rollback
    const previousItems = [...items]
    setIsLoading(true)

    try {
      // Optimistic update - clear the cart immediately
      setItems([])

      // Then clear the API cart in the background
      const apiResponse = await clearCartApi()

      // Verify the API response
      if (apiResponse.status !== 200) {
        throw new Error(apiResponse.message || "Failed to clear cart")
      }

      // Show success notification ONLY after API response
      const successMessage = apiResponse.message || "Cart cleared successfully."
      showCartNotification(successMessage)
    } catch (error: any) {
      console.error("Error clearing cart:", error)

      // Extract error message from API response if available
      let errorMessage = "Failed to clear cart. Please try again."
      if (error.message && typeof error.message === "string") {
        errorMessage = error.message
      }

      setError(errorMessage)

      // Show error notification
      showCartNotification(errorMessage)

      // Rollback to previous state
      setItems(previousItems)
    } finally {
      setIsLoading(false)
    }
  }

  const getItemQuantity = (productId: string, selectedOptions: Record<string, any> = {}) => {
    const uniqueId = generateUniqueId(productId, selectedOptions)
    const item = items.find((item) => item.uniqueId === uniqueId)
    return item ? item.quantity : 0
  }

  const isItemLoading = (productId: string, selectedOptions: Record<string, any> = {}) => {
    const uniqueId = generateUniqueId(productId, selectedOptions)
    return !!loadingItems[uniqueId]
  }

  const resetAllLoadingStates = () => {
    // Only update state if there are actually loading items to clear
    if (Object.keys(loadingItems).length > 0) {
      setLoadingItems({})
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotal,
        currency,
        getItemQuantity,
        isCartNotificationVisible,
        cartNotificationMessage,
        showCartNotification,
        hideCartNotification,
        isLoading,
        isItemLoading,
        resetAllLoadingStates,
        error,
        hasOrderId,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
