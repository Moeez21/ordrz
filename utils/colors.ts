// Default color palette for the application
export const colors = {
  // Primary colors
  primary: {
    main: "#000000",
    light: "#333333",
    dark: "#000000",
    contrastText: "#FFFFFF",
  },

  // Secondary colors
  secondary: {
    main: "#E41E3F",
    light: "#FF4D6D",
    dark: "#B00020",
    contrastText: "#FFFFFF",
  },

  // UI colors
  ui: {
    background: "#FFFFFF",
    foreground: "#000000",
    card: "#FFFFFF",
    border: "#E0E0E0",
    hover: "#F5F5F5",
  },

  // Text colors
  text: {
    primary: "#000000",
    secondary: "#666666",
    disabled: "#9E9E9E",
    hint: "#9E9E9E",
  },

  // Status colors
  status: {
    success: "#4CAF50",
    info: "#2196F3",
    warning: "#FF9800",
    error: "#F44336",
  },
}

// Helper function to get color with opacity
export function getColorWithOpacity(color: string, opacity: number): string {
  // Check if color is a hex value
  if (color.startsWith("#")) {
    // Convert hex to rgba
    const r = Number.parseInt(color.slice(1, 3), 16)
    const g = Number.parseInt(color.slice(3, 5), 16)
    const b = Number.parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // If it's already rgba or another format, try to extract values
  const rgbMatch = color.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?$$/)
  if (rgbMatch) {
    const r = rgbMatch[1]
    const g = rgbMatch[2]
    const b = rgbMatch[3]
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  // Fallback: return the color with opacity
  return color
}
