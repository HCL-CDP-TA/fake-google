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
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID

    if (!apiKey || !searchEngineId) {
      console.log("Google Search API not configured:", {
        hasApiKey: !!apiKey,
        hasSearchEngineId: !!searchEngineId,
      })
      // Fallback to demo results if API not configured
      const localizedResults = getLocalizedFallbackResults(q, gl, lr, hl, location)
      return Response.json(localizedResults)
    }

    console.log("Using Google Search API for query:", q)

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

    // Add headers to satisfy referrer restrictions
    const response = await fetch(apiUrl.toString(), {
      headers: {
        Referer: "http://localhost:3000",
        "User-Agent": "Mozilla/5.0 (compatible; FakeGoogle/1.0)",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Google API request failed:", response.status, response.statusText, errorText)

      // If it's a referrer issue, log specific guidance
      if (response.status === 403 && errorText.includes("referer")) {
        console.error("🔒 API Key referrer restriction issue detected.")
        console.error("💡 Solutions:")
        console.error("   1. Remove HTTP referrer restrictions from your Google API key")
        console.error("   2. Add 'http://localhost:3000/*' to allowed referrers")
        console.error("   3. Use IP address restrictions instead")
        console.error("   4. Set Application restrictions to 'None' for development")
      }

      throw new Error(`Google API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.items) {
      console.log("No items returned from Google API, using fallback")
      // If no items from Google API, use localized fallback
      const localizedResults = getLocalizedFallbackResults(q, gl, lr, hl, location)
      return Response.json(localizedResults)
    }

    console.log(`Google API returned ${data.items.length} results`)

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
      // Mix: 2 localized + 8 Google results = 10 total
      return Response.json([...localizedResults.slice(0, 2), ...googleResults.slice(0, 8)])
    }

    // For US or no country specified, return full Google results (up to 10)
    return Response.json(googleResults.slice(0, 10))
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
      favicon: "https://www.google.com/favicon.ico",
    },
    {
      title: `Best ${q} Reviews ${country.region}`,
      url: `https://www.${q.replace(/\s+/g, "-").toLowerCase()}-reviews.${country.domain}`,
      description: `⭐ Customer reviews and ratings for "${q}" in ${country.region}. Compare options, read testimonials, and find the best choice.`,
      favicon: "https://www.google.com/favicon.ico",
    },
    {
      title: `${q} Online Store - ${country.region}`,
      url: `https://shop.${q.replace(/\s+/g, "").toLowerCase()}${country.tld}`,
      description: `🛒 Shop for "${q}" online in ${country.region}. Free shipping, secure checkout, and ${country.currency} pricing.`,
      favicon: "https://www.google.com/favicon.ico",
    },
    {
      title: `${q} Forums & Community - ${country.region}`,
      url: `https://forum.${q.replace(/\s+/g, "").toLowerCase()}${country.tld}`,
      description: `💬 Join the "${q}" community in ${country.region}. Ask questions, share experiences, and connect with other users.`,
      favicon: "https://www.google.com/favicon.ico",
    },
    {
      title: `${q} Compare Prices - ${country.region}`,
      url: `https://compare.${q.replace(/\s+/g, "-").toLowerCase()}${country.tld}`,
      description: `💰 Compare "${q}" prices from top retailers in ${country.region}. Find deals, discounts, and save money on your purchase.`,
      favicon: "https://www.google.com/favicon.ico",
    },
    {
      title: `${q} How-To Guide & Tips`,
      url: `https://guide.${q.replace(/\s+/g, "-").toLowerCase()}${country.tld}`,
      description: `📖 Complete guide to "${q}" with step-by-step instructions, tips, and expert advice for ${country.region} users.`,
      favicon: "https://www.google.com/favicon.ico",
    },
    {
      title: `${q} ${new Date().getFullYear()} - Latest Updates`,
      url: `https://www.${q.replace(/\s+/g, "-").toLowerCase()}-updates${country.tld}`,
      description: `🆕 Latest "${q}" developments and updates for ${new Date().getFullYear()}. Stay informed about new features and changes.`,
      favicon: "https://www.google.com/favicon.ico",
    },
  ]
}
