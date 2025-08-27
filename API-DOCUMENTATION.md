# Fake Google API Documentation

This document describes the external API endpoints available for the Fake Google application. These APIs can be consumed by external applications for search results, ad management, and AI-powered ad generation.

## Base URL

```
http://localhost:3000/api
```

For production deployments, replace `localhost:3000` with your deployed domain.

## Authentication

Currently, the APIs are open and do not require authentication. In production environments, consider implementing API key authentication for security.

---

## 🔍 Search API

### Get Search Results

Retrieve search results for a given query with optional localization parameters. Results include realistic Google tracking parameters when accessed through the web interface.

**Endpoint:** `GET /api/search`

**Parameters:**

| Parameter  | Type   | Required | Description                | Example                            |
| ---------- | ------ | -------- | -------------------------- | ---------------------------------- |
| `q`        | string | Yes      | Search query               | `mortgage rates`                   |
| `gl`       | string | No       | Country/region code        | `us`, `uk`, `ca`, `au`, `de`, `fr` |
| `lr`       | string | No       | Language restriction       | `lang_en`, `lang_es`, `lang_fr`    |
| `hl`       | string | No       | Interface language         | `en`, `es`, `fr`, `de`             |
| `location` | string | No       | Location for local results | `New York`, `London`               |

**Example Request:**

```bash
curl "http://localhost:3000/api/search?q=mortgage%20rates&gl=us&hl=en"
```

**Example Response:**

```json
[
  {
    "title": "Best Mortgage Rates 2025 - Compare & Save",
    "url": "https://www.example.com/mortgage-rates",
    "description": "Compare the best mortgage rates from top lenders. Get pre-approved in minutes with competitive rates and excellent service.",
    "favicon": "https://www.google.com/s2/favicons?domain=example.com&sz=16"
  },
  {
    "title": "Mortgage Calculator - Calculate Your Payment",
    "url": "https://www.mortgagecalc.com/calculator",
    "description": "Free mortgage calculator to estimate your monthly payment. Includes taxes, insurance, PMI, and additional fees.",
    "favicon": "https://www.google.com/s2/favicons?domain=mortgagecalc.com&sz=16"
  }
]
```

**Response Fields:**

| Field         | Type   | Description              |
| ------------- | ------ | ------------------------ |
| `title`       | string | Page title               |
| `url`         | string | Page URL                 |
| `description` | string | Page description/snippet |
| `favicon`     | string | Page favicon URL         |

**Error Response:**

```json
{
  "error": "Query parameter required"
}
```

---

## 📢 Ads API

### Get Ads for Keyword

Retrieve up to 3 ads for a specific keyword, ordered by priority.

**Endpoint:** `GET /api/ads?q={keyword}`

**Parameters:**

| Parameter | Type   | Required | Description    | Example    |
| --------- | ------ | -------- | -------------- | ---------- |
| `q`       | string | Yes      | Target keyword | `mortgage` |

**Example Request:**

```bash
curl "http://localhost:3000/api/ads?q=mortgage"
```

**Example Response:**

```json
[
  {
    "title": "Get Your Mortgage Today",
    "display_url": "woodburn.com/mortgage",
    "url": "https://banking.demo.hclsoftware.cloud/mortgage?utm_source=google&utm_medium=paid_search&utm_campaign=mortgage_q1_2025&utm_term=mortgage",
    "description": "Apply for a mortgage with competitive rates and fast approval.",
    "description2": "No hidden fees. Expert guidance throughout the process.",
    "utm_source": "google",
    "utm_medium": "paid_search",
    "utm_campaign": "mortgage_q1_2025"
  }
]
```

**Response Fields:**

| Field          | Type   | Description                        |
| -------------- | ------ | ---------------------------------- |
| `title`        | string | Ad headline                        |
| `display_url`  | string | Display URL shown in ad            |
| `url`          | string | Final URL with UTM parameters      |
| `description`  | string | First description line             |
| `description2` | string | Second description line (optional) |
| `utm_source`   | string | UTM source parameter               |
| `utm_medium`   | string | UTM medium parameter               |
| `utm_campaign` | string | UTM campaign parameter             |

### Get All Ads (Admin)

Retrieve all ads for administrative purposes.

**Endpoint:** `GET /api/ads`

**Example Request:**

```bash
curl "http://localhost:3000/api/ads"
```

**Example Response:**

