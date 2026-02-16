
-- Add battle notification preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notify_friends_battles boolean DEFAULT false;

-- Add country field to profiles for the map feature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_on_map boolean DEFAULT true;

-- Create function to notify parents and friends when a battle starts
CREATE OR REPLACE FUNCTION public.notify_battle_start()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_challenger_name text;
  v_opponent_name text;
  v_parent RECORD;
  v_friend RECORD;
  v_game_title text;
BEGIN
  -- Only fire when battle transitions to 'in_progress'
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    
    -- Get player names
    SELECT full_name INTO v_challenger_name FROM profiles WHERE id = NEW.challenger_id;
    SELECT full_name INTO v_opponent_name FROM profiles WHERE id = NEW.opponent_id;
    
    -- Get game title if available
    IF NEW.game_id IS NOT NULL THEN
      SELECT title INTO v_game_title FROM game_templates WHERE id = NEW.game_id;
    END IF;

    -- Notify parents of challenger
    FOR v_parent IN 
      SELECT pc.parent_id FROM parent_children pc WHERE pc.child_id = NEW.challenger_id
    LOOP
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        v_parent.parent_id,
        'battle',
        '🎮 Your child is battling!',
        COALESCE(v_challenger_name, 'Your child') || ' started a battle against ' || COALESCE(v_opponent_name, 'an opponent') || COALESCE(' in ' || v_game_title, ''),
        jsonb_build_object('battle_id', NEW.id, 'child_id', NEW.challenger_id, 'type', 'parent_notification')
      );
    END LOOP;

    -- Notify parents of opponent
    IF NEW.opponent_id IS NOT NULL THEN
      FOR v_parent IN 
        SELECT pc.parent_id FROM parent_children pc WHERE pc.child_id = NEW.opponent_id
      LOOP
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          v_parent.parent_id,
          'battle',
          '🎮 Your child is battling!',
          COALESCE(v_opponent_name, 'Your child') || ' started a battle against ' || COALESCE(v_challenger_name, 'an opponent') || COALESCE(' in ' || v_game_title, ''),
          jsonb_build_object('battle_id', NEW.id, 'child_id', NEW.opponent_id, 'type', 'parent_notification')
        );
      END LOOP;
    END IF;

    -- Notify opted-in friends of challenger
    FOR v_friend IN
      SELECT f.addressee_id AS friend_id FROM friendships f
        JOIN profiles p ON p.id = f.addressee_id
        WHERE f.requester_id = NEW.challenger_id AND f.status = 'accepted' AND p.notify_friends_battles = true
      UNION
      SELECT f.requester_id AS friend_id FROM friendships f
        JOIN profiles p ON p.id = f.requester_id
        WHERE f.addressee_id = NEW.challenger_id AND f.status = 'accepted' AND p.notify_friends_battles = true
    LOOP
      -- Don't notify the opponent (they already know)
      IF v_friend.friend_id != COALESCE(NEW.opponent_id, '00000000-0000-0000-0000-000000000000') THEN
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          v_friend.friend_id,
          'battle',
          '⚔️ Friend is battling!',
          COALESCE(v_challenger_name, 'A friend') || ' started a battle' || COALESCE(' in ' || v_game_title, '') || '. Watch live!',
          jsonb_build_object('battle_id', NEW.id, 'type', 'friend_notification')
        );
      END IF;
    END LOOP;

    -- Notify opted-in friends of opponent
    IF NEW.opponent_id IS NOT NULL THEN
      FOR v_friend IN
        SELECT f.addressee_id AS friend_id FROM friendships f
          JOIN profiles p ON p.id = f.addressee_id
          WHERE f.requester_id = NEW.opponent_id AND f.status = 'accepted' AND p.notify_friends_battles = true
        UNION
        SELECT f.requester_id AS friend_id FROM friendships f
          JOIN profiles p ON p.id = f.requester_id
          WHERE f.addressee_id = NEW.opponent_id AND f.status = 'accepted' AND p.notify_friends_battles = true
      LOOP
        IF v_friend.friend_id != NEW.challenger_id THEN
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES (
            v_friend.friend_id,
            'battle',
            '⚔️ Friend is battling!',
            COALESCE(v_opponent_name, 'A friend') || ' started a battle' || COALESCE(' in ' || v_game_title, '') || '. Watch live!',
            jsonb_build_object('battle_id', NEW.id, 'type', 'friend_notification')
          );
        END IF;
      END LOOP;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_battle_start ON battles;
CREATE TRIGGER trigger_notify_battle_start
  AFTER UPDATE ON battles
  FOR EACH ROW
  EXECUTE FUNCTION notify_battle_start();
