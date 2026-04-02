-- Run this in Supabase SQL Editor before running seed-5th-cohort.ts
ALTER TABLE startups ADD COLUMN IF NOT EXISTS team JSONB DEFAULT '[]'::jsonb;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS revenue_model TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS one_pager_link TEXT;