```json
[
  {
    "keyword": "mortgage",
    "ad": {
      "title": "Get Your Mortgage Today",
      "display_url": "woodburn.com/mortgage",
      "url": "https://banking.demo.hclsoftware.cloud/mortgage",
      "description": "Apply for a mortgage with competitive rates and fast approval.",
      "description2": "No hidden fees. Expert guidance throughout the process.",
      "priority": 1,
      "utm_source": "google",
      "utm_medium": "paid_search",
      "utm_campaign": "mortgage_q1_2025"
    }
  }
]
```

### Create Ad

Create a new advertisement.

**Endpoint:** `POST /api/ads`

**Request Body:**

```json
{
  "keyword": "home loans",
  "ad": {
    "title": "Best Home Loans 2025",
    "display_url": "lender.com/home-loans",
    "url": "https://www.lender.com/home-loans",
    "description": "Get pre-approved for a home loan in minutes.",
    "description2": "Competitive rates and excellent customer service.",
    "priority": 1,
    "utm_source": "google",
    "utm_medium": "paid_search",
    "utm_campaign": "home_loans_campaign"
  },
  "editing": -1
}
```

**Request Fields:**

| Field             | Type    | Required | Description                                   |
| ----------------- | ------- | -------- | --------------------------------------------- |
| `keyword`         | string  | Yes      | Target keyword                                |
| `ad.title`        | string  | Yes      | Ad headline (max 30 chars)                    |
| `ad.display_url`  | string  | Yes      | Display URL                                   |
| `ad.url`          | string  | Yes      | Final landing URL                             |
| `ad.description`  | string  | Yes      | First description line (max 90 chars)         |
| `ad.description2` | string  | No       | Second description line (max 90 chars)        |
| `ad.priority`     | integer | No       | Ad priority (1=highest, 3=lowest, default: 1) |
| `ad.utm_source`   | string  | No       | UTM source (default: "google")                |
| `ad.utm_medium`   | string  | No       | UTM medium (default: "paid_search")           |
| `ad.utm_campaign` | string  | No       | UTM campaign name                             |
| `editing`         | integer | No       | Index for editing existing ad (-1 for new)    |

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/ads" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "home loans",
    "ad": {
      "title": "Best Home Loans 2025",
      "display_url": "lender.com/home-loans",
      "url": "https://www.lender.com/home-loans",
      "description": "Get pre-approved for a home loan in minutes.",
      "priority": 1
    },
    "editing": -1
  }'
```

### Delete Ad

Delete an advertisement.

**Endpoint:** `DELETE /api/ads`

**Request Body:**

```json
{
  "index": 0
}
```

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/ads" \
  -H "Content-Type: application/json" \
  -d '{"index": 0}'
```

---

## 🤖 AI Ad Generation API

### Generate Ads with AI

Generate multiple ad variations using Google Gemini AI or fallback templates.

**Endpoint:** `POST /api/ads/generate`

**Request Body:**

```json
{
  "keyword": "mortgage rates",
  "displayUrl": "www.woodburn.com",
  "landingUrl": "https://banking.demo.hclsoftware.cloud/mortgage",
  "numAds": 3,
  "customPrompt": "Generate {numAds} ads for {keyword} targeting small businesses..."
}
```

**Request Fields:**

| Field          | Type    | Required | Description                                     |
| -------------- | ------- | -------- | ----------------------------------------------- |
| `keyword`      | string  | Yes      | Target keyword                                  |
| `displayUrl`   | string  | Yes      | Display URL for ads                             |
| `landingUrl`   | string  | Yes      | Landing page URL                                |
| `numAds`       | integer | No       | Number of ads to generate (default: 3, max: 10) |
| `customPrompt` | string  | No       | Custom AI prompt template                       |

**Custom Prompt Placeholders:**

| Placeholder    | Description                             |
| -------------- | --------------------------------------- |
| `{keyword}`    | Replaced with the target keyword        |
| `{displayUrl}` | Replaced with the display URL           |
| `{landingUrl}` | Replaced with the landing URL           |
| `{numAds}`     | Replaced with number of ads to generate |

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/ads/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "mortgage rates",
    "displayUrl": "www.woodburn.com",
    "landingUrl": "https://banking.demo.hclsoftware.cloud/mortgage",
    "numAds": 3
  }'
