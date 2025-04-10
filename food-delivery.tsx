"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useProductsData, useThemeData } from "./context/api-context"
import { ProductCard } from "./components/product-card"
import { FeaturedSlider } from "./components/featured-slider"
import { BannerSlider } from "./components/banner-slider"
import { CartProvider } from "./context/cart-context"
import { CartSidebar } from "./components/cart-sidebar"
import { useThemeColors } from "./context/theme-context"
import { useOrderPreferences } from "./context/order-preferences-context"
import { getCookie } from "./utils/cookies"
import { CategoryNav } from "./components/category-nav"
import { PageSkeleton } from "./components/skeleton-loaders"
import { CartNotificationWrapper } from "./components/cart-notification-wrapper"
import { ViewCartButton } from "./components/view-cart-button"
import { BranchSelectionModal } from "./components/branch-selection-modal"
import { getUniqueOrderId } from "./utils/api"
import { SharedHeader } from "./components/shared-header"
import { SharedFooter } from "./components/shared-footer"

// Create a separate component for the main content that will be wrapped by CartProvider
function FoodDeliveryContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isNavSticky, setIsNavSticky] = useState(false)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLElement>(null)
  const [scrollAttempts, setScrollAttempts] = useState(0)
  const [initialScrollComplete, setInitialScrollComplete] = useState(false)

  const {
    products,
    categories,
    featuredItems,
    productsByCategory,
    currency,
    isLoading: productsLoading,
    error: productsError,
  } = useProductsData()
  const { bannerImages, logoImage, brandName } = useThemeData()
  const { colors } = useThemeColors()
  const { orderType, selectedBranch } = useOrderPreferences()

  // Check if we need to show the modal on initial load
  useEffect(() => {
    const hasBranchId = getCookie("branch_id")
    const hasOrderType = getCookie("order_type")

    // Only show the modal if we don't have both branch_id and order_type
    if (!hasBranchId || !hasOrderType) {
      // Small delay to ensure the modal appears after the page loads
      const timer = setTimeout(() => {
        setIsModalOpen(true)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [])

  // Handle category click - smooth scroll to category
  const handleCategoryClick = (categoryId: string) => {
    console.log(`Category clicked: ${categoryId}`)

    // Set the active category immediately
    setActiveCategory(categoryId)

    // Use a direct DOM approach to find and scroll to the element
    const element = document.getElementById(`category-${categoryId}`)
    if (element) {
      console.log(`Found category element for ID: ${categoryId}`)

      // Get the sticky nav height to offset the scroll position
      const navHeight = navRef.current?.offsetHeight || 0

      // Calculate the element's position relative to the document
      const elementPosition = element.getBoundingClientRect().top + window.scrollY

      // Calculate the scroll position with offset
      const offsetPosition = elementPosition - navHeight - 20 // 20px extra padding

      console.log(`Scrolling to position: ${offsetPosition}`)

      // Scroll to the element with a slight delay to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        })
      }, 100)
    } else {
      console.error(`Category element not found for ID: ${categoryId}`)
    }
  }

  // Set up intersection observer to detect which category is in view
  useEffect(() => {
    if (productsLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryId = entry.target.getAttribute("data-category-id")
            if (categoryId) {
              setActiveCategory(categoryId)
            }
          }
        })
      },
      {
        rootMargin: "-20% 0px -70% 0px", // Adjust these values to control when a section is considered "active"
        threshold: 0,
      },
    )

    // Observe all category sections
    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => {
      Object.values(categoryRefs.current).forEach((ref) => {
        if (ref) observer.unobserve(ref)
      })
    }
  }, [productsLoading, categories])

  // Handle sticky navigation
  useEffect(() => {
    const handleScroll = () => {
      if (!navRef.current || !mainContentRef.current) return

      const navPosition = mainContentRef.current.getBoundingClientRect().top
      setIsNavSticky(navPosition <= 0)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Enhanced category navigation from URL query parameter
  useEffect(() => {
    // Only run on client side and after products are loaded
    if (typeof window === "undefined" || productsLoading || initialScrollComplete) return

    // Get the category ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const categoryId = urlParams.get("category")

    if (categoryId) {
      console.log(`Attempting to navigate to category from URL: ${categoryId} (Attempt ${scrollAttempts + 1})`)

      // Set the active category immediately
      setActiveCategory(categoryId)

      // Function to scroll to the category using direct DOM access
      const scrollToCategory = () => {
        // Find the category element directly in the DOM
        const categoryElement = document.getElementById(`category-${categoryId}`)

        if (categoryElement) {
          console.log(`Found category element for ID: ${categoryId} from URL parameter`)

          // Get the sticky nav height to offset the scroll position
          const navHeight = navRef.current?.offsetHeight || 0

          // Calculate the element's position relative to the document
          const elementPosition = categoryElement.getBoundingClientRect().top + window.scrollY

          // Calculate the scroll position with offset
          const offsetPosition = elementPosition - navHeight - 20

          console.log(`Scrolling to position: ${offsetPosition} from URL parameter`)

          // Scroll to the element
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          })

          // Mark scroll as complete
          setInitialScrollComplete(true)

          // Only remove the query parameter after successful scrolling
          setTimeout(() => {
            const newUrl = window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
          }, 500)

          return true
        }

        console.warn(`Category element not found for ID: ${categoryId} from URL parameter`)
        return false
      }

      // Try to scroll to category with a slight delay to ensure DOM is ready
      setTimeout(() => {
        if (!scrollToCategory() && scrollAttempts < 5) {
          // If failed and we haven't exceeded max attempts, increment attempt counter
          setScrollAttempts((prev) => prev + 1)
        } else {
          // Max attempts reached or successful, mark as complete
          setInitialScrollComplete(true)
        }
      }, 300)
    } else {
      // No category parameter, mark as complete
      setInitialScrollComplete(true)
    }
  }, [productsLoading, scrollAttempts, initialScrollComplete])

  // Filter out empty categories
  const nonEmptyCategories = categories.filter(
    (category) => (productsByCategory[category.category_id] || []).length > 0,
  )

  if (productsLoading) {
    return (
      <div style={{ backgroundColor: colors.body.bg }}>
        <PageSkeleton />
      </div>
    )
  }

  if (productsError) {
    return (
      <div
        className="flex flex-col min-h-screen items-center justify-center"
        style={{ backgroundColor: colors.body.bg }}
      >
        <div className="text-red-500 text-xl font-medium">{productsError}</div>
        <Button
          className="mt-4"
          style={{
            backgroundColor: colors.button.bg,
            color: colors.button.fontColor,
            borderRadius: colors.button.radius,
          }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col min-h-screen font-sans"
      style={{ backgroundColor: colors.body.bg, color: colors.body.fontColor }}
    >
      {/* Header */}
      <SharedHeader />

      {/* Hero Banner */}
      <div className="w-full">
        <BannerSlider images={bannerImages.slice(0, 3)} />
      </div>

      {/* Main Content */}
      <main ref={mainContentRef} className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8 pb-20">
        {/* Featured Items Section - Keep at the top */}
        {featuredItems.length > 0 && (
          <div className="mb-12">
            <FeaturedSlider products={featuredItems} currency={currency} />
          </div>
        )}

        {/* Sticky Category Navigation */}
        <div
          ref={navRef}
          className={`sticky z-10 py-1 transition-all duration-300 ${isNavSticky ? "top-0 bg-white" : "top-0"}`}
          style={{
            backgroundColor: isNavSticky ? colors.body.bg : "transparent",
            borderBottom: isNavSticky ? `1px solid ${colors.productCard.borderColor}` : "none",
          }}
        >
          <CategoryNav
            categories={nonEmptyCategories}
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
          />
        </div>

        {/* Categories and Menu Items - Sequential Display */}
        <div className="space-y-10 mt-6">
          {/* Display each category sequentially */}
          {nonEmptyCategories.map((category) => {
            const categoryItems = productsByCategory[category.category_id] || []

            return (
              <div
                key={category.category_id}
                ref={(el) => (categoryRefs.current[category.category_id] = el)}
                data-category-id={category.category_id}
                id={`category-${category.category_id}`} // Ensure this ID is explicitly set
                className="pt-4 scroll-mt-20"
              >
                <h2 className="text-[18px] font-semibold text-gray-800 mb-4 pb-2">{category.category_name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryItems.map((item) => (
                    <ProductCard key={item.menu_item_id} product={item} currency={currency} />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Display uncategorized items if any */}
          {(() => {
            const uncategorizedItems = products.filter(
              (product) =>
                product.featured !== "1" && !categories.some((cat) => cat.category_id === product.menu_cat_id),
            )

            if (uncategorizedItems.length === 0) return null

            const uncategorizedId = "uncategorized"

            return (
              <div
                className="pt-4 scroll-mt-20"
                ref={(el) => (categoryRefs.current[uncategorizedId] = el)}
                data-category-id={uncategorizedId}
              >
                <h2 className="text-[18px] font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                  Other Items
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uncategorizedItems.map((item) => (
                    <ProductCard key={item.menu_item_id} product={item} currency={currency} />
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </main>

      {/* Footer */}
      <SharedFooter />

      {/* Cart Sidebar */}
      <CartSidebar />

      {/* Order Type Modal */}
      <BranchSelectionModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />

      {/* Cart Notification - Now inside the CartProvider context */}
      <CartNotificationWrapper />

      {/* View Cart Button */}
      <ViewCartButton />
    </div>
  )
}

// Main component that wraps everything with the necessary providers
export default function FoodDelivery() {
  const { currency } = useProductsData()
  // Check if we have a unique order ID
  const [hasOrderId, setHasOrderId] = useState(false)

  useEffect(() => {
    // Check if we have a unique order ID
    const orderId = getUniqueOrderId()
    setHasOrderId(!!orderId)
  }, [])

  return (
    <CartProvider currency={currency}>
      <FoodDeliveryContent />
    </CartProvider>
  )
}
