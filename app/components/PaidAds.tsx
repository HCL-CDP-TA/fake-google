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
}

export default function PaidAds({ ads, loading }: PaidAdsProps) {
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
            <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded border google-font">
              Sponsored
            </span>
          </div>
          <div className="mb-1">
            <a
              href={ad.url}
              target="_blank"
              rel="noopener"
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
