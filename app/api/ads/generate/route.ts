import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { keyword, displayUrl, landingUrl, numAds = 3, customPrompt } = await req.json()

    if (!keyword || !displayUrl || !landingUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check for Gemini API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey) {
      console.warn("Gemini API key not configured, using fallback ads")
      return generateFallbackAds(keyword, displayUrl, landingUrl, numAds)
    }

    // Try Gemini API first
    try {
      return await generateWithGemini(apiKey, keyword, displayUrl, landingUrl, numAds, customPrompt)
    } catch (geminiError) {
      console.error("Gemini API failed:", geminiError)
      console.log("Falling back to template-based generation")
      return generateFallbackAds(keyword, displayUrl, landingUrl, numAds)
    }
  } catch (error) {
    console.error("Error generating ads:", error)
    return NextResponse.json({ error: "Failed to generate ads" }, { status: 500 })
  }
}

function getDefaultPrompt(keyword: string, displayUrl: string, landingUrl: string, numAds: number): string {
  return `Generate ${numAds} different Google Ads for the keyword "${keyword}" with display URL "${displayUrl}" and landing URL "${landingUrl}".

Each ad should target a different audience with distinct messaging:
1. First ad: Target first-time buyers/beginners - emphasize trust, simplicity, guidance
2. Second ad: Target comparison shoppers - emphasize value, features, competitive advantages  
3. Third ad: Target established/experienced customers - emphasize premium service, exclusivity, superior results
${
  numAds > 3
    ? `${Array.from(
        { length: numAds - 3 },
        (_, i) =>
          `${i + 4}. Additional ad: Focus on ${
            ["local services", "seasonal offers", "mobile users", "social proof", "urgency/limited time"][i] ||
            "unique value proposition"
          }`,
      ).join("\n")}`
    : ""
}

For each ad, provide:
- title (max 30 chars) - Primary headline
- description (max 90 chars) - First description line
- description2 (max 90 chars) - Second description line
- target_audience (brief description for internal use)
- campaign_focus (3-4 words describing the campaign angle)

Return ONLY a valid JSON array with exactly ${numAds} ads and no additional text or formatting. Format:
[
  {
    "title": "Get Started Today",
    "description": "Perfect for beginners. Step-by-step guidance included.",
    "description2": "24/7 support available. Join thousands of satisfied customers.",
    "target_audience": "First-time buyers",
    "campaign_focus": "Beginner Friendly Guide"
  },
  {
    "title": "Compare & Save",
    "description": "Why pay more? Compare features and get the best deal.",
    "description2": "Price match guarantee. Free consultation available.",
    "target_audience": "Comparison shoppers", 
    "campaign_focus": "Value Comparison Deal"
  },
  {
    "title": "Expert Solutions",
    "description": "Advanced features for experienced users. Get superior results.",
    "description2": "Professional-grade tools. Dedicated specialist support.",
    "target_audience": "Experienced customers",
    "campaign_focus": "Expert Professional Grade"
  }
]`
}

