# WV Construction — Web App Setup Guide

## Overview

This is the full web-based version of the WV Construction business management system, rebuilt from the Windows app specification.

**Company:** ACOR Building and Property Solutions Ltd (t/a WV Construction) · Reg. 9287377

---

## Tech Stack

- **Next.js 14** (App Router, Server Components, Server Actions)
- **TypeScript** (strict)
- **Tailwind CSS + shadcn/ui** (navy/gold brand theme)
- **Prisma ORM** (SQLite for dev, PostgreSQL-ready)
- **OpenAI API** (GPT-4o for quote assist, DALL-E 3 for visuals)

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-..."   # Optional — AI features stub without it
```

### 3. Set up database

```bash
npm run db:push       # Create database from schema
npm run db:seed       # Seed rates library + settings
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. For production

```bash
npm run build
npm start
```

---

## Switching to PostgreSQL

1. Change `DATABASE_URL` in `.env` to your Postgres connection string
2. Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`
3. Run `npm run db:migrate` (creates a migration)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Dashboard
│   ├── clients/                  # Client CRUD
│   ├── quotes/                   # Quote management
│   │   └── [id]/pdf/route.ts    # Quote PDF generation
│   ├── invoices/                 # Invoice management
│   │   └── [id]/pdf/route.ts    # Invoice PDF generation
│   ├── signoff/                  # Project sign-off docs
│   │   └── [id]/pdf/route.ts    # Sign-off PDF
│   ├── rates/                    # Rates library
│   ├── visuals/                  # AI-generated visuals
│   ├── settings/                 # Company settings
│   └── api/                      # All API routes
│       ├── clients/
│       ├── quotes/
│       │   └── [id]/
│       │       ├── generate-invoice/   # Generate invoice from quote
│       │       └── duplicate/
│       ├── invoices/
│       ├── signoff/
│       ├── rates/
│       ├── visuals/
│       ├── upload/                     # Image upload + attachment
│       ├── settings/
│       ├── refs/                       # Sequential ref generation
│       ├── ai/
│       │   ├── quote-assist/          # AI quote wording
│       │   └── generate-visual/       # AI image generation
│       └── pdf/terms/                 # Terms of engagement PDF
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx
│   │   └── sidebar-nav.tsx
│   ├── shared/
│   │   ├── page-header.tsx
│   │   ├── stat-card.tsx
│   │   ├── camera-icon-indicator.tsx  # Camera icon for image attachments
│   │   ├── confirm-delete-dialog.tsx
│   │   ├── client-autocomplete.tsx    # Client search with create-new
│   │   └── attachment-uploader.tsx    # Image upload component
│   ├── forms/
│   │   ├── client-form.tsx
│   │   └── line-items-table.tsx
│   └── ui/                            # shadcn/ui components
├── lib/
│   ├── prisma.ts                      # Prisma client singleton
│   ├── refs.ts                        # Sequential ref number generation
│   └── utils.ts                       # formatCurrency, formatDate etc
└── hooks/
    └── use-toast.ts
```

---

## Reference Number Format

| Document    | Format       | Example       |
|-------------|-------------|---------------|
| Quote       | WVC-Q-{n}   | WVC-Q-1001    |
| Invoice     | WVC-I-{n}   | WVC-I-1001    |
| Sign-Off    | WVC-S-{n}   | WVC-S-1001    |

---

## PDF Generation

All PDFs are served as styled HTML from API routes at:
- `/quotes/[id]/pdf`
- `/invoices/[id]/pdf`
- `/signoff/[id]/pdf`
- `/api/pdf/terms?quoteId=[id]` (terms of engagement, optionally linked to quote)

Open these URLs in a browser and use browser Print → Save as PDF for high-quality PDFs.

---

## AI Features

**Quote Assist** (`/api/ai/quote-assist`)
- Takes rough notes and expands to professional quote wording
- Uses GPT-4o
- Stub mode if `OPENAI_API_KEY` not set

