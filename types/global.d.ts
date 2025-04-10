// Add TypeScript declaration for window.businessInfo
interface Window {
  businessInfo: {
    cartId: string
    businessId: string
    orderType: string
    branchId: string
    source: string
    theme: {
      header_bg: string
      header_font_color: string
      button_bg: string
      button_font_color: string
      button_radius: string
    }
    userLocation: {
      lat: string
      lng: string
    }
    orderSchedule?: {
      date: string
      time: string
    }
    websiteLink: string
    [key: string]: any
  }
}
