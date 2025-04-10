"use client"

import { CartNotification } from "./cart-notification"
import { useCart } from "../context/cart-context"

export function CartNotificationWrapper() {
  const { isCartNotificationVisible, hideCartNotification, cartNotificationMessage, hasOrderId } = useCart()

  // If we don't have an order ID, don't render the notification
  if (!hasOrderId) {
    return null
  }

  return (
    <CartNotification
      message={cartNotificationMessage}
      isVisible={isCartNotificationVisible}
      onClose={hideCartNotification}
    />
  )
}
