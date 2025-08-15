import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { keyword, displayUrl, landingUrl, numAds = 3 } = await req.json()

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
      return await generateWithGemini(apiKey, keyword, displayUrl, landingUrl, numAds)
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

async function generateWithGemini(
  apiKey: string,
  keyword: string,
  displayUrl: string,
  landingUrl: string,
  numAds: number = 3,
) {
  // Create the prompt for Gemini
  const prompt = `Generate ${numAds} different Google Ads for the keyword "${keyword}" with display URL "${displayUrl}" and landing URL "${landingUrl}".

Each ad should target a different audience with distinct messaging:
1. First ad: Target first-time buyers/beginners - emphasize trust, simplicity, guidance
2. Second ad: Target comparison shoppers - emphasize value, features, competitive advantages  
3. Third ad: Target premium/established customers - emphasize quality, exclusivity, expertise
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
- title1 (max 30 chars) - Primary headline
- title2 (max 30 chars) - Secondary headline
- description (max 90 chars) - First description line
- description2 (max 90 chars) - Second description line
- target_audience (brief description for internal use)
- campaign_focus (3-4 words describing the campaign angle)

Return ONLY a valid JSON array with exactly ${numAds} ads and no additional text or formatting. Format:
[
  {
    "title1": "Get Started Today",
    "title2": "Easy & Trusted", 
    "description": "Perfect for beginners. Step-by-step guidance included.",
    "description2": "24/7 support available. Join thousands of satisfied customers.",
    "target_audience": "First-time buyers",
    "campaign_focus": "Beginner Friendly Guide"
  },
  {
    "title1": "Compare & Save",
    "title2": "Best Value Online",
    "description": "Why pay more? Compare features and get the best deal.",
    "description2": "Price match guarantee. Free consultation available.",
    "target_audience": "Comparison shoppers", 
    "campaign_focus": "Value Comparison Deal"
  },
  {
    "title1": "Premium Service",
    "title2": "Expert Solutions",
    "description": "Exclusive access to premium features and support.",
    "description2": "Dedicated expert assistance. Priority customer service.",
    "target_audience": "Premium customers",
    "campaign_focus": "Premium Expert Service"
  }
]`

  // Call Gemini API with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
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
      if (
        !ad.title1 ||
        !ad.title2 ||
        !ad.description ||
        !ad.description2 ||
        !ad.target_audience ||
        !ad.campaign_focus
      ) {
        throw new Error("Missing required ad fields from AI response")
      }

      // Validate character limits
      if (ad.title1.length > 30) ad.title1 = ad.title1.substring(0, 30)
      if (ad.title2.length > 30) ad.title2 = ad.title2.substring(0, 30)
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
      title1: "Get Started Today",
      title2: "Easy & Trusted",
      description: `Perfect for beginners. Step-by-step ${keyword} guidance.`,
      description2: "24/7 support available. Join thousands of satisfied customers.",
      target_audience: "First-time buyers",
      campaign_focus: "Beginner Friendly Guide",
    },
    {
      title1: "Compare & Save",
      title2: "Best Value Online",
      description: `Compare ${keyword} options and get the best deal.`,
      description2: "Price match guarantee. Free consultation available.",
      target_audience: "Comparison shoppers",
      campaign_focus: "Value Comparison Deal",
    },
    {
      title1: "Premium Service",
      title2: "Expert Solutions",
      description: `Exclusive ${keyword} access with premium features.`,
      description2: "Dedicated expert assistance. Priority customer service.",
      target_audience: "Premium customers",
      campaign_focus: "Premium Expert Service",
    },
    {
      title1: "Local Experts",
      title2: "Near You",
      description: `Find local ${keyword} specialists in your area.`,
      description2: "Same-day service available. Licensed professionals only.",
      target_audience: "Local customers",
      campaign_focus: "Local Service Area",
    },
    {
      title1: "Limited Time",
      title2: "Special Offer",
      description: `Don't miss out on our ${keyword} promotion.`,
      description2: "Ends soon! Call now for exclusive pricing.",
      target_audience: "Urgent shoppers",
      campaign_focus: "Limited Time Offer",
    },
    {
      title1: "Mobile Friendly",
      title2: "On-the-Go",
      description: `Access ${keyword} services anywhere, anytime.`,
      description2: "Mobile app available. Works on all devices.",
      target_audience: "Mobile users",
      campaign_focus: "Mobile Convenience",
    },
    {
      title1: "Trusted Choice",
      title2: "5-Star Rated",
      description: `Join over 10,000 happy ${keyword} customers.`,
      description2: "99% satisfaction rate. Read our reviews.",
      target_audience: "Social proof seekers",
      campaign_focus: "Social Proof Trust",
    },
    {
      title1: "Free Trial",
      title2: "No Risk",
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
    if (ad.title1.length > 30) ad.title1 = ad.title1.substring(0, 30)
    if (ad.title2.length > 30) ad.title2 = ad.title2.substring(0, 30)
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
