import { v4 as uuidv4 } from "uuid"
import { getCookie, setCookie } from "./cookies"
import type { CartItem } from "../context/cart-context"

// Get the unique order ID from cookies or localStorage
export function getUniqueOrderId(): string | null {
  // First check if we have it in a cookie
  const orderId = getCookie("unique_order_id") || getCookie("temp_order_id")

  // If found in cookie, return it
  if (orderId) {
    return orderId
  }

  // If not in cookie, check localStorage (only in browser environment)
  if (typeof window !== "undefined") {
    const localStorageId = localStorage.getItem("unique_order_id") || localStorage.getItem("temp_order_id")
    if (localStorageId) {
      // Also set it as a cookie for easier access
      setCookie("unique_order_id", localStorageId)
      return localStorageId
    }
  }

  // If not found anywhere, return null
  return null
}

// Format current date for API
export function getCurrentDate(): string {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Transform cart items to API format
export function transformCartItemsForApi(items: CartItem[]): any[] {
  return items.map((item) => {
    // Extract category ID from the product
    const categoryId = item.categoryId || "0"

    // Format options for API - updated to match expected format
    const formattedOptions: Record<string, any[]> = {}

    if (item.options && item.options.length > 0) {
      // Group options by optionName
      item.options.forEach((option) => {
        // Create option group if it doesn't exist
        if (!formattedOptions[option.optionName]) {
          formattedOptions[option.optionName] = []
        }

        // Check if this item already exists in the group
        const existingItem = formattedOptions[option.optionName].find((item) => item.name === option.itemName)

        if (existingItem) {
          // If item exists, increment quantity
          existingItem.quantity += option.quantity || 1
        } else {
          // Add new item to the group
          formattedOptions[option.optionName].push({
            name: option.itemName,
            price: option.itemPrice || "0",
            quantity: option.quantity || 1,
            inner_options: [],
          })
        }
      })
    }

    // Match the exact format from the network call
    return {
      id: item.id,
      image: item.image,
      name: item.name,
      price: item.price, // Already a string from the cart
      slug: "",
      qty: item.quantity,
      discount: item.discount || "0",
      item_level_discount_value: "0",
      tax: "0",
      item_level_tax_value: "0",
      weight_value: "1.0",
      calculated_weight: "1",
      weight_unit: "kg",
      comment: "",
      category_id: categoryId,
      brand_id: "176", // Default brand ID
      product_code: "0",
      category_name: item.categoryName || "Unknown",
      options: formattedOptions,
    }
  })
}

// Transform a single cart item to API format
export function transformSingleItemForApi(item: CartItem): any {
  // Extract category ID from the product
  const categoryId = item.categoryId || "0"

  // Format options for API - updated to match expected format
  const formattedOptions: Record<string, any[]> = {}

  if (item.options && item.options.length > 0) {
    // Group options by optionName
    item.options.forEach((option) => {
      // Create option group if it doesn't exist
      if (!formattedOptions[option.optionName]) {
        formattedOptions[option.optionName] = []
      }

      // Check if this item already exists in the group
      const existingItem = formattedOptions[option.optionName].find((item) => item.name === option.itemName)

      if (existingItem) {
        // If item exists, increment quantity
        existingItem.quantity += option.quantity || 1
      } else {
        // Add new item to the group
        formattedOptions[option.optionName].push({
          name: option.itemName,
          price: option.itemPrice || "0",
          quantity: option.quantity || 1,
          inner_options: [],
        })
      }
    })
  }

  // Ensure menu_item_id is properly formatted as a string
  const productId = item.id ? item.id.toString() : "0"

  // Match the exact format from the network call
  return {
    id: productId,
    menu_item_id: productId, // Explicitly include menu_item_id
    image: item.image,
    name: item.name,
    price: item.price, // Already a string from the cart
    slug: "",
    qty: item.quantity,
    discount: item.discount || "0",
    item_level_discount_value: "0",
    tax: "0",
    item_level_tax_value: "0",
    weight_value: "1.0",
    calculated_weight: "1",
    weight_unit: "kg",
    comment: "",
    category_id: categoryId,
    brand_id: "176", // Default brand ID
    product_code: "0",
    category_name: item.categoryName || "Unknown",
    options: formattedOptions,
  }
}

// Get cart from API
export async function getCartApi(): Promise<any> {
  try {
    // Get the unique order ID
    const orderId = getUniqueOrderId()

    // If no order ID exists, return null
    if (!orderId) {
      console.log("No unique order ID found, cannot fetch cart")
      return null
    }

    const wresId = getCookie("wres_id") || "18"

    console.log(`Fetching cart for wres_id: ${wresId}, order_id: ${orderId}`)

    // Make the API request
    const response = await fetch(
      `https://td0c8x9qb3.execute-api.us-east-1.amazonaws.com/prod/v1/business/${wresId}/cart/${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Cart API response:", data)

    return data
  } catch (error) {
    console.error("Error fetching cart:", error)
    throw error
  }
}

// Update the addToCartApi function to only send one item at a time
// Around line 100-150:

export async function addToCartApi(item: CartItem, action = "add"): Promise<any> {
  try {
    // Get required parameters
    const orderType = getCookie("order_type") || "pickup"
    const branchId = getCookie("branch_id") || "18"
    const wresId = getCookie("wres_id") || "18"

    // Get or create unique order ID
    let uniqueOrderId = getUniqueOrderId()

    // If no order ID exists, create one
    if (!uniqueOrderId) {
      uniqueOrderId = uuidv4().replace(/-/g, "")

      // Save to both cookie and localStorage
      setCookie("unique_order_id", uniqueOrderId)
      if (typeof window !== "undefined") {
        localStorage.setItem("unique_order_id", uniqueOrderId)
      }
    }

    // Ensure item has a valid menu_item_id
    const transformedItem = transformSingleItemForApi(item)

    // Log the payload for debugging
    console.log(`Item being sent to cart API:`, JSON.stringify(transformedItem, null, 2))

    const payload: any = {
      action: action,
      current_date: getCurrentDate(),
      unique_order_id: uniqueOrderId,
      order_type: orderType,
      business_id: wresId,
      branch_id: branchId,
      items: [transformedItem],
    }

    console.log(`Sending cart payload with action: ${action}`, JSON.stringify(payload, null, 2))

    const response = await fetch(
      `https://td0c8x9qb3.execute-api.us-east-1.amazonaws.com/prod/v1/business/${wresId}/cart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    )

    const data = await response.json()
    console.log(`Cart API response for ${action}:`, data)

    if (data.status !== 200) {
      throw new Error(data.message || "API error")
    }

    // Store the temp_order_id if available
    if (data.result && data.result.temp_order_id) {
      setCookie("temp_order_id", data.result.temp_order_id)
      if (typeof window !== "undefined") {
        localStorage.setItem("temp_order_id", data.result.temp_order_id)
      }
    }

    return data
  } catch (error) {
    console.error(`Error in cart operation (${action}):`, error)
    throw error
  }
}

// Update the helper functions to use the new API function signature
export async function deleteFromCartApi(item: CartItem): Promise<any> {
  return addToCartApi(item, "delete")
}

export async function subtractFromCartApi(item: CartItem): Promise<any> {
  return addToCartApi(item, "sub")
}

// Clear cart API
export async function clearCartApi(): Promise<any> {
  try {
    // Get the unique order ID
    const orderId = getUniqueOrderId()

    // If no order ID exists, return error
    if (!orderId) {
      throw new Error("No unique order ID found, cannot clear cart")
    }

    const wresId = getCookie("wres_id") || "18"

    const payload = {
      action: "clear",
      unique_order_id: orderId,
      business_id: wresId,
    }

    const response = await fetch(
      `https://td0c8x9qb3.execute-api.us-east-1.amazonaws.com/prod/v1/business/${wresId}/cart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    )

    const data = await response.json()
    console.log("Clear cart API response:", data)

    if (data.status !== 200) {
      throw new Error(data.message || "API error")
    }

    return data
  } catch (error) {
    console.error("Error clearing cart:", error)
    throw error
  }
}
