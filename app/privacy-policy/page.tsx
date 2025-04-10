import { Suspense } from "react"
import { ApiProvider } from "@/context/api-context"
import { ThemeProvider } from "@/context/theme-context"
import { OrderPreferencesProvider } from "@/context/order-preferences-context"
import { CartProvider } from "@/context/cart-context"
import { SharedHeader } from "@/components/shared-header"
import { SharedFooter } from "@/components/shared-footer"

export default function PrivacyPolicyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ApiProvider>
        <ThemeProvider>
          <OrderPreferencesProvider>
            <CartProvider currency="PKR">
              <div className="min-h-screen flex flex-col">
                <SharedHeader />
                <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
                  <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                  <div className="prose max-w-none">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <h2>1. Introduction</h2>
                    <p>
                      Welcome to our Privacy Policy. This document explains how we collect, use, and protect your
                      personal information when you use our services.
                    </p>
                    <h2>2. Information We Collect</h2>
                    <p>
                      We collect information you provide directly to us, such as your name, contact information,
                      delivery address, and payment details when you place an order.
                    </p>
                    <h2>3. How We Use Your Information</h2>
                    <p>
                      We use your information to process and deliver your orders, communicate with you about your
                      orders, and improve our services.
                    </p>
                    <h2>4. Information Sharing</h2>
                    <p>
                      We may share your information with delivery partners, payment processors, and other service
                      providers to fulfill your orders.
                    </p>
                    <h2>5. Data Security</h2>
                    <p>
                      We implement appropriate security measures to protect your personal information from unauthorized
                      access, alteration, or disclosure.
                    </p>
                    <h2>6. Your Rights</h2>
                    <p>
                      You have the right to access, correct, or delete your personal information. Please contact us if
                      you wish to exercise these rights.
                    </p>
                    <h2>7. Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us.</p>
                  </div>
                </main>
                <SharedFooter />
              </div>
            </CartProvider>
          </OrderPreferencesProvider>
        </ThemeProvider>
      </ApiProvider>
    </Suspense>
  )
}
