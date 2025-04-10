export interface Branch {
  id: number
  r_id: number
  address: string
  location: string
  country: string
  city: string
  phoneno: string
  lat: string
  lng: string
  status: string
  email: string
  delivery: number
  pickup: number
  reservation: number
  delivery_service: number
  time_zone: string
  settings: string
  delivery_settings: string
  email_settings: string
  sms_settings: string
  timing: string
  isOpen?: boolean
  openHours?: string
  minimumSpend?: number
}

export interface BranchResponse {
  status: number
  message: string
  result: {
    name: string
    logo: string
    currencycode: string
    branches: Branch[]
    [key: string]: any
  }
}
