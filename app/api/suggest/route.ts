import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || ""

  if (!q.trim()) {
    return NextResponse.json([])
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) return NextResponse.json([])

    const data = await res.json()
    const suggestions = Array.isArray(data[1]) ? data[1].slice(0, 8) : []
    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json([])
  }
}
