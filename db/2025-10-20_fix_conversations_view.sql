-- Drop old views if they exist to ensure a clean slate
DROP VIEW IF EXISTS conversations_view_v2;
DROP VIEW IF EXISTS conversations_view;

-- Create the corrected view named 'conversations_view'
CREATE OR REPLACE VIEW conversations_view AS
WITH last_message_details AS (
  -- 1. Get the latest message for each conversation to find the last message's timestamp
  SELECT
    conversation_id,
    MAX(created_at) AS last_message_at
  FROM messages
  GROUP BY conversation_id
),
conversation_participants_details AS (
  -- 2. Get details of all participants in the conversation
  SELECT
    p.conversation_id,
    array_agg(u.user_id) as participant_ids,
    array_agg(u.full_name) as participant_names,
    json_agg(
      json_build_object(
        'user_id', u.user_id,
        'name', u.full_name,
        'email', u.email
      )
    ) as participants
  FROM conversationparticipants p
  JOIN public.users u ON p.user_id = u.user_id
  GROUP BY p.conversation_id
)
-- 3. Assemble the final view
SELECT
  c.conversation_id,
  c.subject,
  c.created_by,
  c.created_at,
  cpd.participants,
  m.message_content AS latest_message,
  lmd.last_message_at AS latest_message_time,
  -- Calculate unread messages for the Admin (user_id = 1)
  (
    SELECT COUNT(*)
    FROM message_receipts mr
    WHERE mr.message_id IN (
      SELECT message_id FROM messages m2 WHERE m2.conversation_id = c.conversation_id
    )
      AND mr.user_id = 1  -- Admin's user_id
      AND mr.read_at IS NULL
  ) AS unread_count
FROM conversations c
JOIN last_message_details lmd ON c.conversation_id = lmd.conversation_id
JOIN conversation_participants_details cpd ON c.conversation_id = cpd.conversation_id
-- LEFT JOIN to messages to get the content of the very last message
LEFT JOIN messages m ON lmd.conversation_id = m.conversation_id AND lmd.last_message_at = m.created_at;

-- Grant permissions to the authenticated role so the API can access the view
GRANT SELECT ON conversations_view TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

