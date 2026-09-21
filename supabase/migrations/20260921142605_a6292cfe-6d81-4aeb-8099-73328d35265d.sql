CREATE TABLE public.ai_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.namaank_submissions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  dob TEXT NOT NULL,
  birth_time TEXT,
  place TEXT NOT NULL,
  direction TEXT NOT NULL,
  focus TEXT NOT NULL,
  segments JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_reports TO authenticated;
GRANT ALL ON public.ai_reports TO service_role;

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_reports_select_own" ON public.ai_reports
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX ai_reports_user_created_idx ON public.ai_reports (user_id, created_at DESC);
CREATE INDEX ai_reports_submission_idx ON public.ai_reports (submission_id);