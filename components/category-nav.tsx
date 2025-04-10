"use client"

import { useRef, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useThemeColors } from "../context/theme-context"
import type { Category } from "../types/product"

interface CategoryNavProps {
  categories: Category[]
  activeCategory: string | null
  onCategoryClick: (categoryId: string) => void
}

export function CategoryNav({ categories, activeCategory, onCategoryClick }: CategoryNavProps) {
  const { colors } = useThemeColors()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  // Check if scroll arrows should be shown
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return

      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10) // 10px buffer
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      checkScroll()
      scrollContainer.addEventListener("scroll", checkScroll)

      // Initial check for right arrow
      setShowRightArrow(scrollContainer.scrollWidth > scrollContainer.clientWidth)

      return () => scrollContainer.removeEventListener("scroll", checkScroll)
    }
  }, [categories])

  // Scroll left/right
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 200
    const currentScroll = scrollContainerRef.current.scrollLeft

    scrollContainerRef.current.scrollTo({
      left: direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: "smooth",
    })
  }

  // Scroll active category into view
  useEffect(() => {
    if (!activeCategory || !scrollContainerRef.current) return

    const activeElement = scrollContainerRef.current.querySelector(`[data-category-id="${activeCategory}"]`)
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
    }
  }, [activeCategory])

  if (categories.length <= 1) return null

  return (
    <div className="relative">
      <div className="relative">
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-md"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => (
            <button
              key={category.category_id}
              data-category-id={category.category_id}
              className={`flex-shrink-0 px-4 py-2 mx-2 whitespace-nowrap transition-colors text-[14px] font-medium rounded-md`}
              style={
                activeCategory === category.category_id
                  ? {
                      backgroundColor: colors.button.bg,
                      color: colors.button.fontColor,
                      borderRadius: colors.button.radius,
                    }
                  : { color: colors.body.fontColor }
              }
              onClick={() => {
                console.log(`Category nav clicked: ${category.category_id}`)
                onCategoryClick(category.category_id)
              }}
            >
              {category.category_name}
            </button>
          ))}
        </div>

        {showRightArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white shadow-md"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
