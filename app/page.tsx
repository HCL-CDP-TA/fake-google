"use client"

import SearchResultsPage from "./components/SearchResultsPage"
import { useSearch } from "./hooks/useSearch"
import { useEffect } from "react"
import { gtag } from "./components/GoogleAnalytics"

export default function Home() {
  const { query, setQuery, search, ads, organic, loading, handleSearch, goHome } = useSearch()

  useEffect(() => {
    const trackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID

    if (search) {
      document.title = `${search} - Fake Google`
      // Track page view for search results
      gtag.pageview(window.location.pathname + window.location.search, trackingId)
      // Track search event
      gtag.search(search, ads.length + organic.length)
    } else {
      document.title = "Fake Google"
      // Track homepage view
      gtag.pageview(window.location.pathname, trackingId)
    }
  }, [search, ads.length, organic.length])

  // if (!search) {
  //   return <GoogleHomepage query={query} setQuery={setQuery} onSearch={handleSearch} />
  // }

  return (
    <SearchResultsPage
      query={query}
      setQuery={setQuery}
      onSearch={handleSearch}
      onLogoClick={goHome}
      ads={ads}
      organicResults={organic}
      loading={loading}
      search={search}
    />
  )
}
