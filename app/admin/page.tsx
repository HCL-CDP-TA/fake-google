"use client"
import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import Link from "next/link"

type AdType = {
  title: string
  display_url: string
  url: string // final_url
  description: string
  description2?: string
  priority?: number
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}
type AdConfig = { keyword: string; ad: AdType }

export default function Admin() {
  const [ads, setAds] = useState<AdConfig[]>([])
  const [filteredAds, setFilteredAds] = useState<AdConfig[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [adsPerPage, setAdsPerPage] = useState(10) // Allow changing items per page
  const [keyword, setKeyword] = useState("")
  const [ad, setAd] = useState<AdType>({
    title: "",
    display_url: "",
    url: "",
    description: "",
    description2: "",
    priority: 1,
    utm_source: "google",
    utm_medium: "paid_search",
    utm_campaign: "",
  })
  const [editing, setEditing] = useState<number>(-1)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch("/api/ads")
      .then(r => r.json())
      .then(data => {
        setAds(data)
        setFilteredAds(data)
      })
  }, [])

  useEffect(() => {
    if (searchKeyword.trim() === "") {
      setFilteredAds(ads)
    } else {
      setFilteredAds(
        ads.filter(
          item =>
            item.keyword.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            item.ad.title.toLowerCase().includes(searchKeyword.toLowerCase()),
        ),
      )
    }
    // Reset to first page when search changes
    setCurrentPage(1)
  }, [searchKeyword, ads])

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const value = e.target.type === "number" ? parseInt(e.target.value) || 1 : e.target.value
    setAd({ ...ad, [e.target.name]: value })
  }

  function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, ad, editing }),
    })
      .then(r => r.json())
      .then(data => {
        setAds(data)
        setFilteredAds(data)
      })
    resetForm()
  }

  function resetForm() {
    setAd({
      title: "",
      display_url: "",
      url: "",
      description: "",
      description2: "",
      priority: 1,
      utm_source: "google",
      utm_medium: "paid_search",
      utm_campaign: "",
    })
    setKeyword("")
    setEditing(-1)
    setShowForm(false)
  }

  function handleEdit(i: number) {
    const originalIndex = ads.findIndex(ad => ad === filteredAds[i])
    setEditing(originalIndex)
    setKeyword(filteredAds[i].keyword)
    setAd(filteredAds[i].ad)
    setShowForm(true)
  }

  function handleDelete(i: number) {
    const originalIndex = ads.findIndex(ad => ad === filteredAds[i])
    fetch("/api/ads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: originalIndex }),
    })
      .then(r => r.json())
      .then(data => {
        setAds(data)
        setFilteredAds(data)
      })
  }

  function groupAdsByKeyword() {
    const groups: { [key: string]: AdConfig[] } = {}
    filteredAds.forEach(item => {
      if (!groups[item.keyword]) {
        groups[item.keyword] = []
      }
      groups[item.keyword].push(item)
    })
    return groups
  }

  function getPaginatedGroups() {
    const allGroups = groupAdsByKeyword()
    const groupKeys = Object.keys(allGroups)
    const totalGroups = groupKeys.length
    const totalPages = Math.ceil(totalGroups / adsPerPage)

    const startIndex = (currentPage - 1) * adsPerPage
    const endIndex = startIndex + adsPerPage
    const paginatedKeys = groupKeys.slice(startIndex, endIndex)

    const paginatedGroups: { [key: string]: AdConfig[] } = {}
    paginatedKeys.forEach(key => {
      paginatedGroups[key] = allGroups[key]
    })

    return {
      groups: paginatedGroups,
      totalGroups,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }
  }

  const adGroups = groupAdsByKeyword()
  const paginationData = getPaginatedGroups()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 google-font">Ad Campaign Manager</h1>
              <p className="text-sm text-gray-600 google-font">Manage your paid search ads for demo purposes</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 google-font">
              ← Back to Search
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 google-font">
                  {editing >= 0 ? "Edit Ad" : "Create New Ad"}
                </h2>
                {!showForm && editing < 0 && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 google-font">
                    + New Ad
                  </button>
                )}
              </div>

              {(showForm || editing >= 0) && (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 google-font">Keyword</label>
                    <input
                      name="keyword"
                      value={keyword}
                      onChange={e => setKeyword(e.target.value)}
                      placeholder="e.g., mortgage rates"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 google-font"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 google-font">The search term that will trigger this ad</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 google-font">Ad Title</label>
                    <input
                      name="title"
                      value={ad.title}
                      onChange={handleChange}
                      placeholder="e.g., Best Mortgage Rates Available"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 google-font"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 google-font">Will be used as utm_content parameter</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 google-font">Display URL</label>
                    <input
                      name="display_url"
                      value={ad.display_url}
                      onChange={handleChange}
                      placeholder="e.g., www.example.com/mortgages"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 google-font"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 google-font">URL shown to users (can be simplified)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 google-font">Final URL</label>
                    <input
                      name="url"
                      value={ad.url}
                      onChange={handleChange}
                      placeholder="https://www.example.com/landing-page"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 google-font"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500 google-font">
                      Actual destination URL (UTM parameters will be added)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 google-font">Description Line 1</label>
                    <textarea
                      name="description"
                      value={ad.description}
                      onChange={handleChange}
                      placeholder="e.g., Compare rates from top lenders. Get pre-approved in minutes."
                      rows={2}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 google-font"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 google-font">
                      Description Line 2 (Optional)
                    </label>
                    <textarea
                      name="description2"
                      value={ad.description2}
                      onChange={handleChange}
                      placeholder="e.g., No hidden fees. Quick approval process."
                      rows={2}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 google-font"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 google-font">Priority</label>
                    <select
                      name="priority"
                      value={ad.priority}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 google-font">
                      <option value={1}>Normal (1)</option>
                      <option value={2}>High (2)</option>
                      <option value={3}>Highest (3)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 google-font">
                      Higher priority ads appear first (max 3 ads shown)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 google-font">Campaign Name</label>
                    <input
                      name="utm_campaign"
                      value={ad.utm_campaign}
                      onChange={handleChange}
                      placeholder="e.g., spring_2024_promotion"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 google-font"
                    />
                    <p className="mt-1 text-xs text-gray-500 google-font">Used for utm_campaign tracking</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900 google-font mb-2">
                      UTM Parameters (Auto-Generated)
                    </h4>
                    <div className="text-xs text-gray-600 space-y-1 google-font">
                      <div>utm_source: {ad.utm_source}</div>
                      <div>utm_medium: {ad.utm_medium}</div>
                      <div>utm_content: {ad.title || "(ad title)"}</div>
                      <div>utm_term: {keyword || "(keyword)"}</div>
                      {ad.utm_campaign && <div>utm_campaign: {ad.utm_campaign}</div>}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium google-font">
                      {editing >= 0 ? "Update Ad" : "Create Ad"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium google-font">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column - Ad List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 google-font">Campaign Overview</h2>
                  <div className="text-sm text-gray-500 google-font">
                    {filteredAds.length} ads in {Object.keys(adGroups).length} keywords
                    {paginationData.totalPages > 1 && (
                      <span className="ml-2">
                        (Page {paginationData.currentPage} of {paginationData.totalPages})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={e => setSearchKeyword(e.target.value)}
                      placeholder="Search by keyword or ad title..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 google-font"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700 google-font">Show:</label>
                    <select
                      value={adsPerPage}
                      onChange={e => {
                        setAdsPerPage(Number(e.target.value))
                        setCurrentPage(1) // Reset to first page when changing page size
                      }}
                      className="border border-gray-300 rounded-md text-sm google-font px-2 py-1 focus:ring-blue-500 focus:border-blue-500">
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-700 google-font">ads</span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {Object.keys(paginationData.groups).length === 0 ? (
                  <div className="p-8 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 google-font">No ads found</h3>
                    <p className="mt-1 text-sm text-gray-500 google-font">
                      {searchKeyword ? "Try a different search term" : "Get started by creating your first ad"}
                    </p>
                  </div>
                ) : (
                  <>
                    {Object.entries(paginationData.groups).map(([keywordName, keywordAds]) => (
                      <div key={keywordName} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 google-font">
                              &ldquo;{keywordName}&rdquo;
                            </h3>
                            <p className="text-sm text-gray-500 google-font">
                              {keywordAds.length} ad{keywordAds.length !== 1 ? "s" : ""}
                              {keywordAds.length > 3 && (
                                <span className="text-amber-600"> (only first 3 will show in search)</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {keywordAds.map((item, i) => {
                            const originalIndex = ads.findIndex(ad => ad === item)
                            return (
                              <div
                                key={originalIndex}
                                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 google-font">
                                        Sponsored
                                      </span>
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium google-font ${
                                          item.ad.priority === 3
                                            ? "bg-red-100 text-red-800"
                                            : item.ad.priority === 2
                                            ? "bg-orange-100 text-orange-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}>
                                        Priority {item.ad.priority}
                                      </span>
                                      {i < 3 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 google-font">
                                          Will Show
                                        </span>
                                      )}
                                    </div>

                                    <div className="mb-1">
                                      <span className="text-lg text-blue-700 font-medium google-font">
                                        {item.ad.title}
                                      </span>
                                    </div>
                                    <div className="text-green-700 text-sm mb-1 google-font">{item.ad.display_url}</div>
                                    <div className="text-gray-700 text-sm google-font">{item.ad.description}</div>
                                    {item.ad.description2 && (
                                      <div className="text-gray-700 text-sm google-font">{item.ad.description2}</div>
                                    )}

                                    <div className="mt-3 text-xs text-gray-500 google-font">
                                      <div>
                                        Final URL: <span className="text-blue-600">{item.ad.url}</span>
                                      </div>
                                      {item.ad.utm_campaign && <div>Campaign: {item.ad.utm_campaign}</div>}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 ml-4">
                                    <button
                                      onClick={() => handleEdit(filteredAds.findIndex(ad => ad === item))}
                                      className="text-sm text-blue-600 hover:text-blue-800 font-medium google-font">
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(filteredAds.findIndex(ad => ad === item))}
                                      className="text-sm text-red-600 hover:text-red-800 font-medium google-font">
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Pagination Controls */}
                    {paginationData.totalPages > 1 && (
                      <div className="p-6 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-700 google-font">
                            Showing {(currentPage - 1) * adsPerPage + 1} to{" "}
                            {Math.min(currentPage * adsPerPage, paginationData.totalGroups)} of{" "}
                            {paginationData.totalGroups} keyword groups
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={!paginationData.hasPrevPage}
                              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed google-font">
                              Previous
                            </button>

                            <div className="flex items-center gap-1">
                              {(() => {
                                const maxVisiblePages = 5
                                const totalPages = paginationData.totalPages
                                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                                const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

                                // Adjust start page if we're near the end
                                if (endPage - startPage + 1 < maxVisiblePages) {
                                  startPage = Math.max(1, endPage - maxVisiblePages + 1)
                                }

                                const pages = []

                                // First page + ellipsis if needed
                                if (startPage > 1) {
                                  pages.push(
                                    <button
                                      key={1}
                                      onClick={() => setCurrentPage(1)}
                                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 google-font">
                                      1
                                    </button>,
                                  )
                                  if (startPage > 2) {
                                    pages.push(
                                      <span key="ellipsis1" className="px-2 text-gray-500">
                                        ...
                                      </span>,
                                    )
                                  }
                                }

                                // Visible page range
                                for (let page = startPage; page <= endPage; page++) {
                                  pages.push(
                                    <button
                                      key={page}
                                      onClick={() => setCurrentPage(page)}
                                      className={`px-3 py-2 text-sm font-medium rounded-md google-font ${
                                        page === currentPage
                                          ? "bg-blue-600 text-white"
                                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                      }`}>
                                      {page}
                                    </button>,
                                  )
                                }

                                // Last page + ellipsis if needed
                                if (endPage < totalPages) {
                                  if (endPage < totalPages - 1) {
                                    pages.push(
                                      <span key="ellipsis2" className="px-2 text-gray-500">
                                        ...
                                      </span>,
                                    )
                                  }
                                  pages.push(
                                    <button
                                      key={totalPages}
                                      onClick={() => setCurrentPage(totalPages)}
                                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 google-font">
                                      {totalPages}
                                    </button>,
                                  )
                                }

                                return pages
                              })()}
                            </div>

                            <button
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={!paginationData.hasNextPage}
                              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed google-font">
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
