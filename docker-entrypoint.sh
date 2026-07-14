#!/bin/sh
set -e

echo "Running database migrations..."
node_modules/.bin/tsx server/database/migrate.ts

exec "$@"
