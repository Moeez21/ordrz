import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url)
    const itemId = url.searchParams.get("item_id")
    const wresId = url.searchParams.get("business_id") || "18" // Default to 18 if not provided

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    console.log(`Fetching product details for item_id: ${itemId}, business_id: ${wresId}`)
    const response = await fetch(`https://tossdown.com/api/product_details?business_id=${wresId}&item_id=${itemId}`)

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching product details:", error)
    return NextResponse.json({ error: "Failed to fetch product details" }, { status: 500 })
  }
}
