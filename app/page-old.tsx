"use client"
import GoogleHomepage from "./components/GoogleHomepage"
import SearchResultsPage from "./components/SearchResultsPage"
import { useSearch } from "./hooks/useSearch"

// Demo organic results for display only
type OrganicResult = { title: string; url: string; description: string }
const ORGANIC_RESULTS: Record<string, OrganicResult[]> = {
  "best mortgage rates": [
    {
      title: "Compare Mortgage Rates - Google",
      url: "https://www.google.com/search?q=best+mortgage+rates",
      description: "See today’s best mortgage rates from top lenders. Compare rates and save.",
    },
    {
      title: "NerdWallet: Best Mortgage Rates",
      url: "https://www.nerdwallet.com/mortgages/mortgage-rates",
      description: "NerdWallet’s mortgage comparison tool helps you find the best rates.",
    },
  ],
  "car insurance": [
    {
      title: "Car Insurance Quotes - Google",
      url: "https://www.google.com/search?q=car+insurance",
      description: "Compare car insurance quotes and save money.",
    },
    {
      title: "Geico: Car Insurance",
      url: "https://www.geico.com/",
      description: "Get a fast, free car insurance quote from Geico.",
    },
  ],
}

type PaidAd = { title: string; display_url: string; url: string; description: string }

export default function Home() {
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [ads, setAds] = useState<PaidAd[]>([])
  const [organic, setOrganic] = useState<OrganicResult[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch paid ads from API
  async function fetchAds(q: string) {
    try {
      const res = await fetch(`/api/ads?q=${encodeURIComponent(q)}`)
      if (res.ok) setAds(await res.json())
      else setAds([])
    } catch (error) {
      console.error("Error fetching ads:", error)
      setAds([])
    }
  }

  // Fetch organic search results from Google
  async function fetchOrganicResults(q: string) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const results = await res.json()
        setOrganic(results)
      } else {
        setOrganic([])
      }
    } catch (error) {
      console.error("Error fetching organic results:", error)
      setOrganic([])
    }
  }

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!query.trim()) return

    setSearch(query)
    setLoading(true)

    Promise.all([fetchAds(query), fetchOrganicResults(query)]).finally(() => {
      setLoading(false)
    })
  }

  if (!search) {
    // Google homepage
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-4">
          <div></div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-gray-700 hover:underline">
              Admin
            </Link>
            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">Sign in</button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-32">
          <div className="text-center">
            <h1 className="text-7xl font-normal text-gray-700 mb-8">
              <span className="text-blue-500">F</span>
              <span className="text-red-500">a</span>
              <span className="text-yellow-500">k</span>
              <span className="text-blue-500">e</span>
              <span className="text-green-500"> </span>
              <span className="text-red-500">G</span>
              <span className="text-blue-500">o</span>
              <span className="text-green-500">o</span>
              <span className="text-yellow-500">g</span>
              <span className="text-blue-500">l</span>
              <span className="text-red-500">e</span>
            </h1>

            <form onSubmit={handleSearch} className="mb-8">
              <div className="relative max-w-xl mx-auto">
                <input
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:border-transparent focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-8">
                <button
                  type="submit"
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm">
                  Google Search
                </button>
                <button
                  type="button"
                  className="bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm">
                  I&apos;m Feeling Lucky
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Google search results page
  return (
    <div className="min-h-screen bg-white">
      {/* Header with search */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-6 py-3">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <button onClick={() => setSearch("")} className="text-2xl font-normal text-gray-700">
              <span className="text-blue-500">F</span>
              <span className="text-red-500">a</span>
              <span className="text-yellow-500">k</span>
              <span className="text-blue-500">e</span>
              <span className="text-green-500"> </span>
              <span className="text-red-500">G</span>
              <span className="text-blue-500">o</span>
              <span className="text-green-500">o</span>
              <span className="text-yellow-500">g</span>
              <span className="text-blue-500">l</span>
              <span className="text-red-500">e</span>
            </button>

            {/* Search box */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:border-transparent focus:ring-1 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </form>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-700 hover:underline text-sm">
                Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="px-6">
          <div className="flex gap-8 text-sm">
            <button className="text-blue-600 border-b-2 border-blue-600 pb-3 px-1">All</button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1">Images</button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1">Videos</button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1">News</button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1">Shopping</button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1">More</button>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="px-6 py-4">
        <div className="max-w-2xl">
          {/* Results info */}
          <div className="text-sm text-gray-600 mb-4">About {ads.length + organic.length} results (0.42 seconds)</div>

          {/* Paid Ads */}
          {ads.length > 0 && (
            <div className="mb-6">
              {ads.map((ad, i) => (
                <div key={i} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded border">Ad</span>
                  </div>
                  <div className="mb-1">
                    <a
                      href={ad.url}
                      target="_blank"
                      rel="noopener"
                      className="text-xl text-blue-700 hover:underline visited:text-purple-700">
                      {ad.title}
                    </a>
                  </div>
                  <div className="text-green-700 text-sm mb-1">{ad.display_url || ad.url}</div>
                  <div className="text-gray-700 text-sm leading-5">{ad.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Organic Results */}
          <div>
            {loading ? (
              <div className="text-gray-500 text-center py-8">Loading results...</div>
            ) : (
              organic.map((r, i) => (
                <div key={i} className="mb-6">
                  <div className="mb-1">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener"
                      className="text-xl text-blue-700 hover:underline visited:text-purple-700">
                      {r.title}
                    </a>
                  </div>
                  <div className="text-green-700 text-sm mb-1">{r.url}</div>
                  <div className="text-gray-700 text-sm leading-5">{r.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
