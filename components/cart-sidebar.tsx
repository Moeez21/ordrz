"use client"

import { ShoppingBag, Plus, Minus, Trash2, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useCart, type CartItem } from "../context/cart-context"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "../utils/format"
import { useThemeColors } from "../context/theme-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
// Import the DirectCheckoutLink component
import { DirectCheckoutLink } from "./direct-checkout-link"
// Import useOrderPreferences
import { useOrderPreferences } from "../context/order-preferences-context"

function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
  currency,
  isLoading,
}: {
  item: CartItem
  onRemove: () => void
  onUpdateQuantity: (quantity: number) => void
  currency: string
  isLoading: boolean
}) {
  const hasDiscount = item.discount && Number.parseFloat(item.discount) > 0
  const { colors } = useThemeColors()
  const [imageError, setImageError] = useState(false)

  return (
    <div className="flex gap-2 py-2 border-b">
      <div className="relative h-[70px] w-[70px] flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
        {item.image && !imageError ? (
          <Image
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            fill
            className="object-cover"
            sizes="70px"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-200">
            <ShoppingBag className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <h4 className="font-medium text-sm truncate">{item.name}</h4>

        {/* Show selected options if any */}
        {item.options && item.options.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {/* Group options by optionName */}
            {Object.entries(
              item.options.reduce(
                (groups, option) => {
                  if (!groups[option.optionName]) {
                    groups[option.optionName] = []
                  }
                  groups[option.optionName].push(option)
                  return groups
                },
                {} as Record<string, typeof item.options>,
              ),
            ).map(([optionName, options], groupIndex) => (
              <div key={groupIndex} className="text-xs">
                <span className="text-gray-500">{optionName}:</span>
                <div className="pl-1">
                  {options.map((option, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-500 text-[10px]">
                        {option.itemName}
                        {option.quantity && option.quantity > 1 ? ` (x${option.quantity})` : ""}
                      </span>
                      {Number(option.itemPrice) > 0 && (
                        <span className="text-[10px]" style={{ color: colors.button.bg }}>
                          +{formatCurrency(Number(option.itemPrice) * (option.quantity || 1), currency)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center mt-0.5">
          <span className="text-sm font-medium" style={{ color: colors.button.bg }}>
            {formatCurrency(Number.parseFloat(item.price), currency)}
          </span>
          {hasDiscount && item.originalPrice && (
            <span className="text-xs text-muted-foreground line-through ml-2">
              {formatCurrency(Number.parseFloat(item.originalPrice), currency)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-none"
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              disabled={isLoading}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-xs">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-none"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              disabled={isLoading}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Update the CartSidebar function to include minimum spend check
export function CartSidebar() {
  const { items, removeItem, updateQuantity, clearCart, isCartOpen, setIsCartOpen, subtotal, currency, isLoading } =
    useCart()
  const { colors } = useThemeColors()
  const router = useRouter()
  const { selectedBranch, orderType } = useOrderPreferences() // Add this line to get selected branch

  // Add minimum spend check
  const minimumSpend = selectedBranch?.minimumSpend || 0
  const isMinimumSpendMet = subtotal >= minimumSpend
  const amountNeededToReachMinimum = minimumSpend - subtotal

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent
        className="w-full sm:max-w-sm flex flex-col p-0"
        style={{
          backgroundColor: colors.body.bg,
          color: colors.body.fontColor,
        }}
      >
        <SheetHeader className="px-4 py-3 border-b" style={{ backgroundColor: colors.header.bg }}>
          <div className="flex items-center justify-between">
            <SheetTitle
              className="text-base font-medium flex items-center gap-2"
              style={{ color: colors.header.fontColor }}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Your Cart</span>
              {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
            </SheetTitle>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="h3 mb-1">Your cart is empty</h3>
            <p className="body-sm text-muted-foreground">Add items to your cart to see them here.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto py-2">
            <div className="flex flex-col gap-4 px-4">
              {items.map((item) => (
                <CartItemCard
                  key={item.uniqueId}
                  item={item}
                  onRemove={() => removeItem(item.uniqueId!)}
                  onUpdateQuantity={(quantity) => updateQuantity(item.uniqueId!, quantity)}
                  currency={currency}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="border-t">
            <div className="px-4 py-3">
              <div className="flex justify-between body-sm mb-1">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between body-sm mb-1">
                <span>Tax</span>
                <span>{formatCurrency(subtotal * 0.05, currency)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(subtotal + subtotal * 0.05, currency)}</span>
              </div>

              {/* Add minimum spend warning if applicable */}
              {minimumSpend > 0 && !isMinimumSpendMet && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                  <p className="font-medium">Minimum order amount not met</p>
                  <p>Add {formatCurrency(amountNeededToReachMinimum, currency)} more to proceed to checkout.</p>
                </div>
              )}
            </div>

            <SheetFooter className="px-4 py-3">
              <Button
                className="w-full font-medium text-sm h-9"
                disabled={isLoading || !isMinimumSpendMet}
                style={{
                  backgroundColor: colors.button.bg,
                  color: colors.button.fontColor,
                  borderRadius: colors.button.radius,
                  opacity: !isMinimumSpendMet ? 0.5 : 1,
                }}
                onClick={() => {
                  setIsCartOpen(false)
                  router.push("/checkout")
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Processing...
                  </>
                ) : !isMinimumSpendMet ? (
                  `Add ${formatCurrency(amountNeededToReachMinimum, currency)} more to checkout`
                ) : (
                  "Checkout"
                )}
              </Button>

              {/* Add fallback direct checkout link */}
              <div className="mt-2">
                <DirectCheckoutLink isMinimumSpendMet={isMinimumSpendMet} />
              </div>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
