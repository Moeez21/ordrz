"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useThemeData } from "./api-context"
import { colors as defaultColorPalette } from "../utils/colors"

interface ThemeColors {
  header: {
    bg: string
    fontColor: string
  }
  body: {
    bg: string
    fontColor: string
  }
  button: {
    bg: string
    fontColor: string
    radius: string
  }
  productCard: {
    fontColor: string
    descColor: string
    bg: string
    borderColor: string
    borderRadius: string
  }
}

interface ThemeContextType {
  colors: ThemeColors
  isLoading: boolean
}

// Update the defaultColors object to use black and white as defaults
const defaultColors: ThemeColors = {
  header: {
    bg: "#ffffff",
    fontColor: "#000000",
  },
  body: {
    bg: "#ffffff",
    fontColor: "#000000",
  },
  button: {
    bg: "#000000",
    fontColor: "#ffffff",
    radius: "6px",
  },
  productCard: {
    fontColor: "#000000",
    descColor: "#666666",
    bg: "#ffffff",
    borderColor: "#e0e0e0",
    borderRadius: "6px",
  },
}

const ThemeContext = createContext<ThemeContextType>({
  colors: defaultColors,
  isLoading: true,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors)
  const { themeData, isLoading } = useThemeData()

  // Update the useEffect to better handle theme colors from API
  useEffect(() => {
    if (themeData?.theme?.color) {
      const themeColors = themeData.theme.color

      setColors({
        header: {
          bg: themeColors.header_bg || defaultColors.header.bg,
          fontColor: themeColors.header_font_color || defaultColors.header.fontColor,
        },
        body: {
          bg: themeColors.body_bg || defaultColors.body.bg,
          fontColor: themeColors.body_font_color || defaultColors.body.fontColor,
        },
        button: {
          bg: themeColors.button_bg || defaultColors.button.bg,
          fontColor: themeColors.button_font_color || defaultColors.button.fontColor,
          radius: `${themeColors.button_radius || 6}px`,
        },
        productCard: {
          fontColor: themeColors.product_card?.font_color || defaultColors.productCard.fontColor,
          descColor: themeColors.product_card?.desc_color || defaultColors.productCard.descColor,
          bg: themeColors.product_card?.background_color || defaultColors.productCard.bg,
          borderColor: themeColors.product_card?.border_color || defaultColors.productCard.borderColor,
          borderRadius: `${themeColors.product_card?.border_radius || 6}px`,
        },
      })
    }

    // Store logo in localStorage when available
    if (themeData?.logo_image) {
      if (typeof window !== "undefined") {
        localStorage.setItem("logoImage", themeData.logo_image)
        localStorage.setItem("logo_image", themeData.logo_image)
      }
    }
  }, [themeData])

  return <ThemeContext.Provider value={{ colors, isLoading }}>{children}</ThemeContext.Provider>
}

// Keep the existing useThemeColors hook
export function useThemeColors() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useThemeColors must be used within a ThemeProvider")
  }
  return context
}

// Add the missing useTheme export
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  // Return both the colors and the default color palette
  return {
    ...context,
    palette: defaultColorPalette,
    isDark: false, // You can implement dark mode detection here if needed
    toggleTheme: () => {}, // Placeholder for theme toggling functionality
  }
}
