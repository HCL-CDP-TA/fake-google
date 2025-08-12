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
echo "CREATE DATABASE $DB_NAME;" | psql "$ADMIN_CONN" 2>/dev/null || echo "Database $DB_NAME may already exist."

# Create the ads table if it doesn't exist
psql "$ADMIN_CONN" -d "$DB_NAME" <<'EOSQL'
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
EOSQL

echo "Database and table setup complete."
