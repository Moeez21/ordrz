"use client"

import { useState, useEffect, useCallback } from "react"

interface UseLazyImageOptions {
  threshold?: number
  rootMargin?: string
  lowQualityPlaceholder?: string
  highQualityImage: string
  fallbackImage?: string
}

export function useLazyImage({
  threshold = 0.1,
  rootMargin = "100px",
  lowQualityPlaceholder = "",
  highQualityImage,
  fallbackImage = "/placeholder.svg",
}: UseLazyImageOptions) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(lowQualityPlaceholder || fallbackImage)

  const onLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  const onError = useCallback(() => {
    setError(true)
    setCurrentSrc(fallbackImage)
  }, [fallbackImage])

  useEffect(() => {
    // Skip if high quality image is already loaded or there was an error
    if (loaded || error || !highQualityImage) return

    // Use Intersection Observer for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load high quality image
            const img = new Image()
            img.src = highQualityImage
            img.onload = () => {
              setCurrentSrc(highQualityImage)
              setLoaded(true)
              observer.disconnect()
            }
            img.onerror = () => {
              setError(true)
              setCurrentSrc(fallbackImage)
              observer.disconnect()
            }
          }
        })
      },
      { threshold, rootMargin },
    )

    // Create a dummy element to observe
    const element = document.createElement("div")
    document.body.appendChild(element)
    observer.observe(element)

    return () => {
      observer.disconnect()
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    }
  }, [highQualityImage, fallbackImage, loaded, error, threshold, rootMargin])

  return {
    src: currentSrc,
    isLoaded: loaded,
    hasError: error,
    onLoad,
    onError,
  }
}
