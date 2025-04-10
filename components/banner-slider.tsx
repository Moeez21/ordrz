"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function BannerSlider({ images = [] }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Set up autoplay
  useEffect(() => {
    if (images.length <= 1) return

    const startAutoplay = () => {
      autoplayTimerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
        setTranslateX(0) // Reset any manual translation
      }, 5000)
    }

    startAutoplay()

    // Clear interval on unmount
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
    }
  }, [images.length])

  // If no images, show placeholder
  if (images.length === 0) {
    return (
      <div className="relative w-full h-80 bg-gray-200 flex items-center justify-center">
        <p>No images available</p>
      </div>
    )
  }

  // Navigation functions
  const goToNext = () => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current)
    }
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    setTranslateX(0) // Reset any manual translation

    // Restart autoplay after manual navigation
    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      setTranslateX(0)
    }, 5000)
  }

  const goToPrev = () => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current)
    }
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1))
    setTranslateX(0) // Reset any manual translation

    // Restart autoplay after manual navigation
    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      setTranslateX(0)
    }, 5000)
  }

  const goToSlide = (index: number) => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current)
    }
    setCurrentIndex(index)
    setTranslateX(0) // Reset any manual translation

    // Restart autoplay after manual navigation
    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      setTranslateX(0)
    }, 5000)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (images.length <= 1) return

    // Pause autoplay during touch interaction
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current)
    }

    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setCurrentX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || images.length <= 1) return

    setCurrentX(e.touches[0].clientX)

    // Calculate how far we've dragged
    const deltaX = e.touches[0].clientX - startX

    // Limit the drag to a percentage of the container width
    const containerWidth = sliderRef.current?.clientWidth || 1
    const maxDrag = containerWidth * 0.4 // 40% of container width
    const limitedDrag = Math.max(Math.min(deltaX, maxDrag), -maxDrag)

    setTranslateX(limitedDrag)
  }

  const handleTouchEnd = () => {
    if (!isDragging || images.length <= 1) return

    setIsDragging(false)

    // Calculate the drag distance as a percentage of container width
    const containerWidth = sliderRef.current?.clientWidth || 1
    const dragPercentage = (translateX / containerWidth) * 100

    // If dragged more than 15% of the width, change slide
    if (dragPercentage < -15) {
      goToNext()
    } else if (dragPercentage > 15) {
      goToPrev()
    }

    // Reset translation
    setTranslateX(0)

    // Restart autoplay after touch interaction
    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      setTranslateX(0)
    }, 5000)
  }

  // Mouse event handlers (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (images.length <= 1) return

    // Pause autoplay during mouse interaction
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current)
    }

    setIsDragging(true)
    setStartX(e.clientX)
    setCurrentX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || images.length <= 1) return

    setCurrentX(e.clientX)

    // Calculate how far we've dragged
    const deltaX = e.clientX - startX

    // Limit the drag to a percentage of the container width
    const containerWidth = sliderRef.current?.clientWidth || 1
    const maxDrag = containerWidth * 0.4 // 40% of container width
    const limitedDrag = Math.max(Math.min(deltaX, maxDrag), -maxDrag)

    setTranslateX(limitedDrag)
  }

  const handleMouseUp = () => {
    if (!isDragging || images.length <= 1) return

    setIsDragging(false)

    // Calculate the drag distance as a percentage of container width
    const containerWidth = sliderRef.current?.clientWidth || 1
    const dragPercentage = (translateX / containerWidth) * 100

    // If dragged more than 15% of the width, change slide
    if (dragPercentage < -15) {
      goToNext()
    } else if (dragPercentage > 15) {
      goToPrev()
    }

    // Reset translation
    setTranslateX(0)

    // Restart autoplay after mouse interaction
    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
      setTranslateX(0)
    }, 5000)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setTranslateX(0)

      // Restart autoplay
      autoplayTimerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
        setTranslateX(0)
      }, 5000)
    }
  }

  return (
    <div
      ref={sliderRef}
      className="relative w-full h-80 md:h-[400px] overflow-hidden bg-gray-100 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Current image */}
      <div
        className="w-full h-full transition-transform duration-300"
        style={{
          transform: `translateX(${translateX}px)`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <Image
          src={images[currentIndex] || "/placeholder.svg?height=256&width=1200"}
          alt="Banner image"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          draggable="false"
        />
      </div>

      {/* Navigation buttons - only show if more than one image */}
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-lg h-10 w-10 z-10"
            onClick={goToPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-lg h-10 w-10 z-10"
            onClick={goToNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-white" : "bg-white/50"
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
