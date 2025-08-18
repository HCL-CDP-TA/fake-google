#!/bin/bash
# Usage: ./create-db-and-table.sh <admin-connection-string> <database-name>
# Example: ./create-db-and-table.sh "postgres://postgres:admin@localhost:5432/postgres" fakegoogle

ADMIN_CONN="$1"
DB_NAME="$2"

if [ -z "$ADMIN_CONN" ] || [ -z "$DB_NAME" ]; then
  echo "Usage: $0 <admin-connection-string> <database-name>"
  exit 1
fi

# Create the database if it doesn't exist
echo "Creating database $DB_NAME if it doesn't exist..."
echo "CREATE DATABASE $DB_NAME;" | psql "$ADMIN_CONN" 2>/dev/null || echo "Database $DB_NAME may already exist."

# Create the ads table with updated schema
echo "Creating/updating ads table..."
psql "$ADMIN_CONN" -d "$DB_NAME" <<'EOSQL'
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

-- Add missing columns if they don't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ads' AND column_name='description2') THEN
    ALTER TABLE ads ADD COLUMN description2 TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ads' AND column_name='priority') THEN
    ALTER TABLE ads ADD COLUMN priority INTEGER DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ads' AND column_name='utm_content') THEN
    ALTER TABLE ads ADD COLUMN utm_content TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ads' AND column_name='utm_term') THEN
    ALTER TABLE ads ADD COLUMN utm_term TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ads' AND column_name='created_at') THEN
    ALTER TABLE ads ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Update default values for existing rows
UPDATE ads SET 
  priority = 1 WHERE priority IS NULL,
  utm_source = 'google' WHERE utm_source IS NULL,
  utm_medium = 'paid_search' WHERE utm_medium IS NULL;

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

EOSQL

echo "Database and table setup complete."
