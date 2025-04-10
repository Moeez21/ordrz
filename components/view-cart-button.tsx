"use client"
import { useCart } from "../context/cart-context"
import { useThemeColors } from "../context/theme-context"
import { formatCurrency } from "../utils/format"
// Import useOrderPreferences
import { useOrderPreferences } from "../context/order-preferences-context"

export function ViewCartButton() {
  const { totalItems, subtotal, currency, setIsCartOpen, items, isLoading, hasOrderId } = useCart()
  const { colors } = useThemeColors()
  const { selectedBranch } = useOrderPreferences() // Add this line

  // Add minimum spend check
  const minimumSpend = selectedBranch?.minimumSpend || 0
  const isMinimumSpendMet = subtotal >= minimumSpend

  // Don't show the button if cart is empty, if an API operation is in progress, or if we don't have an order ID
  if (totalItems === 0 || isLoading || !hasOrderId) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-4">
      <div className="px-4 w-full max-w-[400px]">
        <div
          onClick={() => setIsCartOpen(true)}
          className="w-full flex items-center justify-between py-3 px-4 rounded-full shadow-lg mb-0 cursor-pointer"
          style={{
            backgroundColor: colors.button.bg,
            color: colors.button.fontColor,
            borderRadius: colors.button.radius,
          }}
        >
          <div className="flex items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              <span className="text-sm font-medium">{totalItems}</span>
            </div>
            <span className="text-base font-medium">View Cart</span>

            {/* Add minimum spend indicator */}
            {minimumSpend > 0 && !isMinimumSpendMet && (
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                Min: {formatCurrency(minimumSpend, currency)}
              </span>
            )}
          </div>

          <div className="flex items-center">
            <span className="text-base font-medium">{formatCurrency(subtotal, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
