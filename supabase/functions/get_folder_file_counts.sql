
CREATE OR REPLACE FUNCTION public.get_folder_file_counts(profile_id_param UUID)
RETURNS TABLE(folder_id UUID, count BIGINT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT files.folder_id, COUNT(files.id)::BIGINT
  FROM files
  JOIN folders ON files.folder_id = folders.id
  WHERE folders.profile_id = profile_id_param
  GROUP BY files.folder_id;
END;
$$;