```

**Example Response:**

```json
{
  "ads": [
    {
      "title": "Get Started Today",
      "description": "Perfect for beginners. Step-by-step mortgage guidance.",
      "description2": "24/7 support available. Join thousands of satisfied customers.",
      "target_audience": "First-time buyers",
      "campaign_focus": "Beginner Friendly Guide"
    },
    {
      "title": "Compare & Save",
      "description": "Why pay more? Compare mortgage rates and get the best deal.",
      "description2": "Price match guarantee. Free consultation available.",
      "target_audience": "Comparison shoppers",
      "campaign_focus": "Value Comparison Deal"
    },
    {
      "title": "Expert Solutions",
      "description": "Advanced mortgage features for experienced buyers.",
      "description2": "Professional-grade tools. Dedicated specialist support.",
      "target_audience": "Experienced customers",
      "campaign_focus": "Expert Professional Grade"
    }
  ],
  "campaignNames": [
    "beginner_friendly_guide_mortgage_rates_2025-08-21",
    "value_comparison_deal_mortgage_rates_2025-08-21",
    "expert_professional_grade_mortgage_rates_2025-08-21"
  ]
}
```

**Response Fields:**

| Field                   | Type   | Description                 |
| ----------------------- | ------ | --------------------------- |
| `ads`                   | array  | Array of generated ads      |
| `ads[].title`           | string | Ad headline                 |
| `ads[].description`     | string | First description line      |
| `ads[].description2`    | string | Second description line     |
| `ads[].target_audience` | string | Target audience description |
| `ads[].campaign_focus`  | string | Campaign focus keywords     |
| `campaignNames`         | array  | Generated campaign names    |

---

## 🎯 Google Tracking Integration

### Realistic URL Parameters

When accessed through the web interface, this fake Google implementation includes authentic Google tracking parameters for enhanced martech demonstrations:

#### Search Page URLs

```
/?q=mortgage%20rates&source=hp&ei=abc123-def456&uact=8&biw=1920&bih=1080&dpr=1&sa=X&ved=2ahUKEwi...&cid=1234567890.1234567890&gs_ssp=xyz123
```

#### Google ID System

The platform generates realistic Google tracking IDs that match real Google services:

**Analytics & Measurement IDs:**

- **Google Analytics Client ID**: `1234567890.1234567890` (persistent visitor tracking)
- **Google Analytics Property ID**: `G-XXXXXXXXXX` (GA4) or `UA-XXXXXXXX-X` (Universal Analytics)
- **Google Session ID**: `timestamp.randomnumber` (session-based tracking)

**Advertising IDs:**

- **Google Ads Customer ID**: `123-456-7890` (account-level identifier)
- **Google Conversion ID**: `AW-123456789/AbCdEfGhIj_12345` (conversion tracking)
- **Google Click ID (gclid)**: `CjwKCAiA1eKBBhCuARIsAIeLs3MxE...` (click attribution)

**Platform IDs:**

- **Google Tag Manager ID**: `GTM-XXXXXXX` (container management)
- **Google User ID**: `116825000000000000000` (signed-in user tracking)

**Mobile Advertising IDs:**

- **Google Advertising ID (GAID)**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (Android devices)
- **Apple IDFA**: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` (iOS devices)
- **Mobile Ad Type**: Automatically detected based on user agent

**Google Analytics Cookies:**

- **`_ga`**: `GA1.2.906301740.1756182008` (primary tracking cookie, 2-year expiry)
  - Format: `GA1.{domain-depth}.{client-id}.{first-visit-timestamp}`
  - Purpose: Unique visitor identification across sessions
- **`_gid`**: `GA1.2.123456789.1756182008` (session cookie, 24-hour expiry)
  - Format: `GA1.{domain-depth}.{random-number}.{timestamp}`
  - Purpose: Daily unique visitor identification
- **`_gac_<property-id>`**: `1.1756182008.CjwKCAiA...` (consent cookie with gclid)
  - Format: `1.{timestamp}.{gclid-value}`
  - Purpose: Store Google Ads click attribution data
- **`_ga_<property-id>`**: `GA1.2.906301740.1756182008` (GA4 property-specific)
  - Format: `GA1.{domain-depth}.{session-id}.{session-number}.{engagement-time}.{timestamp}`
  - Purpose: Enhanced measurement for GA4 properties
- **`_gat`**: `1` (throttle cookie, 1-minute expiry)
  - Purpose: Rate limiting Google Analytics requests

#### Paid Ad Click URLs

- **gclid**: Google Click ID (e.g., `CjwKCAiA1eKBBhCuARIsAIeLs3MxE...`)
- **gbraid**: Google Broad Match Click ID (e.g., `0AH1Qm5vK3jL9M8N7P6`)
- **wbraid**: Web-to-App Click ID (e.g., `1tP4Q2R8S6M9N3`)
- **gclsrc**: Google Ads source (`aw.ds`)
- **adpos**: Ad position (1, 2, 3)
- **gaid**: Google Advertising ID (Android only, when detected)
- **idfa**: Apple IDFA (iOS only, when detected)

#### Organic Result URLs

