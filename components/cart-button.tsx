"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "../context/cart-context"
import { useThemeColors } from "../context/theme-context"

export function CartButton() {
  const { setIsCartOpen, totalItems, hasOrderId } = useCart()
  const { colors } = useThemeColors()

  // If we don't have an order ID, don't render the cart button
  if (!hasOrderId) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => setIsCartOpen(true)}
      style={{ color: colors.header.fontColor }}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span
          className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          style={{ backgroundColor: colors.button.bg }}
        >
          {totalItems}
        </span>
      )}
    </Button>
  )
}
