export interface ThemeSlider {
  status: number | string
  source: string
  brand: string | null
  category: string | null
  menu_item: string | null
  design: string | null
  image_url: string
  page_url: string | null
  datetime_from: string | null
  datetime_to: string | null
}

export interface ThemeColor {
  header_font_color: string
  header_bg: string
  body_font_color: string
  body_bg: string
  button_font_color: string
  button_bg: string
  button_radius: string
  product_card: {
    font_color: string
    desc_color: string
    background_color: string
    border_color: string
    border_radius: string
  }
}

export interface ThemeSettings {
  favicon?: string
  logo_image?: string
  title_background_image?: string
  brand_name?: string
  currency?: string
  theme_settings?: string
  wres_id?: string | number
  id?: string | number
  theme?: {
    slider: ThemeSlider[]
    color?: ThemeColor
  }
}

export interface ThemeResponse {
  status: number
  message: string
  result: ThemeSettings
}
