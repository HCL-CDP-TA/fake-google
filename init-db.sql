-- Initialize the fake-google database
-- This script runs automatically when the PostgreSQL container starts

CREATE TABLE IF NOT EXISTS ads (
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
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data if the table is empty
INSERT INTO ads (keyword, title, display_url, final_url, description, description2, priority, utm_campaign)
SELECT * FROM (
  VALUES 
    ('mortgage', 'Your First Mortgage?', 'www.woodburnbank.com', 'https://banking.demo.now.hclsoftware.cloud/en-US/woodburn/home-loans', 'Simple guidance for first-time buyers.', 'Trusted advice. Get pre-approved today!', 1, 'mortgage-campaign-1'),
    ('mortgage', 'Compare Mortgage Rates', 'www.woodburnbank.com', 'https://banking.demo.now.hclsoftware.cloud/en-US/woodburn/home-loans', 'Low rates, flexible terms. Compare options.', 'See how much you can save today. Free quote!', 2, 'mortgage-campaign-2'),
    ('mortgage', 'Exclusive Mortgage Offer', 'www.woodburnbank.com', 'https://banking.demo.now.hclsoftware.cloud/en-US/woodburn/home-loans', 'Personalized service for discerning clients.', 'Experience our bespoke mortgage solutions.', 3, 'mortgage-campaign-3'),
    ('home loan', 'Your First Home Loan', 'www.woodburnbank.com', 'https://banking.demo.now.hclsoftware.cloud/en-US/woodburn/home-loans', 'Easy application, expert help. Get started today!', 'We guide you every step of the way. Low rates!', 1, 'home-loan-campaign-1'),
    ('home loan', 'Compare Home Loans Now', 'www.woodburnbank.com', 'https://banking.demo.now.hclsoftware.cloud/en-US/woodburn/home-loans', 'Low rates, flexible terms. See our competitive offers.', 'Personalized recommendations. Quick & easy comparison.', 2, 'home-loan-campaign-2')
) AS sample_data(keyword, title, display_url, final_url, description, description2, priority, utm_campaign)
WHERE NOT EXISTS (SELECT 1 FROM ads);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ads_keyword ON ads(keyword);
CREATE INDEX IF NOT EXISTS idx_ads_priority ON ads(priority);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);
