"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import type { Branch } from "../types/branch"
import { getCookie, setCookie } from "../utils/cookies"
import { useBranchesData } from "./api-context"

// Types
export type OrderType = "delivery" | "pickup" | null

interface OrderPreferencesContextType {
  orderType: OrderType
  selectedBranch: Branch | null
  setOrderType: (type: OrderType) => void
  setSelectedBranch: (branch: Branch | null) => void
  handleStartOrder: (setIsOpen: (open: boolean) => void) => void
}

// Create context
const OrderPreferencesContext = createContext<OrderPreferencesContextType | undefined>(undefined)

// Provider component
export function OrderPreferencesProvider({ children }: { children: ReactNode }) {
  const [orderType, setOrderType] = useState<OrderType>(null)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const { branches, isLoading } = useBranchesData()

  // Load saved preferences from cookies
  useEffect(() => {
    if (isLoading) return

    try {
      const savedOrderType = getCookie("order_type") as OrderType
      const savedBranchId = getCookie("branch_id")

      if (savedOrderType) {
        setOrderType(savedOrderType)
      }

      if (savedBranchId && branches.length > 0) {
        const branch = branches.find((b) => b.id.toString() === savedBranchId)
        if (branch) {
          setSelectedBranch(branch)
        }
      }
    } catch (error) {
      console.error("Error loading saved preferences:", error)
    }
  }, [branches, isLoading])

  // Add wresId to the cookie when saving order preferences
  const handleStartOrder = (setIsOpen: (open: boolean) => void) => {
    if (orderType && selectedBranch) {
      // Save to cookies
      setCookie("branch_id", selectedBranch.id.toString())
      setCookie("order_type", orderType)

      // Save wresId to cookie
      const wresId = selectedBranch.r_id.toString()
      setCookie("wres_id", wresId)

      // Create a branch name from location and address
      const branchName = `${selectedBranch.location}, ${selectedBranch.address}`
      setCookie("branch_name", branchName)

      // Close the modal
      setIsOpen(false)
    }
  }

  return (
    <OrderPreferencesContext.Provider
      value={{
        orderType,
        selectedBranch,
        setOrderType,
        setSelectedBranch,
        handleStartOrder,
      }}
    >
      {children}
    </OrderPreferencesContext.Provider>
  )
}

// Hook for using the context
export function useOrderPreferences() {
  const context = useContext(OrderPreferencesContext)
  if (context === undefined) {
    throw new Error("useOrderPreferences must be used within an OrderPreferencesProvider")
  }
  return context
}
