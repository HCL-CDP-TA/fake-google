import { useState } from "react"

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

  // Localization state
  const [country, setCountry] = useState("us")
  const [language, setLanguage] = useState("en")
  const [location, setLocation] = useState("")

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

  // Fetch organic search results from Google with localization
  async function fetchOrganicResults(q: string) {
    try {
      const params = new URLSearchParams({ q })
      if (country) params.set("gl", country)
      if (language) params.set("hl", language)
      if (language) params.set("lr", `lang_${language}`)
      if (location) params.set("location", location)

      const res = await fetch(`/api/search?${params.toString()}`)
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

  function handleSearch(e?: React.FormEvent<HTMLFormElement>) {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setSearch(query)
    setLoading(true)

    Promise.all([fetchAds(query), fetchOrganicResults(query)]).finally(() => {
      setLoading(false)
    })
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
    language,
    setLanguage: (newLanguage: string) => {
      setLanguage(newLanguage)
      refreshResults()
    },
    location,
    setLocation: (newLocation: string) => {
      setLocation(newLocation)
      refreshResults()
    },
  }
}
