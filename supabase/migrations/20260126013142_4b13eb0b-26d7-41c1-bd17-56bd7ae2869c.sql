-- Add foreign key for claimed_by if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'courses_claimed_by_fkey' 
    AND table_name = 'courses'
  ) THEN
    ALTER TABLE public.courses 
    ADD CONSTRAINT courses_claimed_by_fkey 
    FOREIGN KEY (claimed_by) REFERENCES public.profiles(id);
  END IF;
END $$;