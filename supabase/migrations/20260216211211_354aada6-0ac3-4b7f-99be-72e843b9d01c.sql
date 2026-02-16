
CREATE OR REPLACE FUNCTION public.notify_money_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_name text;
  v_receiver_name text;
BEGIN
  -- Only for completed transfers
  IF NEW.transaction_type = 'transfer' AND NEW.status = 'completed' THEN
    
    SELECT full_name INTO v_sender_name FROM profiles WHERE id = NEW.sender_id;
    SELECT full_name INTO v_receiver_name FROM profiles WHERE id = NEW.receiver_id;

    -- Notify sender
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.sender_id,
      'transaction',
      '💸 Money Sent Successfully',
      'You sent ' || NEW.amount || ' ETB to ' || COALESCE(v_receiver_name, 'a user') || '.',
      jsonb_build_object('amount', NEW.amount, 'receiver_id', NEW.receiver_id, 'transaction_id', NEW.id, 'new_balance', NEW.sender_new_balance)
    );

    -- Notify receiver
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.receiver_id,
      'transaction',
      '💰 Money Received',
      'You received ' || NEW.amount || ' ETB from ' || COALESCE(v_sender_name, 'a user') || '.',
      jsonb_build_object('amount', NEW.amount, 'sender_id', NEW.sender_id, 'transaction_id', NEW.id, 'new_balance', NEW.receiver_new_balance)
    );

  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_money_transfer
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_money_transfer();
