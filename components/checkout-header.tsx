"use client"

import { memo, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useThemeColors } from "@/context/theme-context"
import { useThemeData } from "@/context/api-context"

function CheckoutHeaderComponent() {
  const { colors } = useThemeColors()
  const { logoImage, brandName, isLoading } = useThemeData()
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    console.log("Logo image URL:", logoImage)
  }, [logoImage])

  return (
    <header
      className="border-b py-4 px-4 md:px-6 lg:px-8"
      style={{ backgroundColor: colors.header.bg, color: colors.header.fontColor }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-start">
        <Link href="/" className="flex items-center">
          {isLoading ? (
            <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-full"></div>
          ) : (
            <Image
              src={
                !imageError ? logoImage || "/placeholder.svg?height=40&width=40" : "/placeholder.svg?height=40&width=40"
              }
              alt={brandName || "Food Delivery"}
              width={40}
              height={40}
              className="object-contain"
              onError={() => {
                console.error("Error loading logo image:", logoImage)
                setImageError(true)
              }}
              priority // Add priority to ensure the logo loads first
            />
          )}
        </Link>
      </div>
    </header>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const CheckoutHeader = memo(CheckoutHeaderComponent)
