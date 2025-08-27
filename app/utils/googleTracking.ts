// Google tracking parameter generators for realistic fake Google experience

/**
 * Generate a realistic Google Click ID (gclid)
 * Format: CjwKCAiA... (typically 90-100 characters)
 */
export function generateGclid(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
  const prefixes = ["CjwKCAiA", "EAIaIQob", "CjwKEAjw", "EAIaIQoB"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]

  let result = prefix
  for (let i = 0; i < 85; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate Google Analytics Client ID
 * Format: 1234567890.1234567890 (timestamp-like)
 */
export function generateGoogleClientId(): string {
  const timestamp1 = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 31536000) // Random time in past year
  const timestamp2 = Math.floor(Date.now() / 1000)
  return `${timestamp1}.${timestamp2}`
}

/**
 * Generate Google Analytics Cookie Value (_ga)
 * Format: GA1.2.906301740.1756182008
 * GA1 = Google Analytics identifier
 * 2 = Domain depth (1 = top-level, 2 = subdomain, 3+ = deeper)
 * 906301740 = Random client identifier
 * 1756182008 = First visit timestamp
 */
export function generateGoogleAnalyticsCookie(domainDepth: number = 2): string {
  const randomClientId = Math.floor(Math.random() * 900000000) + 100000000 // 9-digit random number
  const firstVisitTimestamp = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 31536000) // Random time in past year

  return `GA1.${domainDepth}.${randomClientId}.${firstVisitTimestamp}`
}

/**
 * Generate Google Analytics Session Cookie (_gid)
 * Format: GA1.2.123456789.1756182008
 * Similar to _ga but for session tracking (24-hour expiry)
 */
export function generateGoogleAnalyticsSessionCookie(domainDepth: number = 2): string {
  const randomSessionId = Math.floor(Math.random() * 900000000) + 100000000
  const sessionStartTimestamp = Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400) // Random time in past day

  return `GA1.${domainDepth}.${randomSessionId}.${sessionStartTimestamp}`
}

/**
 * Generate Google Analytics Consent Cookie (_gac_<property-id>)
 * Format: 1.1756182008.CjwKCAiA... (consent status + timestamp + gclid)
 */
export function generateGoogleAnalyticsConsentCookie(): string {
  const consentStatus = Math.random() > 0.8 ? "0" : "1" // 80% consent rate
  const consentTimestamp = Math.floor(Date.now() / 1000)
  const gclid = generateGclid()

  return `${consentStatus}.${consentTimestamp}.${gclid}`
}

/**
 * Generate all Google Analytics cookies for a domain
 */
export function generateGoogleAnalyticsCookies(domain: string = window?.location?.hostname || "localhost") {
  // Determine domain depth
  const domainParts = domain.split(".")
  const domainDepth = Math.max(domainParts.length - 1, 1) // At least 1

  const gaPropertyId = generateGoogleAnalyticsId(true).replace("G-", "")

  const cookies: Record<string, string> = {
    _ga: generateGoogleAnalyticsCookie(domainDepth),
    _gid: generateGoogleAnalyticsSessionCookie(domainDepth),
    [`_gac_${gaPropertyId}`]: generateGoogleAnalyticsConsentCookie(),
    _gat: "1", // Google Analytics throttle cookie (short-lived)
  }

  // Add GA4 property-specific cookie
  cookies[`_ga_${gaPropertyId}`] = generateGoogleAnalyticsCookie(domainDepth)

  return cookies
}

/**
 * Generate Google Analytics Measurement ID
 * Format: G-XXXXXXXXXX (GA4) or UA-XXXXXXXX-X (Universal Analytics)
 */
export function generateGoogleAnalyticsId(useGA4: boolean = true): string {
  if (useGA4) {
    // GA4 format: G-XXXXXXXXXX
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = "G-"
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  } else {
    // Universal Analytics format: UA-XXXXXXXX-X
    const accountId = Math.floor(Math.random() * 99999999) + 10000000
    const propertyId = Math.floor(Math.random() * 9) + 1
    return `UA-${accountId}-${propertyId}`
  }
}

/**
 * Generate Google Ads Customer ID
 * Format: 123-456-7890
 */
