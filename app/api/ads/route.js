import { Pool } from "pg"
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function ensureDbAndTable() {
  // Create database if not exists (must connect to default db for this, so skip here)
  // Create table if not exists
  await pool.query(`CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    keyword TEXT NOT NULL,
    title TEXT NOT NULL,
    display_url TEXT NOT NULL,
    final_url TEXT NOT NULL,
    description TEXT NOT NULL,
    description2 TEXT,
    priority INTEGER DEFAULT 1,
    utm_source TEXT DEFAULT 'google',
    utm_medium TEXT DEFAULT 'paid_search',
    utm_campaign TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)
}

export async function GET(req) {
  await ensureDbAndTable()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  if (q) {
    // Find ads for this keyword (limit to 3, ordered by priority)
    const { rows } = await pool.query(
      "SELECT * FROM ads WHERE LOWER(keyword) = LOWER($1) ORDER BY priority DESC, created_at ASC LIMIT 3",
      [q],
    )
    // Attach UTM params to ad URL
    return Response.json(
      rows.map(row => ({
        title: row.title,
        display_url: row.display_url,
        url: row.final_url + buildUtm(row, q),
        description: row.description,
        description2: row.description2,
        utm_source: row.utm_source,
        utm_medium: row.utm_medium,
        utm_campaign: row.utm_campaign,
      })),
    )
  }
  // Return all ads for admin
  const getAllResult1 = await pool.query("SELECT * FROM ads ORDER BY keyword ASC, priority DESC, created_at ASC")
  return Response.json(
    getAllResult1.rows.map(row => ({
      keyword: row.keyword,
      ad: {
        title: row.title,
        display_url: row.display_url,
        url: row.final_url,
        description: row.description,
        description2: row.description2,
        priority: row.priority,
        utm_source: row.utm_source || "google",
        utm_medium: row.utm_medium || "paid_search",
        utm_campaign: row.utm_campaign,
      },
    })),
  )
}

export async function POST(req) {
  await ensureDbAndTable()
  const { keyword, ad, editing } = await req.json()

  // Set defaults
  const utmSource = ad.utm_source || "google"
  const utmMedium = ad.utm_medium || "paid_search"
  const priority = ad.priority || 1

  // If editing, update by id (editing is index in admin list)
  if (editing >= 0) {
    // Get all ads to find the id at this index
    const { rows } = await pool.query("SELECT id FROM ads ORDER BY keyword ASC, priority DESC, created_at ASC")
    const id = rows[editing]?.id
    if (id) {
      await pool.query(
        "UPDATE ads SET keyword=$1, title=$2, display_url=$3, final_url=$4, description=$5, description2=$6, priority=$7, utm_source=$8, utm_medium=$9, utm_campaign=$10 WHERE id=$11",
        [
          keyword,
          ad.title,
          ad.display_url,
          ad.url,
          ad.description,
          ad.description2,
          priority,
          utmSource,
          utmMedium,
          ad.utm_campaign,
          id,
        ],
      )
    }
  } else {
    await pool.query(
      "INSERT INTO ads (keyword, title, display_url, final_url, description, description2, priority, utm_source, utm_medium, utm_campaign) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        keyword,
        ad.title,
        ad.display_url,
        ad.url,
        ad.description,
        ad.description2,
        priority,
        utmSource,
        utmMedium,
        ad.utm_campaign,
      ],
    )
  }
  // Return all ads for admin
  const getAllResult2 = await pool.query("SELECT * FROM ads ORDER BY keyword ASC, priority DESC, created_at ASC")
  return Response.json(
    getAllResult2.rows.map(row => ({
      keyword: row.keyword,
      ad: {
        title: row.title,
        display_url: row.display_url,
        url: row.final_url,
        description: row.description,
        description2: row.description2,
        priority: row.priority,
        utm_source: row.utm_source || "google",
        utm_medium: row.utm_medium || "paid_search",
        utm_campaign: row.utm_campaign,
      },
    })),
  )
}

export async function DELETE(req) {
  await ensureDbAndTable()
  const { index } = await req.json()
  // Get all ads to find the id at this index
  const idResult = await pool.query("SELECT id FROM ads ORDER BY keyword ASC, priority DESC, created_at ASC")
  const id = idResult.rows[index]?.id
  if (id) {
    await pool.query("DELETE FROM ads WHERE id=$1", [id])
  }
  // Return all ads for admin
  const allResult = await pool.query("SELECT * FROM ads ORDER BY keyword ASC, priority DESC, created_at ASC")
  return Response.json(
    allResult.rows.map(row => ({
      keyword: row.keyword,
      ad: {
        title: row.title,
        display_url: row.display_url,
        url: row.final_url,
        description: row.description,
        description2: row.description2,
        priority: row.priority,
        utm_source: row.utm_source || "google",
        utm_medium: row.utm_medium || "paid_search",
        utm_campaign: row.utm_campaign,
      },
    })),
  )
}

function buildUtm(ad, keyword = "") {
  const params = []

  // Auto-set utm_content to ad title and utm_term to keyword
  if (ad.title) params.push(`utm_content=${encodeURIComponent(ad.title)}`)
  if (keyword) params.push(`utm_term=${encodeURIComponent(keyword)}`)

  if (ad.utm_source) params.push(`utm_source=${encodeURIComponent(ad.utm_source)}`)
  if (ad.utm_medium) params.push(`utm_medium=${encodeURIComponent(ad.utm_medium)}`)
  if (ad.utm_campaign) params.push(`utm_campaign=${encodeURIComponent(ad.utm_campaign)}`)

  // Use ad.final_url for UTM logic, fallback to ad.url for legacy
  const url = ad.final_url || ad.url || ""
  return params.length ? (url.includes("?") ? "&" : "?") + params.join("&") : ""
}
