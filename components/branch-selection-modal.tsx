"use client"

import { useState, useEffect } from "react"
import { X, Target, ChevronDown } from "lucide-react"
import { useThemeColors } from "../context/theme-context"
import { useOrderPreferences } from "../context/order-preferences-context"
import { useBranchesData } from "../context/api-context"
import { useCart } from "../context/cart-context"
import { getCookie } from "../utils/cookies"
import { formatCurrency } from "../utils/currency-format"

interface BranchSelectionModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onBranchSelected?: () => void // Optional callback for when branch is selected
}

export function BranchSelectionModal({ isOpen, setIsOpen, onBranchSelected }: BranchSelectionModalProps) {
  const { colors } = useThemeColors()
  const { orderType, selectedBranch, setOrderType, setSelectedBranch, handleStartOrder } = useOrderPreferences()
  const { branches, isLoading } = useBranchesData()
  const { clearCart, items } = useCart()
  const [showDropdown, setShowDropdown] = useState(false)

  // Check if any branches support delivery
  const hasDeliveryOption = () => {
    return branches.some((branch) => branch.delivery === 1)
  }

  // Check if any branches support pickup
  const hasPickupOption = () => {
    return branches.some((branch) => branch.pickup === 1)
  }

  // Set default order type based on available options
  useEffect(() => {
    if (!orderType) {
      if (hasDeliveryOption()) {
        setOrderType("delivery")
      } else if (hasPickupOption()) {
        setOrderType("pickup")
      }
    }
  }, [branches, orderType, setOrderType])

  // Filter branches based on selected order type
  const getFilteredBranchesByType = () => {
    if (!branches.length) return []

    // Return all branches instead of filtering by order type
    return branches
  }

  // Set default branch to first compatible branch if not already set
  useEffect(() => {
    if (!selectedBranch && branches.length > 0) {
      const compatibleBranches = branches.filter((branch) =>
        orderType === "delivery" ? branch.delivery === 1 : branch.pickup === 1,
      )

      if (compatibleBranches.length > 0) {
        setSelectedBranch(compatibleBranches[0])
      }
    }
  }, [selectedBranch, branches, orderType, setSelectedBranch])

  // Update the formatBranchName function to include minimum spend
  const formatBranchName = (branch: any) => {
    if (!branch) return "Select a branch"

    let branchName = `${branch.address} ${branch.location} ${branch.city}`

    // Add minimum spend information if available
    if (branch.minimumSpend && branch.minimumSpend > 0) {
      branchName += ` (Min. order: ${formatCurrency(branch.minimumSpend, "PKR")})`
    }

    return branchName
  }

  // Modified to support the callback and clear cart when branch changes
  const handleStartOrderWithCallback = () => {
    // Check if the branch is actually changing
    const currentBranchId = getCookie("branch_id")
    const isBranchChanging = currentBranchId && selectedBranch && currentBranchId !== selectedBranch.id.toString()

    // If there's a branch change and we have items in the cart, clear the cart
    if (isBranchChanging && items.length > 0) {
      clearCart()
    }

    // Continue with the original function
    handleStartOrder(setIsOpen)

    // Call the callback if provided
    if (onBranchSelected) {
      onBranchSelected()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center font-poppins"
      style={{
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-visible"
        style={{
          maxWidth: "500px",
          backgroundColor: colors.body.bg,
          color: colors.body.fontColor,
        }}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 z-10 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Order type tabs */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="inline-flex rounded-md border overflow-hidden">
            <button
              className={`px-8 py-2 text-center text-sm font-medium transition-colors`}
              style={{
                backgroundColor: orderType === "delivery" ? colors.button.bg : "transparent",
                color: orderType === "delivery" ? colors.button.fontColor : colors.body.fontColor,
              }}
              onClick={() => setOrderType("delivery")}
            >
              Delivery
            </button>
            <button
              className={`px-8 py-2 text-center text-sm font-medium transition-colors`}
              style={{
                backgroundColor: orderType === "pickup" ? colors.button.bg : "transparent",
                color: orderType === "pickup" ? colors.button.fontColor : colors.body.fontColor,
              }}
              onClick={() => setOrderType("pickup")}
            >
              Pickup
            </button>
          </div>
        </div>

        {/* Find nearest branch button */}
        <div className="flex justify-center pt-2 pb-4 px-4 border-b">
          <button
            className="flex items-center gap-2 py-2 px-6 bg-gray-200 rounded-full text-gray-800 text-xs font-medium hover:bg-gray-300 transition-colors"
            onClick={() => {
              // This would typically use geolocation to find the nearest branch
              // For now, just select the first branch
              const compatibleBranches = branches.filter((branch) =>
                orderType === "delivery" ? branch.delivery === 1 : branch.pickup === 1,
              )

              if (compatibleBranches.length > 0) {
                setSelectedBranch(compatibleBranches[0])
              }
            }}
          >
            <Target className="h-4 w-4" />
            Find Your Nearest Branch
          </button>
        </div>

        {/* Branch selection */}
        <div className="px-4 py-4 border-b">
          <h3 className="text-sm font-semibold mb-3">Select Branch</h3>

          <div className="relative">
            <button
              className="w-full flex items-center justify-between p-3 border rounded-lg text-left text-sm hover:border-gray-400 bg-white"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span>
                {isLoading
                  ? "Loading branches..."
                  : selectedBranch
                    ? formatBranchName(selectedBranch)
                    : `Select a branch`}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {showDropdown && (
              <div
                className="fixed left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 overflow-y-auto"
                style={{
                  top: "auto",
                  maxHeight: "300px",
                  width: "100%",
                  maxWidth: "500px",
                  margin: "0 auto",
                  marginTop: "1px",
                  transform: "translateY(0)",
                }}
              >
                {getFilteredBranchesByType().length > 0 ? (
                  getFilteredBranchesByType().map((branch) => (
                    <button
                      key={branch.id}
                      className="w-full p-3 text-left hover:bg-gray-100 border-b last:border-b-0 text-sm"
                      onClick={() => {
                        setSelectedBranch(branch)
                        setShowDropdown(false)
                      }}
                    >
                      {formatBranchName(branch)}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500 text-sm">No branches available</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Start order button */}
        <div className="px-4 py-4">
          <button
            className="w-full py-3 text-sm font-medium rounded-md transition-colors"
            onClick={handleStartOrderWithCallback}
            style={{
              backgroundColor: colors.button.bg,
              color: colors.button.fontColor,
              borderRadius: colors.button.radius,
            }}
          >
            Start My Order
          </button>
        </div>
      </div>
    </div>
  )
}
