#!/bin/bash
# Bash script to run all Supabase migrations in order
# Usage: ./scripts/run-migrations.sh

set -e

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL not found in environment variables"
    echo "Please set SUPABASE_DB_URL in your .env.local file"
    exit 1
fi

echo "Running Supabase migrations..."
echo ""

cd supabase/migrations

for migration in *.sql; do
    echo "Running: $migration"
    if psql "$SUPABASE_DB_URL" -f "$migration"; then
        echo "  ✓ Success"
    else
        echo "  ✗ Failed"
        exit 1
    fi
    echo ""
done

cd ../..

echo "Migration process completed!"