- **ved**: Google result tracking ID (e.g., `2ahUKEwjM5...`)
- **uact**: User action code (8, 5, 3)
- **source**: Traffic source (`web`)
- **q**: Search query
- **pos**: Result position

#### Benefits for Martech Demos

- **Realistic Attribution**: URLs match real Google Ads campaigns
- **Analytics Integration**: Compatible with Google Analytics and conversion tracking
- **Professional Presentation**: Demonstrates enterprise-level digital marketing knowledge
- **UTM Enhancement**: Combines Google tracking with existing UTM parameters
- **ID Persistence**: Client IDs persist across sessions like real Google Analytics
- **Cross-Platform Tracking**: Supports web-to-app and broad match tracking
- **Mobile Attribution**: GAID/IDFA support for mobile app advertising campaigns

---

## 🛠️ Integration Examples

### JavaScript/Node.js

```javascript
// Search for results
async function searchGoogle(query, country = "us") {
  const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}&gl=${country}`)
  const results = await response.json()
  return results
}

// Get ads for keyword
async function getAds(keyword) {
  const response = await fetch(`http://localhost:3000/api/ads?q=${encodeURIComponent(keyword)}`)
  const ads = await response.json()
  return ads
}

// Generate AI ads
async function generateAds(keyword, displayUrl, landingUrl) {
  const response = await fetch("http://localhost:3000/api/ads/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword, displayUrl, landingUrl, numAds: 3 }),
  })
  const result = await response.json()
  return result
}
```

### Python

```python
import requests
import urllib.parse

def search_google(query, country='us'):
    url = f"http://localhost:3000/api/search?q={urllib.parse.quote(query)}&gl={country}"
    response = requests.get(url)
    return response.json()

def get_ads(keyword):
    url = f"http://localhost:3000/api/ads?q={urllib.parse.quote(keyword)}"
    response = requests.get(url)
    return response.json()

def generate_ads(keyword, display_url, landing_url):
    url = "http://localhost:3000/api/ads/generate"
    data = {
        "keyword": keyword,
        "displayUrl": display_url,
        "landingUrl": landing_url,
        "numAds": 3
    }
    response = requests.post(url, json=data)
    return response.json()
```

### cURL Examples

```bash
# Search for results
curl "http://localhost:3000/api/search?q=mortgage%20rates&gl=us"

# Get ads for keyword
curl "http://localhost:3000/api/ads?q=mortgage"

# Generate AI ads
curl -X POST "http://localhost:3000/api/ads/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "mortgage rates",
    "displayUrl": "www.example.com",
    "landingUrl": "https://www.example.com/mortgage",
    "numAds": 3
  }'

# Create new ad
curl -X POST "http://localhost:3000/api/ads" \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "home loans",
    "ad": {
      "title": "Best Home Loans",
      "display_url": "lender.com",
      "url": "https://lender.com/home-loans",
      "description": "Get pre-approved today",
      "priority": 1
    },
    "editing": -1
  }'
```

---

## 🔧 Configuration

### Environment Variables

For optimal API functionality, configure these environment variables:

```bash
# Google Custom Search (for real search results)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_custom_search_engine_id

# Google Gemini AI (for AI ad generation)
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key

# Database (required for ads functionality)
DATABASE_URL=postgres://user:password@localhost:5432/fakegoogle
```

### Fallback Behavior

- **Search API**: If Google Custom Search API is not configured, returns demo/template results
- **Ads Generate API**: If Google Gemini API is not configured, returns template-based ads
- **Ads API**: Requires database connection; returns 500 error if database unavailable

---

## 📊 Rate Limits & Quotas

- **Google Custom Search API**: 100 queries per day (free tier)
- **Google Gemini API**: Varies by plan
- **Application APIs**: No built-in rate limiting (consider implementing for production)

---

## 🔒 Security Considerations

For production use:

1. **Implement API Authentication**: Add API key validation
2. **Add Rate Limiting**: Prevent abuse with request throttling
3. **Input Validation**: Sanitize all input parameters
4. **CORS Configuration**: Configure appropriate CORS headers
5. **HTTPS**: Use HTTPS for all API communications
6. **Database Security**: Use connection pooling and prepared statements

---

## 🆘 Error Handling

All APIs return appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `500` - Internal Server Error (database/API failures)

Error responses include descriptive messages:

```json
{
  "error": "Query parameter required"
}
```

---

## 📞 Support

For API support and questions:

1. Check this documentation
2. Review the [main README](./README.md)
3. Check [deployment documentation](./DEPLOYMENT.md)
4. Create a GitHub issue for bugs or feature requests

---

_This API documentation is for the Fake Google martech demonstration platform. Not affiliated with Google Inc._
