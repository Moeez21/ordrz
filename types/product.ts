export interface ProductImage {
  image_thumbnail: string
  image: string
  image_id: string | null
  image_position: string | null
}

export interface ProductOption {
  menu_item_id: string
  id: string
  name: string
  flag: string
  quantity: string
  min_quantity: string
  items: Array<{
    id: string
    cat_id: string
    name: string
    price: string
    flag: string
    image: string
    sku: string
    discount: string
    weight: string
    weight_value: string
    weight_unit: string
    items: any[]
  }>
}

export interface Product {
  name: string
  menu_item_id: string
  menu_cat_id: string
  price: string
  currency: string
  desc: string
  category: string
  image: string
  large_image: string
  featured: string
  discount: string
  discount_value: string
  discount_display: string
  options: ProductOption[]
  images: ProductImage[]
  originalPrice?: string
}

export interface Category {
  category_id: string
  category_name: string
  image: string
  image_thumbnail: string
  item_count: string
}

export interface ApiResponse {
  status: string
  items: Product[]
  categories: Category[]
  info: {
    logo: string
    currency: string
  }
}