async function generateWithGemini(
  apiKey: string,
  keyword: string,
  displayUrl: string,
  landingUrl: string,
  numAds: number = 3,
  customPrompt?: string,
) {
  // Create the prompt for Gemini - use custom prompt if provided, otherwise use default
  let prompt = customPrompt || getDefaultPrompt(keyword, displayUrl, landingUrl, numAds)

  // If using custom prompt, replace placeholders
  if (customPrompt) {
    prompt = customPrompt
      .replace(/\{keyword\}/g, keyword)
      .replace(/\{displayUrl\}/g, displayUrl)
      .replace(/\{landingUrl\}/g, landingUrl)
      .replace(/\{numAds\}/g, numAds.toString())
  }

  console.log("Generated prompt for Gemini:", prompt)
  // Call Gemini API with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      },
    )

    clearTimeout(timeoutId)

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      throw new Error(`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    const generatedText = geminiData.candidates[0]?.content?.parts[0]?.text

    if (!generatedText) {
      throw new Error("No response from Gemini API")
    }

    // Parse the JSON response from Gemini
    let ads
    try {
      // Remove any potential markdown formatting
      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, "").trim()
      ads = JSON.parse(cleanedText)
    } catch (error) {
      console.error("Failed to parse Gemini response:", error, generatedText)
      throw new Error("Invalid response format from AI")
    }

    // Validate the response structure
    if (!Array.isArray(ads) || ads.length !== 3) {
      throw new Error("Invalid response structure from AI")
    }

    // Validate each ad
    for (const ad of ads) {
      if (!ad.title || !ad.description || !ad.description2 || !ad.target_audience || !ad.campaign_focus) {
        throw new Error("Missing required ad fields from AI response")
      }

      // Validate character limits
      if (ad.title.length > 30) ad.title = ad.title.substring(0, 30)
      if (ad.description.length > 90) ad.description = ad.description.substring(0, 87) + "..."
      if (ad.description2.length > 90) ad.description2 = ad.description2.substring(0, 87) + "..."
    }

    // Generate realistic campaign names based on the focus
    const campaignNames = ads.map(ad => {
      const focus = ad.campaign_focus.replace(/\s+/g, "_").toLowerCase()
      const date = new Date().toISOString().split("T")[0]
      return `${focus}_${keyword.replace(/\s+/g, "_")}_${date}`
    })

    return NextResponse.json({
      ads,
      campaignNames,
    })
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

function generateFallbackAds(keyword: string, displayUrl: string, landingUrl: string, numAds: number = 3) {
  // Suppress lint warnings for unused params (keeping for API consistency)
  void displayUrl
  void landingUrl

  // Template-based ad generation as fallback
  const adTemplates = [
    {
      title: "Get Started Today",
      description: `Perfect for beginners. Step-by-step ${keyword} guidance.`,
      description2: "24/7 support available. Join thousands of satisfied customers.",
      target_audience: "First-time buyers",
      campaign_focus: "Beginner Friendly Guide",
    },
    {
      title: "Compare & Save",
      description: `Compare ${keyword} options and get the best deal.`,
      description2: "Price match guarantee. Free consultation available.",
      target_audience: "Comparison shoppers",
      campaign_focus: "Value Comparison Deal",
    },
    {
      title: "Expert Solutions",
      description: `Advanced ${keyword} features for experienced users.`,
      description2: "Professional-grade tools. Specialist support included.",
      target_audience: "Experienced customers",
      campaign_focus: "Expert Professional Grade",
    },
    {
      title: "Local Experts",
      description: `Find local ${keyword} specialists in your area.`,
      description2: "Same-day service available. Licensed professionals only.",
      target_audience: "Local customers",
      campaign_focus: "Local Service Area",
    },
    {
      title: "Limited Time",
      description: `Don't miss out on our ${keyword} promotion.`,
      description2: "Ends soon! Call now for exclusive pricing.",
      target_audience: "Urgent shoppers",
      campaign_focus: "Limited Time Offer",
    },
    {
      title: "Mobile Friendly",
      description: `Access ${keyword} services anywhere, anytime.`,
      description2: "Mobile app available. Works on all devices.",
      target_audience: "Mobile users",
      campaign_focus: "Mobile Convenience",
    },
    {
      title: "Trusted Choice",
      description: `Join over 10,000 happy ${keyword} customers.`,
      description2: "99% satisfaction rate. Read our reviews.",
      target_audience: "Social proof seekers",
      campaign_focus: "Social Proof Trust",
    },
    {
      title: "Free Trial",
      description: `Try our ${keyword} service completely free.`,
      description2: "No credit card required. Cancel anytime.",
      target_audience: "Trial seekers",
      campaign_focus: "Free Trial Offer",
    },
  ]

  // Select the number of ads requested, cycling through templates if needed
  const ads = Array.from({ length: numAds }, (_, i) => {
    const template = adTemplates[i % adTemplates.length]
    return { ...template } // Create a copy to avoid mutations
  })

  // Ensure character limits
  ads.forEach(ad => {
    if (ad.title.length > 30) ad.title = ad.title.substring(0, 30)
    if (ad.description.length > 90) ad.description = ad.description.substring(0, 87) + "..."
    if (ad.description2.length > 90) ad.description2 = ad.description2.substring(0, 87) + "..."
  })

  // Generate campaign names
  const campaignNames = ads.map(ad => {
    const focus = ad.campaign_focus.replace(/\s+/g, "_").toLowerCase()
    const date = new Date().toISOString().split("T")[0]
    return `${focus}_${keyword.replace(/\s+/g, "_")}_${date}`
  })

  return NextResponse.json({
    ads,
    campaignNames,
  })
}
