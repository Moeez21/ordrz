"use client"

import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { useThemeColors } from "@/context/theme-context"
import { useOrderPreferences } from "@/context/order-preferences-context"
import { useThemeData } from "@/context/api-context"
import { CartButton } from "./cart-button"
import { useState } from "react"
import { BranchSelectionModal } from "./branch-selection-modal"

function SharedHeaderComponent() {
  const { colors } = useThemeColors()
  const { orderType, selectedBranch } = useOrderPreferences()
  const { logoImage, brandName, isLoading } = useThemeData()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <>
      <header
        className="border-b py-4 px-4 md:px-6 lg:px-8"
        style={{ backgroundColor: colors.header.bg, color: colors.header.fontColor }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              {isLoading ? (
                <div className="w-10 h-10 bg-gray-300 animate-pulse rounded-full"></div>
              ) : (
                <Image
                  src={
                    !imageError
                      ? logoImage || "/placeholder.svg?height=40&width=40"
                      : "/placeholder.svg?height=40&width=40"
                  }
                  alt={brandName || "Food Delivery"}
                  width={40}
                  height={40}
                  className="mr-2 object-contain"
                  onError={() => {
                    console.error("Error loading logo image:", logoImage)
                    setImageError(true)
                  }}
                />
              )}
            </Link>
            <div>
              <div className="text-sm font-medium">
                {orderType === "delivery" ? "Delivery" : orderType === "pickup" ? "Pickup" : "Delivery"}
              </div>
              <button
                className="text-sm flex items-center hover:text-gray-600"
                onClick={(e) => {
                  e.preventDefault()
                  setIsModalOpen(true)
                }}
              >
                {selectedBranch ? `${selectedBranch.location}, ${selectedBranch.address}` : "Select a branch"}
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <CartButton />
          </div>
        </div>
      </header>

      {/* Branch Selection Modal */}
      <BranchSelectionModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const SharedHeader = memo(SharedHeaderComponent)
