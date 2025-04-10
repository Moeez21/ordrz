import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Fetching theme data from API...")
    const response = await fetch(
      "https://td0c8x9qb3.execute-api.us-east-1.amazonaws.com/prod/v1/business/theme/sholay/flag/0",
    )

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()

    // Log the entire response structure for debugging
    console.log("Theme API complete response structure:", JSON.stringify(data, null, 2))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching theme data:", error)
    return NextResponse.json({ error: "Failed to fetch theme data" }, { status: 500 })
  }
}