**Visual Generation** (`/api/ai/generate-visual`)
- Generates inspiration boards or architectural visualisations
- Uses DALL-E 3
- Returns placeholder SVG in stub mode

---

## File Uploads

Images are stored in `public/uploads/{parentType}/{parentId}/` and served as static files.

Upload limits: 10MB per image, JPEG/PNG/WebP/GIF supported.

---

## Key Bug Fixes vs Windows Version

1. **Client save — first click only**: `POST /api/clients` persists immediately, no second click required
2. **Visual save persistence**: `POST /api/visuals` persists the record before returning — no lost saves
3. **Generate Invoice from Quote**: Creates independent invoice copy; original quote unchanged
4. **Camera icon accuracy**: `hasImages` on parent record updated in real-time on upload/delete
5. **Multi-client address book**: Each client is a distinct database record with unique CUID

---

## MANUAL TEST CHECKLIST

### Client Tests
- [ ] Create Client A → Save → Record exists in directory
- [ ] Create Client B → Save → Record exists separately (not overwriting A)
- [ ] Create Client C → Save → Record exists separately
- [ ] Refresh browser → All 3 clients still present
- [ ] Search client list by first 2–3 letters → Correct results
- [ ] Edit a client → Changes persist
- [ ] No "continue editing" or second-click save required
- [ ] Create new client inline from quote form → Client saved and selected

### Quote Tests
- [ ] New quote using existing client → Autocomplete works
- [ ] New quote creating inline client → Client saved once, quote proceeds
- [ ] Add 3+ line items → Totals calculate correctly
- [ ] Save quote → WVC-Q-#### reference assigned
- [ ] Reopen saved quote → All data present
- [ ] Export quote PDF → Professional layout with company branding
- [ ] Attach image to quote → Camera icon appears in saved quotes list
- [ ] Duplicate quote → New ref assigned, original unchanged
- [ ] AI quote assist → Wording returned (or stub if no API key)

### Invoice Tests
- [ ] Click Generate Invoice on a saved quote → Invoice WVC-I-#### created
- [ ] Original quote still exists unchanged
- [ ] Invoice shows "Generated from quote" banner with source ref
- [ ] Edit invoice line items → Changes don't affect original quote
- [ ] Save invoice → Persists
- [ ] Export invoice PDF → Professional layout
- [ ] Create standalone invoice (not from quote) → Works independently

### Sign-Off Tests
- [ ] Create sign-off linked to client → Saves with WVC-S-#### ref
- [ ] Add summary, notes, completion date
- [ ] Link to related quote and invoice
- [ ] Attach image → Camera icon appears in saved sign-off list
- [ ] Reopen sign-off → All data present
- [ ] Export sign-off PDF → Includes signature boxes

### Visual Save Tests
- [ ] Go to Visuals → Generate Visual
- [ ] Enter prompt → Click Generate → Preview appears
- [ ] Click Save (once) → Record persisted to database
- [ ] Navigate to Visuals list → New visual appears
- [ ] Refresh browser → Visual still present
- [ ] Repeat for Visualisation type
- [ ] Link visual to client → Visible on client detail page
- [ ] Delete visual → Removed from gallery

### Client History Tests
- [ ] Open client detail page → Shows linked quotes
- [ ] Shows linked invoices
- [ ] Shows linked sign-offs
- [ ] Shows linked visuals
- [ ] Click linked document → Opens correctly

### Rates Library Tests
- [ ] View pre-seeded rates by category
- [ ] Add new rate → Appears in list immediately
- [ ] Edit rate → Change persists
- [ ] Delete rate → Removed from library
- [ ] Search/filter rates

### Dashboard Tests
- [ ] Stats show correct counts
- [ ] Recent quotes listed with camera icon if images
- [ ] Recent invoices listed
- [ ] Recent clients listed
- [ ] Quick action cards navigate correctly

### Settings Tests
- [ ] Update company name → Appears in PDF exports
- [ ] Update default terms → Pre-filled in new quotes
- [ ] Update payment terms → Pre-filled in new invoices
