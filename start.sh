#!/bin/sh
# Startup script: initialise database on first boot, then start the app

DB_FILE=${DATABASE_URL#file:}
DB_FILE=${DB_FILE:-./dev.db}

if [ ! -f "$DB_FILE" ]; then
  echo "Database not found — running migrations and seed..."
  npx prisma db push --skip-generate
  npx tsx prisma/seed.ts
  echo "Database initialised."
else
  echo "Database exists — applying any pending schema changes..."
  npx prisma db push --skip-generate
fi

exec node server.js
