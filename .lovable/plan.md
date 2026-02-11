## Completed Features

All pending messaging features have been implemented:

### ✅ Phase 1 — Settings Persistence and Application
- Created `user_messaging_settings` table with RLS
- Built `useMessagingSettings` hook for load/save
- `MessageSettingsModal` now persists all settings to DB
- Font size applied dynamically to chat bubbles
- Show/hide online status dots based on settings
- Show/hide avatars based on settings
- Show/hide typing indicators based on settings

### ✅ Phase 2 — Global In-Call Banner
- Moved `InCallBanner` from `Messages.tsx` to `GlobalFloatingElements`
- Banner now appears on ALL pages when in a call (fixed top, z-50)
- Added `UserPlus` (Add Person) button — opens user picker, sends call invite via `livekit_session_invites`

### ✅ Phase 3 — Delete, Forward, and Privacy
- Message deletion now persists to DB (both DM and group messages)
- Added RLS policies for delete (users can only delete own messages)
- Added "Forward" option to message context menu (both sender and receiver)
- Created `ForwardMessageModal` with conversation picker
- Forwarded messages prefixed with "↪ Forwarded:"
- **Privacy enforcement**: DM sending checks receiver's `accept_non_friends` setting; blocks non-friend messages with toast error

### ✅ Phase 4 — Request Folder and "In Chat" Activity
- `MessageRequestsModal` now shows BOTH message requests AND friend requests
- Each request has a badge label ("Friend" or "Message")
- Combined counts shown on the Inbox badge in ConversationList
- Privacy settings (accept_non_friends, messages_before_accept) persisted to DB
- **"In Chat" presence**: Users' active conversation is tracked via Supabase Presence; DM header shows "Active now" when partner is viewing the same conversation
