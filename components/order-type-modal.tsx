"use client"

import { useState, useEffect } from "react"
import { X, ChevronDown, Target } from "lucide-react"
import { useThemeColors } from "../context/theme-context"
import { useOrderPreferences } from "../context/order-preferences-context"
import { useBranchesData } from "../context/api-context"
import { setCookie } from "../utils/cookies"

export function OrderTypeModal({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void }) {
  const { colors } = useThemeColors()
  const { orderType, selectedBranch, setOrderType, setSelectedBranch } = useOrderPreferences()
  const { branches, isLoading } = useBranchesData()
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

  const handleStartOrder = () => {
    if (orderType && selectedBranch) {
      // Save to cookies
      setCookie("branch_id", selectedBranch.id.toString())
      setCookie("order_type", orderType)

      // Save wresId to cookie - this is the restaurant ID
      setCookie("wres_id", selectedBranch.r_id.toString())

      // Create a branch name from location and address
      const branchName = `${selectedBranch.location}, ${selectedBranch.address}`
      setCookie("branch_name", branchName)

      // Close the modal
      setIsOpen(false)
    }
  }

  const formatBranchName = (branch: any) => {
    if (!branch) return "Select a branch"
    return `${branch.address} ${branch.location} ${branch.city}`
  }

  const handleOrderTypeSelect = (type: "delivery" | "pickup") => {
    setOrderType(type)

    // Reset selected branch when changing order type
    const compatibleBranches = branches.filter((branch) =>
      type === "delivery" ? branch.delivery === 1 : branch.pickup === 1,
    )

    if (compatibleBranches.length > 0) {
      setSelectedBranch(compatibleBranches[0])
    } else {
      setSelectedBranch(null)
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-poppins">
          <div className="relative w-full max-w-lg bg-white rounded-lg overflow-visible" style={{ maxWidth: "500px" }}>
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700"
              onClick={() => {
                if (orderType && selectedBranch) {
                  setIsOpen(false)
                }
              }}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Order type tabs - only show options that have supporting branches */}
            <div className="flex border-b">
              {hasDeliveryOption() && (
                <button
                  className={`flex-1 py-4 text-center text-lg font-medium ${
                    orderType === "delivery" ? "bg-[#d05749] text-white" : "bg-white text-gray-700"
                  }`}
                  onClick={() => handleOrderTypeSelect("delivery")}
                >
                  Delivery
                </button>
              )}
              {hasPickupOption() && (
                <button
                  className={`flex-1 py-4 text-center text-lg font-medium ${
                    orderType === "pickup" ? "bg-[#d05749] text-white" : "bg-white text-gray-700"
                  }`}
                  onClick={() => handleOrderTypeSelect("pickup")}
                >
                  Pickup
                </button>
              )}
            </div>

            {/* Find nearest branch button */}
            <div className="flex justify-center py-6 px-4 border-b">
              <button
                className="flex items-center gap-2 py-3 px-6 bg-gray-200 rounded-full text-gray-800 font-medium"
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
                <Target className="h-5 w-5" />
                Find Your Nearest Branch
              </button>
            </div>

            {/* Branch selection */}
            <div className="p-6 border-b">
              <h3 className="h3 mb-4">Select Branch</h3>

              <div className="relative">
                <button
                  className="w-full flex items-center justify-between p-4 border rounded-lg text-left bg-white"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span>
                    {isLoading
                      ? "Loading branches..."
                      : selectedBranch
                        ? formatBranchName(selectedBranch)
                        : `Select a branch`}
                  </span>
                  <ChevronDown className="h-5 w-5 text-gray-500" />
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
                          className="w-full p-3 text-left hover:bg-gray-100 border-b last:border-b-0"
                          onClick={() => {
                            setSelectedBranch(branch)
                            setShowDropdown(false)
                          }}
                        >
                          {formatBranchName(branch)}
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">No branches available</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Start order button */}
            <div className="p-6">
              <button
                className="w-full py-4 bg-[#d05749] text-white text-lg font-medium rounded-lg"
                onClick={handleStartOrder}
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
      )}
    </>
  )
}
