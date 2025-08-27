import { useState, useEffect, useCallback } from "react"
import { updatePageUrlWithGoogleParams } from "@/app/utils/googleTracking"

type PaidAd = {
  title: string
  display_url: string
  url: string
  description: string
  description2?: string
}

type OrganicResult = {
  title: string
  url: string
  description: string
  favicon?: string
}

export function useSearch() {
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [ads, setAds] = useState<PaidAd[]>([])
  const [organic, setOrganic] = useState<OrganicResult[]>([])
  const [loading, setLoading] = useState(false)

  // Localization state (keeping for API compatibility)
  const [country, setCountry] = useState("us")
  const [location, setLocation] = useState("")

  // Update URL when search changes
  const updateURL = (searchQuery: string) => {
    if (typeof window !== "undefined") {
      if (searchQuery) {
        // Use realistic Google search parameters
        updatePageUrlWithGoogleParams(searchQuery)
      } else {
        // Clear all parameters when going to homepage
        const url = new URL(window.location.href)
        url.search = ""
        window.history.pushState({}, "", url.toString())
      }
    }
  }

  // Fetch paid ads from API
  const fetchAds = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/ads?q=${encodeURIComponent(q)}`)
      if (res.ok) setAds(await res.json())
      else setAds([])
    } catch (error) {
      console.error("Error fetching ads:", error)
      setAds([])
    }
  }, [])

  // Fetch organic search results from Google with localization
  const fetchOrganicResults = useCallback(
    async (q: string) => {
      try {
        const params = new URLSearchParams({ q })
        if (country) params.set("gl", country)
        if (location) params.set("location", location)

        const apiUrl = `/api/search?${params.toString()}`
        console.log("Fetching search results from:", apiUrl, "with country:", country)

        const res = await fetch(apiUrl)
        if (res.ok) {
          const results = await res.json()
          console.log("Search results received:", results.slice(0, 2))
          setOrganic(results)
        } else {
          setOrganic([])
        }
      } catch (error) {
        console.error("Error fetching organic results:", error)
        setOrganic([])
      }
    },
    [country, location],
  )

  // Perform search with a given query (used for URL loading and manual search)
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return

      setSearch(searchQuery)
      setLoading(true)

      Promise.all([fetchAds(searchQuery), fetchOrganicResults(searchQuery)]).finally(() => {
        setLoading(false)
      })
    },
    [fetchAds, fetchOrganicResults],
  )

  // Read query from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const urlQuery = urlParams.get("q")
      if (urlQuery) {
        setQuery(urlQuery)
        setSearch(urlQuery)
        // Automatically perform search if query exists in URL
        performSearch(urlQuery)
      }
    }
  }, [performSearch])

  function handleSearch(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault()
    if (!query.trim()) return

    // Update URL with new search query
    updateURL(query)

    // Perform the search
    performSearch(query)
  }

  // Function to trigger search when localization changes
  function refreshResults() {
    if (search) {
      setLoading(true)
      Promise.all([fetchAds(search), fetchOrganicResults(search)]).finally(() => {
        setLoading(false)
      })
    }
  }

  function goHome() {
    setSearch("")
    setQuery("")
    setAds([])
    setOrganic([])
    // Clear URL query parameters
    updateURL("")
  }

  return {
    query,
    setQuery,
    search,
    ads,
    organic,
    loading,
    handleSearch,
    goHome,
    // Localization
    country,
    setCountry: (newCountry: string) => {
      setCountry(newCountry)
      refreshResults()
    },
    location,
    setLocation: (newLocation: string) => {
      setLocation(newLocation)
      refreshResults()
    },
  }
}
