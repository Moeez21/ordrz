import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get wres_id from query parameters
    const url = new URL(request.url)
    const wresId = url.searchParams.get("wres_id") || "18" // Default to 18 if not provided

    console.log(`Fetching branch data for wres_id: ${wresId}`)
    const response = await fetch(
      `https://d9gwfwdle3.execute-api.us-east-1.amazonaws.com/prod/v1/business/${wresId}/locations`,
    )

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Branch API response:", data)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching branch data:", error)
    return NextResponse.json({ error: "Failed to fetch branch data" }, { status: 500 })
  }
}
