"use client"

import { useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import { useThemeColors } from "../context/theme-context"

interface CartNotificationProps {
  message: string
  isVisible: boolean
  onClose: () => void
}

export function CartNotification({ message, isVisible, onClose }: CartNotificationProps) {
  const { colors } = useThemeColors()

  useEffect(() => {
    if (isVisible) {
      // Set a timer to hide it after 3 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 3000) // Stay visible for 3 seconds

      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose, message])

  // Don't render anything if not visible
  if (!isVisible) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className="bg-green-600 text-white py-3 px-6 rounded-xl flex items-center gap-2 shadow-xl mx-auto"
        style={{
          backgroundColor: "#059669",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="bg-white bg-opacity-20 rounded-full p-1">
          <ShoppingCart className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}