export function generateGoogleAdsCustomerId(): string {
  const part1 = Math.floor(Math.random() * 900) + 100
  const part2 = Math.floor(Math.random() * 900) + 100
  const part3 = Math.floor(Math.random() * 9000) + 1000
  return `${part1}-${part2}-${part3}`
}

/**
 * Generate Google Tag Manager ID
 * Format: GTM-XXXXXXX
 */
export function generateGoogleTagManagerId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "GTM-"
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate Google User ID (for signed-in users)
 * Format: 116825000000000000000 (21-digit number)
 */
export function generateGoogleUserId(): string {
  let result = "1168" // Common prefix for Google User IDs
  for (let i = 0; i < 17; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

/**
 * Generate Google Session ID
 * Format: timestamp-based session identifier
 */
export function generateGoogleSessionId(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000000)
  return `${timestamp}.${random}`
}

/**
 * Generate Google Ads Conversion ID
 * Format: AW-123456789/AbCdEfGhIj_12345
 */
export function generateGoogleConversionId(): string {
  const conversionId = Math.floor(Math.random() * 9000000000) + 1000000000
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let label = ""
  for (let i = 0; i < 10; i++) {
    label += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const suffix = Math.floor(Math.random() * 90000) + 10000
  return `AW-${conversionId}/${label}_${suffix}`
}

/**
 * Generate Google Advertising ID (GAID) for mobile
 * Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID format)
 * Platform: Android devices only
 */
export function generateGoogleAdvertisingId(): string {
  const hex = "0123456789abcdef"
  let result = ""

  // Generate 8-4-4-4-12 format (32 hex characters + 4 hyphens)
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      result += "-"
    }
    result += hex[Math.floor(Math.random() * 16)]
  }

  return result
}

/**
 * Generate Apple IDFA (Identifier for Advertisers) for iOS
 * Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID format)
 * Platform: iOS devices only
 */
export function generateAppleIDFA(): string {
  const hex = "0123456789ABCDEF" // Apple typically uses uppercase
  let result = ""

  // Generate 8-4-4-4-12 format (32 hex characters + 4 hyphens)
  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 12 || i === 16 || i === 20) {
      result += "-"
    }
    result += hex[Math.floor(Math.random() * 16)]
  }

  return result
}

/**
 * Detect device type and generate appropriate mobile advertising ID
 */
export function generateMobileAdvertisingId(): { type: "GAID" | "IDFA" | "WEB"; id: string } {
  if (typeof window === "undefined") {
    return { type: "WEB", id: "N/A" }
  }

  const userAgent = window.navigator.userAgent.toLowerCase()

  if (userAgent.includes("android")) {
    return { type: "GAID", id: generateGoogleAdvertisingId() }
  } else if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    return { type: "IDFA", id: generateAppleIDFA() }
  } else {
    return { type: "WEB", id: "N/A" }
  }
}

/**
 * Get or generate persistent mobile advertising ID (stored in localStorage)
 */
export function getMobileAdvertisingId(): { type: "GAID" | "IDFA" | "WEB"; id: string } {
  if (typeof window === "undefined") {
    return { type: "WEB", id: "N/A" }
  }

  const stored = localStorage.getItem("_mobile_ad_id")
  const storedType = localStorage.getItem("_mobile_ad_type") as "GAID" | "IDFA" | "WEB"

  if (stored && storedType) {
    return { type: storedType, id: stored }
  }

  const generated = generateMobileAdvertisingId()
  localStorage.setItem("_mobile_ad_id", generated.id)
  localStorage.setItem("_mobile_ad_type", generated.type)

  return generated
}

/**
 * Generate Google Broad Match Click ID (gbraid)
 * Format: 0A... (shorter than gclid)
 */
