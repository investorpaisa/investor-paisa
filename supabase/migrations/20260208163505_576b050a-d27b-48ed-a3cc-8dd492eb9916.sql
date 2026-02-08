-- Fix #1: Create SECURITY DEFINER function for safe DM conversation creation
-- This bypasses RLS to allow User A to add User B as participant

CREATE OR REPLACE FUNCTION public.get_or_create_dm_conversation(
  p_user_a uuid,
  p_user_b uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Validate inputs
  IF p_user_a IS NULL OR p_user_b IS NULL THEN
    RAISE EXCEPTION 'Both user IDs are required';
  END IF;
  
  IF p_user_a = p_user_b THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  -- Check for existing DM conversation between these two users
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  JOIN conversations c ON c.id = cp1.conversation_id
  WHERE cp1.user_id = p_user_a 
    AND cp2.user_id = p_user_b
    AND c.is_group = false
    AND c.type = 'direct'
  LIMIT 1;

  -- If conversation exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (is_group, type)
  VALUES (false, 'direct')
  RETURNING id INTO v_conversation_id;

  -- Add both participants (this bypasses RLS due to SECURITY DEFINER)
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, p_user_a),
    (v_conversation_id, p_user_b);

  RETURN v_conversation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_dm_conversation(uuid, uuid) TO authenticated;