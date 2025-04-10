"use client"

import { useThemeData } from "@/context/api-context"

export function SharedFooter() {
  const { brandName } = useThemeData()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black text-white py-3 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-sm">
        <div>
          © {currentYear} {brandName}
        </div>
        <div>Powered by ORDRZ</div>
      </div>
    </footer>
  )
}
