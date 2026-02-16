
-- Add contributor comment and source links to skill_edit_proposals
ALTER TABLE public.skill_edit_proposals
ADD COLUMN IF NOT EXISTS contributor_comment TEXT,
ADD COLUMN IF NOT EXISTS source_links TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS edited_content JSONB,
ADD COLUMN IF NOT EXISTS edited_by TEXT,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
