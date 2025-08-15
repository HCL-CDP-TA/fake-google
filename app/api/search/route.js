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
      // If no items from Google API, use localized fallback
      const localizedResults = getLocalizedFallbackResults(q, gl, lr, hl, location)
      return Response.json(localizedResults)
    }

    // Mix Google results with some localized results to make country selection more obvious
    const googleResults = data.items.map(item => ({
      title: item.title,
      url: item.link,
      description: item.snippet || "No description available",
      favicon: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.["og:image"] || null,
    }))

    // Add localized results at the beginning if country is not US
    if (gl && gl !== "us") {
      const localizedResults = getLocalizedFallbackResults(q, gl, lr, hl, location)
      return Response.json([...localizedResults.slice(0, 2), ...googleResults.slice(0, 8)])
    }

    return Response.json(googleResults)
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
    us: { domain: "com", lang: "en", region: "United States", currency: "USD", tld: ".com" },
    uk: { domain: "co.uk", lang: "en", region: "United Kingdom", currency: "GBP", tld: ".co.uk" },
    ca: { domain: "ca", lang: "en", region: "Canada", currency: "CAD", tld: ".ca" },
    au: { domain: "com.au", lang: "en", region: "Australia", currency: "AUD", tld: ".com.au" },
    de: { domain: "de", lang: "de", region: "Germany", currency: "EUR", tld: ".de" },
    fr: { domain: "fr", lang: "fr", region: "France", currency: "EUR", tld: ".fr" },
    es: { domain: "es", lang: "es", region: "Spain", currency: "EUR", tld: ".es" },
    it: { domain: "it", lang: "it", region: "Italy", currency: "EUR", tld: ".it" },
    jp: { domain: "co.jp", lang: "ja", region: "Japan", currency: "JPY", tld: ".co.jp" },
    br: { domain: "com.br", lang: "pt", region: "Brazil", currency: "BRL", tld: ".com.br" },
    mx: { domain: "com.mx", lang: "es", region: "Mexico", currency: "MXN", tld: ".com.mx" },
    in: { domain: "co.in", lang: "en", region: "India", currency: "INR", tld: ".co.in" },
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
      title: `${q} ${country.region} - Local ${country.tld} Results`,
      url: `https://www.google.${country.domain}/search?q=${encodeURIComponent(q)}${
        location ? `+${encodeURIComponent(location)}` : ""
      }`,
      description: `🌍 Regional results for "${q}" in ${country.region}. Prices in ${country.currency}${
        language !== "en" ? ` • Content in ${langName}` : ""
      }${locationSuffix}.`,
      favicon: "https://www.google.com/favicon.ico",
    },
    {
      title: `${q} Near Me - ${country.region} Locations`,
      url: `https://maps.google.${country.domain}/search/${encodeURIComponent(q)}${
        location ? `+${encodeURIComponent(location)}` : ""
      }`,
      description: `📍 Find "${q}" businesses in ${country.region}${locationSuffix}. Local reviews, opening hours, and contact details. Currency: ${country.currency}.`,
      favicon: "https://maps.google.com/favicon.ico",
    },
    {
      title: `${q} - ${country.region} Wikipedia${language !== "en" ? ` (${langName})` : ""}`,
      url: `https://${language}.wikipedia.org/wiki/${encodeURIComponent(q.replace(/ /g, "_"))}`,
      description: `📚 ${country.region}-focused information about "${q}"${
        language !== "en" ? ` in ${langName}` : ""
      }. Regional context and local references included.`,
      favicon: "https://en.wikipedia.org/static/favicon/wikipedia.ico",
    },
    {
      title: `${q} News - ${country.region} Coverage`,
      url: `https://news.google.${country.domain}/search?q=${encodeURIComponent(q)}${
        location ? `+${encodeURIComponent(location)}` : ""
      }`,
      description: `📰 Latest "${q}" news from ${country.region}${locationSuffix}${
        language !== "en" ? ` in ${langName}` : ""
      }. Local media coverage and regional updates.`,
      favicon: "https://ssl.gstatic.com/news/img/favicon_news.ico",
    },
  ]
}
