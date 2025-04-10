"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from "react"
import type { ThemeSettings } from "../types/theme"
import type { Branch } from "../types/branch"
import type { ApiResponse, Product, Category } from "../types/product"
import { setCookie } from "../utils/cookies"

interface ApiContextType {
  // Theme data
  themeData: ThemeSettings | null
  bannerImages: string[]
  logoImage: string
  faviconUrl: string
  brandName: string
  wresId: string | null

  // Products data
  products: Product[]
  categories: Category[]
  featuredItems: Product[]
  productsByCategory: Record<string, Product[]>
  currency: string

  // Branches data
  branches: Branch[]

  // Loading states
  isThemeLoading: boolean
  isProductsLoading: boolean
  isBranchesLoading: boolean
  isLoading: boolean

  // Errors
  themeError: string | null
  productsError: string | null
  branchesError: string | null

  // Refetch methods
  refetchTheme: () => Promise<void>
  refetchProducts: () => Promise<void>
  refetchBranches: () => Promise<void>
}

const ApiContext = createContext<ApiContextType | undefined>(undefined)

// Create a cache object outside the component to persist across renders
const apiCache: {
  theme?: any
  products?: any
  branches?: any
  timestamp: {
    theme?: number
    products?: number
    branches?: number
  }
} = {
  timestamp: {},
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

export function ApiProvider({ children, skipProductsApi = false }: { children: ReactNode; skipProductsApi?: boolean }) {
  // Theme states
  const [themeData, setThemeData] = useState<ThemeSettings | null>(null)
  const [bannerImages, setBannerImages] = useState<string[]>([])
  const [logoImage, setLogoImage] = useState<string>("")
  const [faviconUrl, setFaviconUrl] = useState<string>("")
  const [brandName, setBrandName] = useState<string>("Restaurant")
  const [wresId, setWresId] = useState<string | null>(null)
  const [isThemeLoading, setIsThemeLoading] = useState(true)
  const [themeError, setThemeError] = useState<string | null>(null)

  // Products states
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredItems, setFeaturedItems] = useState<Product[]>([])
  const [currency, setCurrency] = useState<string>("PKR")
  const [isProductsLoading, setIsProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)

  // Branches states
  const [branches, setBranches] = useState<Branch[]>([])
  const [isBranchesLoading, setIsBranchesLoading] = useState(true)
  const [branchesError, setBranchesError] = useState<string | null>(null)

  // Fetch theme data with caching
  const fetchThemeData = useCallback(async (force = false) => {
    try {
      setIsThemeLoading(true)
      setThemeError(null)

      // Check cache first if not forcing refresh
      const now = Date.now()
      if (!force && apiCache.theme && apiCache.timestamp.theme && now - apiCache.timestamp.theme < CACHE_EXPIRATION) {
        console.log("Using cached theme data")
        const data = apiCache.theme

        // Process cached data
        if (data.status === 200 && data.result) {
          const extractedWresId = data.result.res_id || data.result.id || "18"
          setWresId(extractedWresId.toString())
          setCookie("wres_id", extractedWresId.toString())

          let themeObj = data.result.theme
          if (!themeObj && data.result.theme_settings) {
            try {
              const parsedSettings = JSON.parse(data.result.theme_settings)
              themeObj = parsedSettings.theme
            } catch (e) {
              console.error("Failed to parse theme_settings:", e)
            }
          }

          setThemeData({
            ...data.result,
            theme: themeObj,
            wres_id: extractedWresId,
          })

          if (themeObj && Array.isArray(themeObj.slider)) {
            const webSliders = themeObj.slider
              .filter(
                (slider) =>
                  (slider.status === 1 || slider.status === "1") && slider.source === "Web" && slider.image_url,
              )
              .map((slider) => slider.image_url)

            if (webSliders.length > 0) {
              setBannerImages(webSliders)
            } else {
              const anySliders = themeObj.slider
                .filter((slider) => (slider.status === 1 || slider.status === "1") && slider.image_url)
                .map((slider) => slider.image_url)

              setBannerImages(anySliders.length > 0 ? anySliders : ["/placeholder.svg?height=256&width=1200"])
            }
          } else {
            setBannerImages(["/placeholder.svg?height=256&width=1200"])
          }

          const logo = data.result.logo_image || data.result.favicon || "/placeholder.svg?height=40&width=40"
          setLogoImage(logo)
          setFaviconUrl(data.result.favicon || "")
          setBrandName(data.result.brand_name || "Restaurant")
        }

        setIsThemeLoading(false)
        return
      }

      // If not in cache or cache expired, fetch from API
      console.log("Fetching theme data from API...")
      const response = await fetch("/api/theme", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Theme API Response:", data)

      // Update cache
      apiCache.theme = data
      apiCache.timestamp.theme = now

      if (data.status === 200 && data.result) {
        // Extract wres_id from the response
        const extractedWresId = data.result.res_id || data.result.id || "18" // Default to 18 if not found
        setWresId(extractedWresId.toString())

        // Save wresId to cookie for use in cart API calls
        setCookie("wres_id", extractedWresId.toString())

        // Parse the theme_settings string to get the theme object if needed
        let themeObj = data.result.theme

        // If theme object is not directly available, try to parse it from theme_settings
        if (!themeObj && data.result.theme_settings) {
          try {
            // The theme_settings is a stringified JSON
            const parsedSettings = JSON.parse(data.result.theme_settings)
            themeObj = parsedSettings.theme
          } catch (e) {
            console.error("Failed to parse theme_settings:", e)
          }
        }

        // Store the complete theme data
        setThemeData({
          ...data.result,
          theme: themeObj,
          wres_id: extractedWresId,
        })

        // Extract slider images from the theme object
        if (themeObj && Array.isArray(themeObj.slider)) {
          // Filter for Web sliders with status 1 or "1"
          const webSliders = themeObj.slider
            .filter(
              (slider) => (slider.status === 1 || slider.status === "1") && slider.source === "Web" && slider.image_url,
            )
            .map((slider) => slider.image_url)

          if (webSliders.length > 0) {
            setBannerImages(webSliders)
          } else {
            // Fallback to any active sliders if no web sliders
            const anySliders = themeObj.slider
              .filter((slider) => (slider.status === 1 || slider.status === "1") && slider.image_url)
              .map((slider) => slider.image_url)

            setBannerImages(anySliders.length > 0 ? anySliders : ["/placeholder.svg?height=256&width=1200"])
          }
        } else {
          setBannerImages(["/placeholder.svg?height=256&width=1200"])
        }

        // Set logo image directly from the result object
        const logo = data.result.logo_image || data.result.favicon || "/placeholder.svg?height=40&width=40"
        setLogoImage(logo)

        // Set favicon
        setFaviconUrl(data.result.favicon || "")

        // Set brand name
        setBrandName(data.result.brand_name || "Restaurant")
      } else {
        throw new Error("API returned unexpected format")
      }
    } catch (error) {
      console.error("Error fetching theme data:", error)
      setThemeError("Failed to load theme data. Using default values.")

      // Set defaults
      setBannerImages(["/placeholder.svg?height=256&width=1200"])
      setLogoImage("/placeholder.svg?height=40&width=40")
      setWresId("18") // Default wres_id
    } finally {
      setIsThemeLoading(false)
    }
  }, [])

  // Fetch products with caching
  const fetchProducts = useCallback(
    async (force = false) => {
      if (!wresId) return

      try {
        setIsProductsLoading(true)
        setProductsError(null)

        // Check cache first if not forcing refresh
        const now = Date.now()
        if (
          !force &&
          apiCache.products &&
          apiCache.timestamp.products &&
          now - apiCache.timestamp.products < CACHE_EXPIRATION
        ) {
          console.log(`Using cached products data for wres_id: ${wresId}`)
          const data = apiCache.products

          if (data.status === "1") {
            // Process products
            const allProducts = data.items.map((product: Product) => ({
              ...product,
              originalPrice: product.discount
                ? (Number.parseInt(product.price) / (1 - Number.parseFloat(product.discount) / 100)).toFixed(0)
                : product.price,
            }))

            // Set featured items
            const featured = allProducts.filter((product: Product) => product.featured === "1")

            // Set categories
            const cats = data.categories || []

            // Set logo and currency
            const currencyCode = data.info?.currency || "PKR"

            setProducts(allProducts)
            setFeaturedItems(featured)
            setCategories(cats)
            setCurrency(currencyCode)
          }

          setIsProductsLoading(false)
          return
        }

        // If not in cache or cache expired, fetch from API
        console.log(`Fetching products for wres_id: ${wresId}`)
        const response = await fetch(`/api/products?wres_id=${wresId}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data: ApiResponse = await response.json()

        // Update cache
        apiCache.products = data
        apiCache.timestamp.products = now

        if (data.status === "1") {
          // Process products
          const allProducts = data.items.map((product) => ({
            ...product,
            originalPrice: product.discount
              ? (Number.parseInt(product.price) / (1 - Number.parseFloat(product.discount) / 100)).toFixed(0)
              : product.price,
          }))

          // Set featured items
          const featured = allProducts.filter((product) => product.featured === "1")

          // Set categories
          const cats = data.categories || []

          // Set logo and currency
          const currencyCode = data.info?.currency || "PKR"

          setProducts(allProducts)
          setFeaturedItems(featured)
          setCategories(cats)
          setCurrency(currencyCode)
        } else {
          throw new Error("API returned error status")
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        setProductsError("Failed to load products. Please try again later.")
      } finally {
        setIsProductsLoading(false)
      }
    },
    [wresId],
  )

  // Fetch branches with caching
  const fetchBranches = useCallback(
    async (force = false) => {
      if (!wresId) return

      try {
        setIsBranchesLoading(true)
        setBranchesError(null)

        // Check cache first if not forcing refresh
        const now = Date.now()
        if (
          !force &&
          apiCache.branches &&
          apiCache.timestamp.branches &&
          now - apiCache.timestamp.branches < CACHE_EXPIRATION
        ) {
          console.log(`Using cached branches data for wres_id: ${wresId}`)
          const data = apiCache.branches

          if (data.status === 200 && data.result?.branches) {
            // Process branches
            const processedBranches = data.result.branches.map((branch: Branch) => {
              return {
                ...branch,
                isOpen: true, // Simplify by assuming all branches are open
                openHours: "00:00 AM - 11:59 PM", // Default hours
              }
            })

            setBranches(processedBranches)
          } else {
            // Use placeholder branches
            setBranches(getPlaceholderBranches())
          }

          setIsBranchesLoading(false)
          return
        }

        // If not in cache or cache expired, fetch from API
        console.log(`Fetching branches for wres_id: ${wresId}`)
        const response = await fetch(`/api/branches?wres_id=${wresId}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()

        // Update cache
        apiCache.branches = data
        apiCache.timestamp.branches = now

        if (data.status === 200 && data.result?.branches) {
          // Process branches
          const processedBranches = data.result.branches.map((branch: Branch) => {
            return {
              ...branch,
              isOpen: true, // Simplify by assuming all branches are open
              openHours: "00:00 AM - 11:59 PM", // Default hours
            }
          })

          setBranches(processedBranches)
        } else {
          // If API fails, use placeholder branches
          setBranches(getPlaceholderBranches())
        }
      } catch (error) {
        console.error("Error fetching branches:", error)
        setBranchesError("Failed to load branch data.")

        // Use placeholder branches on error
        setBranches(getPlaceholderBranches())
      } finally {
        setIsBranchesLoading(false)
      }
    },
    [wresId],
  )

  // Helper function to get placeholder branches
  const getPlaceholderBranches = useCallback(() => {
    return [
      {
        id: 18,
        r_id: 18,
        address: "Bank Square Market",
        location: "Model Town",
        city: "Lahore",
        country: "Pakistan",
        phoneno: "0300-4884338",
        lat: "31.487991808032685",
        lng: "74.32601910084486",
        status: "1",
        email: "",
        delivery: 1,
        pickup: 1,
        reservation: 0,
        delivery_service: 0,
        time_zone: "+05:00",
        settings: "",
        delivery_settings: "",
        email_settings: "",
        sms_settings: "",
        timing: "",
        isOpen: true,
        openHours: "00:00 AM - 11:59 PM",
        minimumSpend: 500, // Add minimum spend
      },
      {
        id: 19,
        r_id: 18,
        address: "Johar Town",
        location: "G Block",
        city: "Lahore",
        country: "Pakistan",
        phoneno: "0300-1234567",
        lat: "31.4701",
        lng: "74.2701",
        status: "1",
        email: "",
        delivery: 0,
        pickup: 1,
        reservation: 0,
        delivery_service: 0,
        time_zone: "+05:00",
        settings: "",
        delivery_settings: "",
        email_settings: "",
        sms_settings: "",
        timing: "",
        isOpen: true,
        openHours: "09:00 AM - 10:00 PM",
        minimumSpend: 300, // Add minimum spend
      },
      {
        id: 20,
        r_id: 18,
        address: "DHA",
        location: "Phase 5",
        city: "Lahore",
        country: "Pakistan",
        phoneno: "0300-9876543",
        lat: "31.4801",
        lng: "74.3801",
        status: "1",
        email: "",
        delivery: 1,
        pickup: 0,
        reservation: 0,
        delivery_service: 0,
        time_zone: "+05:00",
        settings: "",
        delivery_settings: "",
        email_settings: "",
        sms_settings: "",
        timing: "",
        isOpen: true,
        openHours: "10:00 AM - 11:00 PM",
        minimumSpend: 700, // Add minimum spend
      },
    ]
  }, [])

  // Step 1: Fetch theme data first
  useEffect(() => {
    fetchThemeData()
  }, [fetchThemeData])

  // Step 2: Fetch products and branches after theme data is loaded
  useEffect(() => {
    // Only proceed if we have a wresId
    if (!wresId || isThemeLoading) return

    // Fetch both products and branches in parallel, but skip products if skipProductsApi is true
    Promise.all([skipProductsApi ? Promise.resolve() : fetchProducts(), fetchBranches()])
  }, [wresId, isThemeLoading, fetchProducts, fetchBranches, skipProductsApi])

  // Calculate productsByCategory - memoize to prevent recalculation on every render
  const productsByCategory = useMemo(() => {
    return categories.reduce(
      (acc, category) => {
        acc[category.category_id] = products.filter((product) => product.menu_cat_id === category.category_id)
        return acc
      },
      {} as Record<string, Product[]>,
    )
  }, [categories, products])

  // Overall loading state
  const isLoading = isThemeLoading || isProductsLoading || isBranchesLoading

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      // Theme data
      themeData,
      bannerImages,
      logoImage,
      faviconUrl,
      brandName,
      wresId,

      // Products data
      products,
      categories,
      featuredItems,
      productsByCategory,
      currency,

      // Branches data
      branches,

      // Loading states
      isThemeLoading,
      isProductsLoading,
      isBranchesLoading,
      isLoading,

      // Errors
      themeError,
      productsError,
      branchesError,

      // Refetch methods
      refetchTheme: () => fetchThemeData(true),
      refetchProducts: () => fetchProducts(true),
      refetchBranches: () => fetchBranches(true),
    }),
    [
      themeData,
      bannerImages,
      logoImage,
      faviconUrl,
      brandName,
      wresId,
      products,
      categories,
      featuredItems,
      productsByCategory,
      currency,
      branches,
      isThemeLoading,
      isProductsLoading,
      isBranchesLoading,
      themeError,
      productsError,
      branchesError,
      fetchThemeData,
      fetchProducts,
      fetchBranches,
    ],
  )

  return <ApiContext.Provider value={contextValue}>{children}</ApiContext.Provider>
}

export function useApi() {
  const context = useContext(ApiContext)
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider")
  }
  return context
}

// Specialized hooks that use the central API context
export function useThemeData() {
  const {
    themeData,
    bannerImages,
    logoImage,
    faviconUrl,
    brandName,
    wresId,
    isThemeLoading,
    themeError,
    refetchTheme,
  } = useApi()

  return {
    themeData,
    bannerImages,
    logoImage,
    faviconUrl,
    brandName,
    wresId,
    isLoading: isThemeLoading,
    error: themeError,
    refetch: refetchTheme,
  }
}

export function useProductsData() {
  const {
    products,
    categories,
    featuredItems,
    productsByCategory,
    currency,
    isProductsLoading,
    productsError,
    refetchProducts,
  } = useApi()

  return {
    products,
    categories,
    featuredItems,
    productsByCategory,
    currency,
    isLoading: isProductsLoading,
    error: productsError,
    refetch: refetchProducts,
  }
}

export function useBranchesData() {
  const { branches, isBranchesLoading, branchesError, refetchBranches } = useApi()

  return {
    branches,
    isLoading: isBranchesLoading,
    error: branchesError,
    refetch: refetchBranches,
  }
}
