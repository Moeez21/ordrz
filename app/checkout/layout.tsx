import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout - Food Delivery",
  description: "Complete your food order",
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Add the Plus Jakarta Sans font */}
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans&display=swap" rel="stylesheet" />
      {children}
    </>
  )
}
