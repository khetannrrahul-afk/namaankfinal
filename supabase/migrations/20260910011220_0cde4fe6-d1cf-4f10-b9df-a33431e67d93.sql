GRANT INSERT ON public.namaank_submissions TO anon;

CREATE POLICY submissions_insert_anon
ON public.namaank_submissions
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);