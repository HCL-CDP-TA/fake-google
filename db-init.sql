-- Create ads table for fake-google
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  title TEXT NOT NULL,
  display_url TEXT NOT NULL,
  final_url TEXT NOT NULL,
  description TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);
