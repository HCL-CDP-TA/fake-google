-- Demo Scenarios Database Schema for Martech Demos

-- Scenarios table - stores demo scenario metadata
CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    target_website VARCHAR(500),
    demo_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Scenario searches - defines the search sequence for a scenario
CREATE TABLE IF NOT EXISTS scenario_searches (
    id SERIAL PRIMARY KEY,
    scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
    search_order INTEGER NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    stage VARCHAR(50), -- awareness, consideration, intent, decision, retention
    demo_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenario ads - ads associated with each search in a scenario
CREATE TABLE IF NOT EXISTS scenario_ads (
    id SERIAL PRIMARY KEY,
    scenario_search_id INTEGER REFERENCES scenario_searches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    display_url VARCHAR(255) NOT NULL,
    final_url VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    description2 TEXT,
    priority INTEGER DEFAULT 1,
    utm_source VARCHAR(100) DEFAULT 'google',
    utm_medium VARCHAR(100) DEFAULT 'cpc',
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    expected_personalization TEXT,
    email_trigger VARCHAR(255),
    demo_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample martech demo scenarios
INSERT INTO scenarios (name, description, industry, target_website, demo_notes) VALUES
('Mortgage Customer Journey', 'Complete mortgage lending funnel from awareness to conversion', 'Financial Services', 'https://your-mortgage-site.com', 'Demonstrates multi-touchpoint attribution and progressive personalization'),
('B2B SaaS Trial Conversion', 'Enterprise software evaluation and trial signup journey', 'Technology', 'https://your-saas-platform.com', 'Shows intent-based personalization and lead scoring'),
('E-commerce Holiday Campaign', 'Seasonal shopping behavior with retargeting scenarios', 'Retail', 'https://your-ecommerce-site.com', 'Perfect for demonstrating dynamic product recommendations'),
('Local Services Lead Gen', 'Local business discovery and contact form completion', 'Professional Services', 'https://your-local-business.com', 'Showcases location-based personalization and immediate follow-up');

-- Sample mortgage customer journey
INSERT INTO scenario_searches (scenario_id, search_order, keyword, stage, demo_notes) VALUES
(1, 1, 'mortgage rates today', 'awareness', 'Show educational content personalization'),
(1, 2, 'mortgage calculator', 'consideration', 'Interactive tools drive engagement'),
(1, 3, 'pre approval mortgage', 'intent', 'Lead capture with progressive profiling'),
(1, 4, 'best mortgage lender reviews', 'decision', 'Social proof and competitive positioning'),
(1, 5, 'refinance current mortgage', 'retention', 'Customer lifecycle management');

-- Sample ads for mortgage awareness stage
INSERT INTO scenario_ads (scenario_search_id, title, display_url, final_url, description, description2, priority, utm_campaign, utm_content, utm_term, expected_personalization, email_trigger, demo_notes) VALUES
(1, 'Today''s Lowest Mortgage Rates', 'bestrates.com/mortgage', 'https://your-mortgage-site.com/rates', 'See today''s rates from top lenders. Compare and save thousands on your home loan.', 'No hidden fees. Get pre-qualified in 60 seconds.', 3, 'awareness_mortgage_2024', 'lowest_rates_today', 'mortgage_rates_today', 'Hero banner shows current rates, mortgage calculator widget prominent', 'mortgage_awareness_sequence', 'Point out personalized rate display based on UTM params'),
(1, 'Compare Mortgage Rates - Save $$$', 'mortgagecompare.com', 'https://your-mortgage-site.com/compare', 'Free comparison of 50+ lenders. See your rate in minutes without affecting credit.', 'Trusted by 2M+ homeowners nationwide.', 2, 'awareness_mortgage_2024', 'compare_save_money', 'mortgage_rates_today', 'Comparison table with highlighted best offers', 'mortgage_comparison_sequence', 'Show how different UTM content changes the landing page focus'),
(1, 'First-Time Buyer? Start Here', 'firsttimehomes.com', 'https://your-mortgage-site.com/first-time', 'Special programs for first-time buyers. Down payment as low as 3%.', 'Free homebuyer education and dedicated support.', 1, 'awareness_mortgage_2024', 'first_time_buyer', 'mortgage_rates_today', 'First-time buyer resources and programs highlighted', 'first_time_buyer_sequence', 'Demonstrate how the same search keyword can trigger different personalization');

-- Sample ads for consideration stage
INSERT INTO scenario_ads (scenario_search_id, title, display_url, final_url, description, description2, priority, utm_campaign, utm_content, utm_term, expected_personalization, email_trigger, demo_notes) VALUES
(2, 'Free Mortgage Calculator + Rates', 'calculate.mortgage.com', 'https://your-mortgage-site.com/calculator', 'Calculate payments with today''s rates. See how much house you can afford.', 'Includes taxes, insurance, and PMI calculations.', 3, 'consideration_mortgage_2024', 'mortgage_calculator_tool', 'mortgage_calculator', 'Calculator pre-populated with competitive rates, prominent "Get Pre-Approved" CTA', 'mortgage_calculator_engagement', 'Show how tool usage triggers progressive profiling'),
(2, 'How Much House Can I Afford?', 'affordability.homes.com', 'https://your-mortgage-site.com/affordability', 'Use our affordability calculator to find your ideal home price range.', 'Factor in your income, debts, and down payment.', 2, 'consideration_mortgage_2024', 'affordability_calculator', 'mortgage_calculator', 'Affordability tool with local market data integration', 'affordability_assessment_sequence', 'Demonstrate data enrichment based on user interaction');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_active ON scenarios(is_active);
CREATE INDEX IF NOT EXISTS idx_scenario_searches_scenario_order ON scenario_searches(scenario_id, search_order);
CREATE INDEX IF NOT EXISTS idx_scenario_ads_search_priority ON scenario_ads(scenario_search_id, priority DESC);
