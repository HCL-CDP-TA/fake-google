"use client"
import { useState, useEffect, FormEvent } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Plus } from "lucide-react"

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

type AIGeneratedAd = {
  title: string
  description: string
  description2: string
  target_audience: string
  campaign_focus: string
}

type AdConfig = { keyword: string; ad: AdType }

export default function Admin() {
  const [ads, setAds] = useState<AdConfig[]>([])
  const [filteredAds, setFilteredAds] = useState<AdConfig[]>([])
  const [searchKeyword, setSearchKeyword] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [adsPerPage, setAdsPerPage] = useState(10)
  const [keyword, setKeyword] = useState("")
  const [ad, setAd] = useState<AdType>({
    title: "",
    display_url: "",
    url: "",
    description: "",
    priority: 1,
    utm_source: "google",
    utm_medium: "paid_search",
    utm_campaign: "",
  })
  const [editing, setEditing] = useState<number>(-1)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // AI Generation state
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiKeyword, setAiKeyword] = useState("")
  const [aiDisplayUrl, setAiDisplayUrl] = useState("")
  const [aiLandingUrl, setAiLandingUrl] = useState("")
  const [numAdsToGenerate, setNumAdsToGenerate] = useState(3)
  const [generatedAds, setGeneratedAds] = useState<AIGeneratedAd[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedAds, setSelectedAds] = useState<boolean[]>([])
  const [aiCampaignNames, setAiCampaignNames] = useState<string[]>([])
  const [isLoadingAds, setIsLoadingAds] = useState(true)

  // AI Prompt configuration state
  const [customPrompt, setCustomPrompt] = useState("")
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [showPromptConfig, setShowPromptConfig] = useState(false)

  useEffect(() => {
    setIsLoadingAds(true)
    fetch("/api/ads")
      .then(r => r.json())
      .then(data => {
        // API returns array directly, not wrapped in {ads: [...]}
        setAds(Array.isArray(data) ? data : data.ads || [])
      })
      .catch(console.error)
      .finally(() => {
        setIsLoadingAds(false)
      })
  }, [])

  // Load prompt configuration from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPrompt = localStorage.getItem("aiCustomPrompt")
      const savedUseCustom = localStorage.getItem("aiUseCustomPrompt") === "true"

      if (savedPrompt) {
        setCustomPrompt(savedPrompt)
      }
      setUseCustomPrompt(savedUseCustom)
    }
  }, [])

  // Save prompt configuration to localStorage
  const savePromptConfig = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("aiCustomPrompt", customPrompt)
      localStorage.setItem("aiUseCustomPrompt", useCustomPrompt.toString())
    }
  }

  // Default AI prompt template
  const getDefaultPrompt = () => {
    return `Generate {numAds} different Google Ads for the keyword "{keyword}" with display URL "{displayUrl}" and landing URL "{landingUrl}".

Each ad should target a different audience with distinct messaging:
1. First ad: Target first-time buyers/beginners - emphasize trust, simplicity, guidance
2. Second ad: Target comparison shoppers - emphasize value, features, competitive advantages  
3. Third ad: Target established/experienced customers - emphasize advanced features, expert-level service, superior results

For each ad, provide:
- title (max 30 chars) - Primary headline
- description (max 90 chars) - First description line
- description2 (max 90 chars) - Second description line
- target_audience (brief description for internal use)
- campaign_focus (3-4 words describing the campaign angle)

Return ONLY a valid JSON array with exactly {numAds} ads and no additional text or formatting.`
  }

  useEffect(() => {
    const filtered = ads.filter(
      item =>
        item.keyword.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.ad.title.toLowerCase().includes(searchKeyword.toLowerCase()),
    )
    setFilteredAds(filtered)
    setCurrentPage(1) // Reset to first page when search changes
  }, [ads, searchKeyword])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!keyword.trim()) return

    const response = await fetch("/api/ads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyword, ad, editing }),
    })

    if (response.ok) {
      if (editing >= 0) {
        const newAds = [...ads]
        newAds[editing] = { keyword, ad }
        setAds(newAds)
      } else {
        setAds([...ads, { keyword, ad }])
      }
      resetForm()
    }
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
    setIsModalOpen(false)
  }

  function handleEdit(i: number) {
    const originalIndex = ads.findIndex(ad => ad === filteredAds[i])
    setEditing(originalIndex)
    setKeyword(filteredAds[i].keyword)
    setAd(filteredAds[i].ad)
    setIsModalOpen(true)
  }

  function handleDelete(i: number) {
    const originalIndex = ads.findIndex(ad => ad === filteredAds[i])
    fetch("/api/ads", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ index: originalIndex }),
    }).then(() => {
      const newAds = ads.filter((_, index) => index !== originalIndex)
      setAds(newAds)
    })
  }

  async function handleGenerateAds() {
    if (!aiKeyword.trim() || !aiDisplayUrl.trim() || !aiLandingUrl.trim()) {
      return
    }

    setIsGenerating(true)
    setGeneratedAds([])

    try {
      const requestBody: {
        keyword: string
        displayUrl: string
        landingUrl: string
        numAds: number
        customPrompt?: string
      } = {
        keyword: aiKeyword,
        displayUrl: aiDisplayUrl,
        landingUrl: aiLandingUrl,
        numAds: numAdsToGenerate,
      }

      // Include custom prompt if enabled and provided
      if (useCustomPrompt && customPrompt.trim()) {
        requestBody.customPrompt = customPrompt
      }

      const response = await fetch("/api/ads/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedAds(data.ads || [])
        setSelectedAds(new Array(data.ads?.length || 0).fill(true))

        // Generate campaign names
        const campaigns = (data.ads || []).map(
          (_: AIGeneratedAd, index: number) => `${aiKeyword.replace(/\s+/g, "-").toLowerCase()}-campaign-${index + 1}`,
        )
        setAiCampaignNames(campaigns)
      } else {
        console.error("Failed to generate ads")
      }
    } catch (error) {
      console.error("Error generating ads:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCreateSelectedAds() {
    const selectedGeneratedAds = generatedAds.filter((_, index) => selectedAds[index])

    for (let i = 0; i < selectedGeneratedAds.length; i++) {
      const genAd = selectedGeneratedAds[i]
      const originalIndex = generatedAds.findIndex(ad => ad === genAd)
      const campaignName = aiCampaignNames[originalIndex]

      const newAd: AdType = {
        title: genAd.title,
        display_url: aiDisplayUrl,
        url: aiLandingUrl,
        description: genAd.description,
        description2: genAd.description2,
        priority: originalIndex + 1, // Priority based on position (1, 2, 3, etc.)
        utm_source: "google",
        utm_medium: "paid_search",
        utm_campaign: campaignName,
      }

      const response = await fetch("/api/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: aiKeyword,
          ad: newAd,
          editing: -1,
        }),
      })

      if (response.ok) {
        setAds(prev => [...prev, { keyword: aiKeyword, ad: newAd }])
      }
    }

    // Clear the generator state
    setGeneratedAds([])
    setSelectedAds([])
    setAiKeyword("")
    setAiDisplayUrl("")
    setAiLandingUrl("")
    setAiCampaignNames([])
    setShowAIGenerator(false)
  }

  function groupAdsByKeyword() {
    const groups: { [key: string]: AdConfig[] } = {}
    filteredAds.forEach(item => {
      if (!groups[item.keyword]) {
        groups[item.keyword] = []
      }
      groups[item.keyword].push(item)
    })

    // Sort ads within each group by priority
    Object.keys(groups).forEach(keyword => {
      groups[keyword].sort((a, b) => (a.ad.priority || 1) - (b.ad.priority || 1))
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 google-font">Ad Campaign Manager</h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 google-font">
                ← Back to Search
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content - Single Column */}
        <div className="space-y-6">
          {/* Header with New Ad Button */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
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

              <div className="flex gap-3">
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        resetForm()
                        setIsModalOpen(true)
                      }}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Ad
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editing >= 0 ? "Edit Ad" : "Create New Ad"}</DialogTitle>
                      <DialogDescription>
                        {editing >= 0 ? "Update the ad details below" : "Fill out the form to create a new ad"}
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-6">
                      {/* Basic Info Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
                          Basic Information
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Keyword *</label>
                          <Input
                            name="keyword"
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            placeholder="e.g., mortgage rates"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ad Title *</label>
                          <Input
                            name="title"
                            value={ad.title}
                            onChange={e => setAd({ ...ad, title: e.target.value })}
                            placeholder="e.g., Best Mortgage Rates 2024"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Display URL *</label>
                          <Input
                            name="display_url"
                            value={ad.display_url}
                            onChange={e => setAd({ ...ad, display_url: e.target.value })}
                            placeholder="e.g., yoursite.com"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Landing Page URL *</label>
                          <Input
                            name="url"
                            type="url"
                            value={ad.url}
                            onChange={e => setAd({ ...ad, url: e.target.value })}
                            placeholder="e.g., https://yoursite.com/mortgage-rates"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description Line 1 *</label>
                          <Textarea
                            name="description"
                            value={ad.description}
                            onChange={e => setAd({ ...ad, description: e.target.value })}
                            placeholder="e.g., Compare rates from top lenders. Apply online in minutes."
                            rows={2}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description Line 2</label>
                          <Textarea
                            name="description2"
                            value={ad.description2 || ""}
                            onChange={e => setAd({ ...ad, description2: e.target.value })}
                            placeholder="e.g., Free quotes available. No hidden fees or obligations."
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Campaign Settings */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
                          Campaign Settings
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                          <Input
                            name="utm_campaign"
                            value={ad.utm_campaign}
                            onChange={e => setAd({ ...ad, utm_campaign: e.target.value })}
                            placeholder="e.g., mortgage-rates-q4-2024"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ad Priority</label>
                          <Select
                            value={ad.priority?.toString() || "1"}
                            onValueChange={value => setAd({ ...ad, priority: parseInt(value) })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 (Highest)</SelectItem>
                              <SelectItem value="2">2 (Medium)</SelectItem>
                              <SelectItem value="3">3 (Lowest)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                          {editing >= 0 ? "Update Ad" : "Create Ad"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* AI Generator Button */}
                <Button className="bg-blue-600" onClick={() => setShowAIGenerator(!showAIGenerator)}>
                  ✨ AI Generator
                </Button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  placeholder="Search by keyword or ad title..."
                  className="pl-10"
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

              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="text-sm text-gray-700 google-font">Show:</label>
                <Select
                  value={adsPerPage.toString()}
                  onValueChange={value => {
                    setAdsPerPage(Number(value))
                    setCurrentPage(1) // Reset to first page when changing page size
                  }}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-700 google-font">keywords</span>
              </div>
            </div>
          </div>

          {/* AI Generator Panel */}
          {showAIGenerator && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✨ AI Ad Generator
                  {useCustomPrompt && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Custom Prompt
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Generate multiple ad variations using AI to kickstart your campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Configuration */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">AI Prompt Configuration</label>
                      <input
                        type="checkbox"
                        checked={useCustomPrompt}
                        onChange={e => {
                          setUseCustomPrompt(e.target.checked)
                          savePromptConfig()
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Use custom prompt</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPromptConfig(!showPromptConfig)}
                      className="text-blue-600 hover:text-blue-800">
                      {showPromptConfig ? "Hide" : "Configure"}
                    </Button>
                  </div>

                  {showPromptConfig && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Custom AI Prompt Template
                        </label>
                        <Textarea
                          value={customPrompt}
                          onChange={e => setCustomPrompt(e.target.value)}
                          placeholder={getDefaultPrompt()}
                          rows={8}
                          className="text-sm"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Use placeholders: {"{keyword}"}, {"{displayUrl}"}, {"{landingUrl}"}, {"{numAds}"}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomPrompt(getDefaultPrompt())
                            savePromptConfig()
                          }}>
                          Reset to Default
                        </Button>
                        <Button size="sm" onClick={savePromptConfig} className="bg-green-600 hover:bg-green-700">
                          Save Prompt
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Keyword *</label>
                  <Input
                    value={aiKeyword}
                    onChange={e => setAiKeyword(e.target.value)}
                    placeholder="e.g., personal loans, web design, accounting services"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display URL *</label>
                    <Input
                      value={aiDisplayUrl}
                      onChange={e => setAiDisplayUrl(e.target.value)}
                      placeholder="www.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Landing URL *</label>
                    <Input
                      value={aiLandingUrl}
                      onChange={e => setAiLandingUrl(e.target.value)}
                      placeholder="https://www.example.com/landing-page"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Ads to Generate</label>
                  <Select
                    value={numAdsToGenerate.toString()}
                    onValueChange={value => setNumAdsToGenerate(Number(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 ad</SelectItem>
                      <SelectItem value="2">2 ads</SelectItem>
                      <SelectItem value="3">3 ads</SelectItem>
                      <SelectItem value="4">4 ads</SelectItem>
                      <SelectItem value="5">5 ads</SelectItem>
                      <SelectItem value="6">6 ads</SelectItem>
                      <SelectItem value="8">8 ads</SelectItem>
                      <SelectItem value="10">10 ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAiKeyword("")
                      setAiDisplayUrl("")
                      setAiLandingUrl("")
                      setGeneratedAds([])
                      setSelectedAds([])
                      setAiCampaignNames([])
                    }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateAds}
                    disabled={isGenerating || !aiKeyword.trim() || !aiDisplayUrl.trim() || !aiLandingUrl.trim()}
                    size="sm">
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      "Generate Variations"
                    )}
                  </Button>
                </div>

                {/* Generated Ads Preview */}
                {generatedAds.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">Generated Ad Variations</h4>
                      <span className="text-sm text-gray-600">Select ads to create</span>
                    </div>

                    {generatedAds.map((ad, index) => (
                      <Card key={index} className="border-gray-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedAds[index]}
                                onChange={e => {
                                  const newSelected = [...selectedAds]
                                  newSelected[index] = e.target.checked
                                  setSelectedAds(newSelected)
                                }}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <div className="space-y-1">
                                <div className="text-blue-600 font-medium">{ad.title}</div>
                                <div className="text-green-600 text-sm">{aiDisplayUrl}</div>
                                <div className="text-gray-700 text-sm">{ad.description}</div>
                                {ad.description2 && <div className="text-gray-700 text-sm">{ad.description2}</div>}
                                <div className="text-xs text-gray-500">
                                  Campaign:{" "}
                                  {aiCampaignNames[index] ||
                                    `${aiKeyword.replace(/\s+/g, "-").toLowerCase()}-campaign-${index + 1}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        onClick={() => {
                          setGeneratedAds([])
                          setSelectedAds([])
                          setAiKeyword("")
                          setAiDisplayUrl("")
                          setAiLandingUrl("")
                          setAiCampaignNames([])
                        }}
                        variant="outline"
                        size="sm">
                        Clear All
                      </Button>
                      <Button onClick={handleCreateSelectedAds} disabled={!selectedAds.some(Boolean)} size="sm">
                        Create Selected ({selectedAds.filter(Boolean).length})
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ad List */}
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {isLoadingAds ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="text-lg text-gray-600 google-font">Loading ads...</span>
                  </div>
                </div>
              ) : Object.keys(paginationData.groups).length === 0 ? (
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
                  <div className="p-6 pb-8">
                    <Accordion type="multiple" className="space-y-4">
                      {Object.entries(paginationData.groups).map(([keywordName, keywordAds]) => (
                        <AccordionItem key={keywordName} value={keywordName} className="border rounded-lg shadow-sm">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-medium text-gray-900 google-font">
                                  &ldquo;{keywordName}&rdquo;
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 google-font">
                                  {keywordAds.length} ad{keywordAds.length !== 1 ? "s" : ""}
                                </span>
                                <Link
                                  href={`/?q=${encodeURIComponent(keywordName)}`}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors google-font"
                                  onClick={e => e.stopPropagation()}>
                                  View Search
                                </Link>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-4">
                              {keywordAds.map((item, i) => {
                                const originalIndex = ads.findIndex(ad => ad === item)
                                return (
                                  <div
                                    key={originalIndex}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
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
                                          <span className="text-lg text-blue-700 font-medium google-font break-words">
                                            {item.ad.title}
                                          </span>
                                        </div>
                                        <div className="text-green-700 text-sm mb-1 google-font break-words">
                                          {item.ad.display_url}
                                        </div>
                                        <div className="text-gray-700 text-sm google-font break-words">
                                          {item.ad.description}
                                        </div>
                                        {item.ad.description2 && (
                                          <div className="text-gray-700 text-sm google-font break-words">
                                            {item.ad.description2}
                                          </div>
                                        )}

                                        <div className="mt-3 text-xs text-gray-500 google-font">
                                          <div className="break-all">
                                            Final URL: <span className="text-blue-600">{item.ad.url}</span>
                                          </div>
                                          {item.ad.utm_campaign && (
                                            <div className="break-words">Campaign: {item.ad.utm_campaign}</div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                                        <Button
                                          onClick={() => handleEdit(filteredAds.findIndex(ad => ad === item))}
                                          variant="ghost"
                                          size="sm"
                                          className="text-blue-600 hover:text-blue-800 p-2">
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          onClick={() => handleDelete(filteredAds.findIndex(ad => ad === item))}
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-800 p-2">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>

                  {/* Pagination */}
                  {paginationData.totalPages > 1 && (
                    <div className="p-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700 google-font">
                          Showing page {paginationData.currentPage} of {paginationData.totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={!paginationData.hasPrevPage}
                            variant="outline"
                            size="sm">
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                              const pageNum = i + 1
                              return (
                                <Button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  variant={pageNum === currentPage ? "default" : "outline"}
                                  size="sm"
                                  className="w-8 h-8 p-0">
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>
                          <Button
                            onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                            disabled={!paginationData.hasNextPage}
                            variant="outline"
                            size="sm">
                            Next
                          </Button>
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
  )
}