export function generateGbraid(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = "0A"
  for (let i = 0; i < 25; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate Web-to-App Broad Match Click ID (wbraid)
 * Format: 1t... (similar to gbraid)
 */
export function generateWbraid(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = "1t"
  for (let i = 0; i < 25; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate Google VED parameter (result tracking)
 * Format: 2ahUKEwi... (base64-like)
 */
export function generateVed(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const prefixes = ["2ahUKEwi", "2ahUKEwj", "0ahUKEwi", "2ahUKEwg"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]

  let result = prefix
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate Event ID (ei)
 * Format: timestamp-based with random suffix
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

/**
 * Generate User Action Code (uact)
 * Common values for search: 8, 5, 3
 */
export function generateUact(): string {
  const values = ["8", "5", "3"]
  return values[Math.floor(Math.random() * values.length)]
}

/**
 * Generate browser dimensions
 */
export function getBrowserDimensions() {
  if (typeof window !== "undefined") {
    return {
      biw: window.innerWidth || 1920,
      bih: window.innerHeight || 1080,
    }
  }
  // Default dimensions for server-side
  return {
    biw: 1920,
    bih: 1080,
  }
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio(): number {
  if (typeof window !== "undefined") {
    return window.devicePixelRatio || 1
  }
  return 1
}

/**
 * Get or generate persistent Google Client ID (stored in localStorage)
 */
export function getGoogleClientId(): string {
  if (typeof window === "undefined") return generateGoogleClientId()

  const stored = localStorage.getItem("_ga_client_id")
  if (stored) return stored

  const newClientId = generateGoogleClientId()
  localStorage.setItem("_ga_client_id", newClientId)
  return newClientId
}

/**
 * Get or generate persistent Google Session ID (stored in sessionStorage)
 */
export function getGoogleSessionId(): string {
  if (typeof window === "undefined") return generateGoogleSessionId()

  const stored = sessionStorage.getItem("_ga_session_id")
  if (stored) return stored

  const newSessionId = generateGoogleSessionId()
  sessionStorage.setItem("_ga_session_id", newSessionId)
  return newSessionId
}

/**
 * Generate realistic Google search URL parameters with IDs
 */
export function generateGoogleSearchParams(query: string, isAdClick: boolean = false) {
  const params = new URLSearchParams()

  // Core search parameters
  params.set("q", query)
  params.set("source", "hp") // Homepage search
  params.set("ei", generateEventId())
  params.set("uact", generateUact())

  // Google IDs for tracking
  params.set("gs_ssp", generateGoogleSessionId()) // Google Search Session Parameter
  params.set("oq", query) // Original query

  // Browser info
  const { biw, bih } = getBrowserDimensions()
  params.set("biw", biw.toString())
  params.set("bih", bih.toString())
  params.set("dpr", getDevicePixelRatio().toString())

  // Search action
  params.set("sa", "X") // Search action type

  // Add client ID for analytics
  params.set("cid", getGoogleClientId())

  // Add result tracking for organic results
  if (!isAdClick) {
    params.set("ved", generateVed())
  }

  return params
}

/**
 * Add Google tracking parameters to an ad click URL
 */
export function addGoogleTrackingToAdUrl(originalUrl: string, keyword: string, adIndex: number = 0): string {
  try {
    const url = new URL(originalUrl)

    // Add gclid (most important for ad tracking)
    url.searchParams.set("gclid", generateGclid())

    // Randomly add gbraid or wbraid (modern Google tracking)
    if (Math.random() > 0.7) {
      if (Math.random() > 0.5) {
        url.searchParams.set("gbraid", generateGbraid())
      } else {
        url.searchParams.set("wbraid", generateWbraid())
      }
    }

    // Add Google Ads specific parameters
    url.searchParams.set("gclsrc", "aw.ds") // Google Ads source

    // Add campaign tracking (if not already present)
    if (!url.searchParams.has("utm_term")) {
      url.searchParams.set("utm_term", keyword)
    }

    // Add ad position for more realistic tracking
    url.searchParams.set("adpos", (adIndex + 1).toString())

    // Add mobile advertising ID if on mobile
    const mobileAdId = getMobileAdvertisingId()
    if (mobileAdId.type === "GAID") {
      url.searchParams.set("gaid", mobileAdId.id)
    } else if (mobileAdId.type === "IDFA") {
      url.searchParams.set("idfa", mobileAdId.id)
    }

    return url.toString()
  } catch {
    // If URL parsing fails, return original with basic gclid
    const separator = originalUrl.includes("?") ? "&" : "?"
    return `${originalUrl}${separator}gclid=${generateGclid()}&gclsrc=aw.ds&utm_term=${encodeURIComponent(keyword)}`
  }
}

/**
 * Add organic result tracking to URL
 */
export function addOrganicTrackingToUrl(originalUrl: string, query: string, resultIndex: number): string {
  try {
    const url = new URL(originalUrl)

    // Add Google organic tracking
    url.searchParams.set("ved", generateVed())
    url.searchParams.set("uact", generateUact())
    url.searchParams.set("source", "web")

    // Add query context for analytics
    url.searchParams.set("q", query)
    url.searchParams.set("pos", resultIndex.toString())

    return url.toString()
  } catch {
    // If URL parsing fails, return original
    return originalUrl
  }
}

/**
 * Update the current page URL with realistic Google search parameters
 */
export function updatePageUrlWithGoogleParams(query: string) {
  if (typeof window === "undefined") return

  const url = new URL(window.location.href)
  const searchParams = generateGoogleSearchParams(query)

  // Clear existing params and add Google ones
  url.search = ""
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  window.history.pushState({}, "", url.toString())
}

/**
 * Generate realistic Google referrer for external links
 */
export function generateGoogleReferrer(query: string): string {
  const params = generateGoogleSearchParams(query)
  return `https://www.google.com/search?${params.toString()}`
}

/**
 * Add Google Analytics and tracking IDs to page head
 */
export function addGoogleTrackingToPage() {
  if (typeof window === "undefined") return

  const gaId = generateGoogleAnalyticsId(true) // Use GA4
  const gtmId = generateGoogleTagManagerId()
  const clientId = getGoogleClientId()

  // Add Google Analytics script
  const gaScript = document.createElement("script")
  gaScript.async = true
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
  document.head.appendChild(gaScript)

  // Add GA configuration script
  const configScript = document.createElement("script")
  configScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}', {
      client_id: '${clientId}',
      custom_map: {'custom_parameter_1': 'gclid'}
    });
  `
  document.head.appendChild(configScript)

  // Add GTM script
  const gtmScript = document.createElement("script")
  gtmScript.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${gtmId}');
  `
  document.head.appendChild(gtmScript)

  // Store IDs for reference
  window._fakeGoogleIds = {
    gaId,
    gtmId,
    clientId,
    adsCustomerId: generateGoogleAdsCustomerId(),
    conversionId: generateGoogleConversionId(),
  }
}

/**
 * Track ad click event with Google Analytics
 */
export function trackAdClick(adTitle: string, keyword: string, gclid: string) {
  if (typeof window === "undefined" || !window.gtag) return

  window.gtag("event", "ad_click", {
    event_category: "advertising",
    event_label: adTitle,
    keyword: keyword,
    gclid: gclid,
    value: 1,
  })
}

/**
 * Track organic search result click
 */
export function trackOrganicClick(title: string, url: string, position: number) {
  if (typeof window === "undefined" || !window.gtag) return

  window.gtag("event", "search_result_click", {
    event_category: "search",
    event_label: title,
    result_url: url,
    result_position: position,
    value: 1,
  })
}

/**
 * Get all current Google tracking IDs for display/debugging
 */
export function getAllGoogleIds() {
  const mobileAdId = getMobileAdvertisingId()

  const baseIds = {
    clientId: getGoogleClientId(),
    sessionId: getGoogleSessionId(),
    gaId: generateGoogleAnalyticsId(true),
    adsCustomerId: generateGoogleAdsCustomerId(),
    gtmId: generateGoogleTagManagerId(),
    conversionId: generateGoogleConversionId(),
    userId: generateGoogleUserId(),
    mobileAdId: mobileAdId.id,
    mobileAdType: mobileAdId.type,
  }

  // Include runtime IDs if available
  if (typeof window !== "undefined" && window._fakeGoogleIds) {
    return { ...baseIds, ...window._fakeGoogleIds }
  }

  return baseIds
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: Record<string, unknown>[]
    _fakeGoogleIds?: {
      gaId: string
      gtmId: string
      clientId: string
      adsCustomerId: string
      conversionId: string
    }
  }
}
