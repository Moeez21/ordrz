import { setCookie } from "./cookies"

export function setUserLocation(latitude: number, longitude: number) {
  setCookie("userLatitude", latitude.toString())
  setCookie("userLongitude", longitude.toString())
}

export function getUserLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject)
  })
}

export async function requestAndStoreUserLocation(): Promise<boolean> {
  try {
    const position = await getUserLocation()
    setUserLocation(position.coords.latitude, position.coords.longitude)
    return true
  } catch (error) {
    console.error("Error getting user location:", error)
    return false
  }
}
