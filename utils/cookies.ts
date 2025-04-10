// Set a cookie with a specified expiration time
export function setCookie(name: string, value: string, days = 30) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = "; expires=" + date.toUTCString()
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/"

  // Also store in localStorage as a backup
  if (typeof window !== "undefined") {
    localStorage.setItem(name, value)
  }
}

// Get a cookie by name
export function getCookie(name: string): string | null {
  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length))
  }

  // If not found in cookies, try localStorage
  if (typeof window !== "undefined") {
    const localValue = localStorage.getItem(name)
    if (localValue) return localValue
  }

  return null
}

// Delete a cookie by name
export function deleteCookie(name: string) {
  setCookie(name, "", -1)

  // Also remove from localStorage
  if (typeof window !== "undefined") {
    localStorage.removeItem(name)
  }
}
