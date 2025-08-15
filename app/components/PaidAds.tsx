type PaidAd = {
  title: string
  display_url: string
  url: string
  description: string
  description2?: string
}

interface PaidAdsProps {
  ads: PaidAd[]
  loading?: boolean
  currentQuery?: string
}

export default function PaidAds({ ads, loading, currentQuery }: PaidAdsProps) {
  const handleAdClick = (ad: PaidAd) => {
    // Emit custom event for UTM tracking
    const adClickEvent = new CustomEvent("adClick", {
      detail: {
        url: ad.url,
        keyword: currentQuery || "",
        adTitle: ad.title,
      },
    })
    window.dispatchEvent(adClickEvent)
  }
  if (loading) {
    return (
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="text-gray-500 text-center py-4 google-font">Loading ads...</div>
      </div>
    )
  }

  if (ads.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      {ads.map((ad, i) => (
        <div key={i} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 google-font">
              Sponsored
            </span>
          </div>
          <div className="mb-1">
            <a
              href={ad.url}
              target="_blank"
              rel="noopener"
              onClick={() => handleAdClick(ad)}
              className="text-xl text-blue-700 hover:underline visited:text-purple-700 google-font">
              {ad.title}
            </a>
          </div>
          <div className="text-green-700 text-sm mb-1 google-font">{ad.display_url || ad.url}</div>
          <div className="text-gray-700 text-sm leading-5 google-font">{ad.description}</div>
          {ad.description2 && <div className="text-gray-700 text-sm leading-5 google-font">{ad.description2}</div>}
        </div>
      ))}
    </div>
  )
}
