import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get wres_id from query parameters
    const url = new URL(request.url)
    const wresId = url.searchParams.get("wres_id") || "18" // Default to 18 if not provided

    console.log(`Fetching products for wres_id: ${wresId}`)
    const response = await fetch(`https://tossdown.com/api/products?business_id=${wresId}`)

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
