export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const gl = searchParams.get("gl") // Country/region (e.g., 'us', 'uk', 'ca', 'au', 'de', 'fr')
  const lr = searchParams.get("lr") // Language restriction (e.g., 'lang_en', 'lang_es', 'lang_fr')
  const hl = searchParams.get("hl") // Interface language (e.g., 'en', 'es', 'fr', 'de')
  const location = searchParams.get("location") // Location for local results (e.g., 'New York', 'London')

  if (!q) {
    return Response.json({ error: "Query parameter required" }, { status: 400 })
  }

  try {
    // Use Google Custom Search API
    const apiKey = process.env.GOOGLE_API_KEY
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

    if (!apiKey || !searchEngineId) {
      // Fallback to demo results if API not configured
      const localizedResults = getLocalizedFallbackResults(q, gl, lr, hl, location)
      return Response.json(localizedResults)
    }

    // Build API URL with localization parameters
    const apiUrl = new URL("https://www.googleapis.com/customsearch/v1")
    apiUrl.searchParams.set("key", apiKey)
    apiUrl.searchParams.set("cx", searchEngineId)
    apiUrl.searchParams.set("q", q)
    apiUrl.searchParams.set("num", "10")

    // Add localization parameters if provided
    if (gl) apiUrl.searchParams.set("gl", gl) // Country/region
    if (lr) apiUrl.searchParams.set("lr", lr) // Language restriction
    if (hl) apiUrl.searchParams.set("hl", hl) // Interface language
    if (location) {
      // For location-based search, modify the query
      apiUrl.searchParams.set("q", `${q} ${location}`)
    }

    const response = await fetch(apiUrl.toString())

    if (!response.ok) {
      throw new Error("Google API request failed")
    }

    const data = await response.json()

    if (!data.items) {
      return Response.json([])
    }

    const results = data.items.map(item => ({
      title: item.title,
      url: item.link,
      description: item.snippet || "No description available",
      favicon: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.["og:image"] || null,
    }))

    return Response.json(results)
  } catch (error) {
    console.error("Error fetching search results:", error)

    // Fallback to demo results on error
    const localizedResults = getLocalizedFallbackResults(q, gl, lr, hl, location)
    return Response.json(localizedResults)
  }
}

// Helper function to generate localized fallback results
function getLocalizedFallbackResults(q, gl, lr, hl, location) {
  const countryData = {
    us: { domain: "com", lang: "en", region: "United States" },
    uk: { domain: "co.uk", lang: "en", region: "United Kingdom" },
    ca: { domain: "ca", lang: "en", region: "Canada" },
    au: { domain: "com.au", lang: "en", region: "Australia" },
    de: { domain: "de", lang: "de", region: "Germany" },
    fr: { domain: "fr", lang: "fr", region: "France" },
    es: { domain: "es", lang: "es", region: "Spain" },
    it: { domain: "it", lang: "it", region: "Italy" },
    jp: { domain: "co.jp", lang: "ja", region: "Japan" },
    br: { domain: "com.br", lang: "pt", region: "Brazil" },
    mx: { domain: "com.mx", lang: "es", region: "Mexico" },
    in: { domain: "co.in", lang: "en", region: "India" },
  }

  const languageNames = {
    en: "English",
    de: "German",
    fr: "French",
    es: "Spanish",
    it: "Italian",
    ja: "Japanese",
    pt: "Portuguese",
    zh: "Chinese",
    ru: "Russian",
    ar: "Arabic",
  }

  const country = countryData[gl] || countryData.us
  const language = hl || country.lang
  const langName = languageNames[language] || "English"

  const locationSuffix = location ? ` in ${location}` : gl ? ` in ${country.region}` : ""

  return [
    {
      title: `${q}${locationSuffix} - Top Results`,
      url: `https://www.google.${country.domain}/search?q=${encodeURIComponent(q)}${
        location ? `+${encodeURIComponent(location)}` : ""
      }`,
      description: `Comprehensive information about "${q}"${locationSuffix}. Find local businesses, reviews, and relevant content${
        language !== "en" ? ` in ${langName}` : ""
      }.`,
      favicon: "https://www.google.com/favicon.ico",
    },
    {
      title: `Local ${q} Services${locationSuffix}`,
      url: `https://maps.google.${country.domain}/search/${encodeURIComponent(q)}${
        location ? `+${encodeURIComponent(location)}` : ""
      }`,
      description: `Find local businesses and services for "${q}"${locationSuffix}. Reviews, hours, contact information, and directions.`,
      favicon: "https://maps.google.com/favicon.ico",
    },
    {
      title: `${q} - Wikipedia${language !== "en" ? ` (${langName})` : ""}`,
      url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(q.replace(/ /g, "_"))}`,
      description: `Encyclopedia article about "${q}"${
        language !== "en" ? ` in ${langName}` : ""
      }. Comprehensive background information and references.`,
      favicon: "https://en.wikipedia.org/static/favicon/wikipedia.ico",
    },
    {
      title: `News about ${q}${locationSuffix}`,
      url: `https://news.google.${country.domain}/search?q=${encodeURIComponent(q)}${
        location ? `+${encodeURIComponent(location)}` : ""
      }`,
      description: `Latest news and updates about "${q}"${locationSuffix}. Stay informed with real-time coverage${
        language !== "en" ? ` in ${langName}` : ""
      }.`,
      favicon: "https://ssl.gstatic.com/news/img/favicon_news.ico",
    },
  ]
}
