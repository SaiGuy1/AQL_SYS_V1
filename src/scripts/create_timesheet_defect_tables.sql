-- Create Timesheet and Defect Tables
-- This script creates the necessary tables for timesheet tracking and defect reporting

-- 1. Create the timesheets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspector_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  total_hours DECIMAL(10, 2),
  is_billable BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  overtime DECIMAL(10, 2) DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Indexes for timesheets
CREATE INDEX IF NOT EXISTS idx_timesheets_inspector_id ON public.timesheets(inspector_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_job_id ON public.timesheets(job_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_clock_in ON public.timesheets(clock_in);
CREATE INDEX IF NOT EXISTS idx_timesheets_is_approved ON public.timesheets(is_approved);

-- 3. Create the defects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.defects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  defect_type_id TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  batch_number TEXT,
  lot_number TEXT,
  quantity INTEGER DEFAULT 1,
  location TEXT,
  images TEXT[],
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'rejected')),
  resolution TEXT,
  comments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes for defects
CREATE INDEX IF NOT EXISTS idx_defects_job_id ON public.defects(job_id);
CREATE INDEX IF NOT EXISTS idx_defects_reported_by ON public.defects(reported_by);
CREATE INDEX IF NOT EXISTS idx_defects_status ON public.defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON public.defects(severity);

-- 5. Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers to update timestamp on both tables
DROP TRIGGER IF EXISTS update_timesheets_timestamp ON public.timesheets;
CREATE TRIGGER update_timesheets_timestamp
BEFORE UPDATE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_defects_timestamp ON public.defects;
CREATE TRIGGER update_defects_timestamp
BEFORE UPDATE ON public.defects
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 7. Create a function to calculate total_hours on clock_out
CREATE OR REPLACE FUNCTION calculate_timesheet_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.clock_out IS NOT NULL AND (OLD.clock_out IS NULL OR OLD.clock_out <> NEW.clock_out) THEN
    -- Calculate the number of hours between clock_in and clock_out
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 3600;
    
    -- Apply minimum billable hours (4 hours) if is_billable is true
    IF NEW.is_billable = true AND NEW.total_hours < 4 THEN
      NEW.total_hours = 4;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the trigger for the calculate_timesheet_hours function
DROP TRIGGER IF EXISTS calculate_timesheet_hours_trigger ON public.timesheets;
CREATE TRIGGER calculate_timesheet_hours_trigger
BEFORE UPDATE ON public.timesheets
FOR EACH ROW
EXECUTE FUNCTION calculate_timesheet_hours();

-- 9. Add comment tracking function for defects
CREATE OR REPLACE FUNCTION add_defect_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- If comments field has changed and both OLD and NEW records exist
  IF (OLD.comments IS DISTINCT FROM NEW.comments) AND OLD.id IS NOT NULL THEN
    -- Store the change in the audit_log table
    INSERT INTO public.audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details
    ) VALUES (
      auth.uid(),
      'update',
      'defect',
      NEW.id,
      jsonb_build_object(
        'field', 'comments',
        'old_value', OLD.comments,
        'new_value', NEW.comments
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for defect comment tracking
DROP TRIGGER IF EXISTS track_defect_comments ON public.defects;
CREATE TRIGGER track_defect_comments
AFTER UPDATE ON public.defects
FOR EACH ROW
WHEN (OLD.comments IS DISTINCT FROM NEW.comments)
EXECUTE FUNCTION add_defect_comment();

-- 11. Enable Row Level Security on both tables
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;

-- 12. Set up RLS policies for the timesheets table (basic policies - full policies in separate file)
CREATE POLICY IF NOT EXISTS "Inspectors can manage their own timesheets"
ON public.timesheets
FOR ALL
USING (inspector_id = auth.uid())
WITH CHECK (inspector_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin and managers can manage all timesheets"
ON public.timesheets
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

-- 13. Set up RLS policies for the defects table (basic policies - full policies in separate file)
CREATE POLICY IF NOT EXISTS "Inspectors can manage defects they reported"
ON public.defects
FOR ALL
USING (reported_by = auth.uid())
WITH CHECK (reported_by = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin and managers can manage all defects"
ON public.defects
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'manager')
));

CREATE POLICY IF NOT EXISTS "Customers can view defects for their jobs"
ON public.defects
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.jobs
  JOIN public.profiles ON profiles.id = auth.uid()
  WHERE jobs.id = defects.job_id
  AND jobs.customer_id = profiles.id
  AND profiles.role = 'customer'
)); 