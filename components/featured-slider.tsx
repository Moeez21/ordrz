"use client"

import type React from "react"
import { useState, useEffect, useRef, memo, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "../types/product"
import { FeaturedCard } from "./featured-card"

// Memoized FeaturedCard to prevent unnecessary re-renders
const MemoizedFeaturedCard = memo(FeaturedCard)

interface FeaturedSliderProps {
  products: Product[]
  currency: string
}

export function FeaturedSlider({ products, currency }: FeaturedSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate how many items to show based on screen width
  const [itemsToShow, setItemsToShow] = useState(4)

  // Add these new state variables and refs for touch handling
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const [initialTranslateX, setInitialTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeThreshold, setSwipeThreshold] = useState(50)
  const [touchStartTime, setTouchStartTime] = useState(0)

  // Debounced resize handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsToShow(1)
        setSwipeThreshold(40) // Lower threshold for mobile
      } else if (window.innerWidth < 1024) {
        setItemsToShow(2)
        setSwipeThreshold(50)
      } else if (window.innerWidth < 1280) {
        setItemsToShow(3)
        setSwipeThreshold(60)
      } else {
        setItemsToShow(4)
        setSwipeThreshold(70)
      }
    }

    // Initial call
    handleResize()

    // Debounce resize event for better performance
    let resizeTimer: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(handleResize, 100)
    }

    window.addEventListener("resize", debouncedResize)
    return () => {
      window.removeEventListener("resize", debouncedResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  // Calculate total slides
  const totalSlides = Math.max(0, products.length - itemsToShow + 1)

  // Memoize navigation functions
  const nextSlide = useCallback(() => {
    if (isAnimating || currentIndex >= totalSlides - 1) return

    setIsAnimating(true)
    setCurrentIndex((prev) => prev + 1)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating, currentIndex, totalSlides])

  const prevSlide = useCallback(() => {
    if (isAnimating || currentIndex <= 0) return

    setIsAnimating(true)
    setCurrentIndex((prev) => prev - 1)
    setTimeout(() => setIsAnimating(false), 500)
  }, [isAnimating, currentIndex])

  // Improved touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isAnimating || products.length <= itemsToShow) return

      setIsDragging(true)
      setIsSwiping(false)
      setStartX(e.touches[0].clientX)
      setCurrentX(e.touches[0].clientX)
      setTouchStartTime(Date.now())

      // Store the current translateX value
      const currentTransform = sliderRef.current?.style.transform || ""
      const match = currentTransform.match(/translateX$$-?(\d+(?:\.\d+)?)%$$/)
      const currentTranslateX = match ? Number.parseFloat(match[1]) : currentIndex * (100 / itemsToShow)
      setInitialTranslateX(currentTranslateX)

      // Pause any ongoing animations
      if (sliderRef.current) {
        sliderRef.current.style.transition = "none"
      }
    },
    [isAnimating, products.length, itemsToShow, currentIndex],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || isAnimating || products.length <= itemsToShow) return

      e.preventDefault() // Prevent page scrolling while swiping

      const clientX = e.touches[0].clientX
      setCurrentX(clientX)

      // Calculate drag distance
      const deltaX = clientX - startX

      // Convert pixel movement to percentage of container width
      const containerWidth = containerRef.current?.offsetWidth || 1
      const dragPercentage = (deltaX / containerWidth) * 100

      // Calculate new translate value (bounded by the slider limits)
      let newTranslateX = initialTranslateX - dragPercentage

      // Apply bounds: can't drag past first or last slide
      const minTranslate = 0
      const maxTranslate = (products.length - itemsToShow) * (100 / itemsToShow)
      newTranslateX = Math.max(minTranslate, Math.min(newTranslateX, maxTranslate))

      // Update the transform
      if (sliderRef.current) {
        sliderRef.current.style.transform = `translateX(-${newTranslateX}%)`
      }

      setTranslateX(newTranslateX)

      // Determine if this is a swipe (significant horizontal movement)
      const dragDistance = Math.abs(deltaX)
      if (dragDistance > swipeThreshold) {
        setIsSwiping(true)
      }
    },
    [isDragging, isAnimating, products.length, itemsToShow, startX, initialTranslateX, swipeThreshold],
  )

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || isAnimating || products.length <= itemsToShow) return

    setIsDragging(false)

    // Re-enable transitions
    if (sliderRef.current) {
      sliderRef.current.style.transition = "transform 500ms ease-in-out"
    }

    // Calculate the closest slide index based on current translateX
    const slideWidth = 100 / itemsToShow
    const closestSlideIndex = Math.round(translateX / slideWidth)

    // Check if it was a quick swipe
    const touchDuration = Date.now() - touchStartTime
    const isQuickSwipe = touchDuration < 300 && isSwiping

    // Determine direction of swipe
    const deltaX = currentX - startX
    const swipeDirection = deltaX > 0 ? "right" : "left"

    let targetIndex

    if (isQuickSwipe) {
      // For quick swipes, move one slide in the swipe direction
      targetIndex =
        swipeDirection === "left"
          ? Math.min(closestSlideIndex + 1, products.length - itemsToShow)
          : Math.max(closestSlideIndex - 1, 0)
    } else {
      // For slower drags, snap to the closest slide
      targetIndex = Math.max(0, Math.min(closestSlideIndex, products.length - itemsToShow))
    }

    // Update current index and apply the transform
    setCurrentIndex(targetIndex)

    // Apply the final transform with transition
    if (sliderRef.current) {
      sliderRef.current.style.transform = `translateX(-${targetIndex * slideWidth}%)`
    }
  }, [isDragging, isAnimating, products.length, itemsToShow, translateX, touchStartTime, isSwiping, currentX, startX])

  // Don't render if no products
  if (products.length === 0) return null

  return (
    <div className="mb-8" ref={containerRef}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Featured</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border border-gray-300"
            onClick={prevSlide}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border border-gray-300"
            onClick={nextSlide}
            disabled={currentIndex >= totalSlides - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className="relative overflow-hidden touch-pan-x"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={sliderRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
        >
          {products.map((product) => (
            <div key={product.menu_item_id} className="flex-shrink-0" style={{ width: `${100 / itemsToShow}%` }}>
              <div className="px-2">
                <MemoizedFeaturedCard product={product} currency={currency} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
