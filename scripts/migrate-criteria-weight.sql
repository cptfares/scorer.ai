-- Add weight column to round_criteria (default 1 = unweighted)
ALTER TABLE round_criteria ADD COLUMN IF NOT EXISTS weight NUMERIC NOT NULL DEFAULT 1;

-- Set weights for 5th cohort First Phase Pitching round criteria
-- (All main criteria × 4, Impact Bonus × 1)
UPDATE round_criteria
SET weight = 4
WHERE round_id = (
  SELECT id FROM rounds WHERE name = 'First Phase Pitching' LIMIT 1
)
AND name IN (
  'Strength of the Business Idea',
  'Market Attractiveness',
  'Competitive Advantage',
  'Business Model',
  'Team'
);

UPDATE round_criteria
SET weight = 1
WHERE round_id = (
  SELECT id FROM rounds WHERE name = 'First Phase Pitching' LIMIT 1
)
AND name = 'Impact Bonus';
