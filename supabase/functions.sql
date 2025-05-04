
-- Get users who are members of a specific structure
CREATE OR REPLACE FUNCTION get_structure_users(p_structure_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  structure_id UUID,
  role TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    su.id, 
    su.user_id, 
    su.structure_id, 
    su.role,
    au.email,
    p.first_name,
    p.last_name
  FROM 
    structure_users su
    JOIN auth.users au ON su.user_id = au.id
    LEFT JOIN profiles p ON su.user_id = p.id
  WHERE 
    su.structure_id = p_structure_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get users who are NOT members of a specific structure
CREATE OR REPLACE FUNCTION get_available_users(p_structure_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    p.first_name,
    p.last_name
  FROM 
    auth.users au
    LEFT JOIN profiles p ON au.id = p.id
  WHERE 
    au.id NOT IN (
      SELECT user_id FROM structure_users 
      WHERE structure_id = p_structure_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a user to a structure
CREATE OR REPLACE FUNCTION add_user_to_structure(
  p_user_id UUID,
  p_structure_id UUID,
  p_role TEXT
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO structure_users (user_id, structure_id, role)
  VALUES (p_user_id, p_structure_id, p_role)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove a user from a structure
CREATE OR REPLACE FUNCTION remove_user_from_structure(
  p_user_id UUID,
  p_structure_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM structure_users 
  WHERE user_id = p_user_id AND structure_id = p_structure_id;
  
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
