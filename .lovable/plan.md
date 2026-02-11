

## Pending Features Audit

### 1. Message Settings Not Persisted or Applied
The `MessageSettingsModal` has UI for font size, show status, show activity, show avatar, accept from non-friends, and messages-before-accept -- but none of these values are saved to the database or actually applied anywhere. Font size changes don't affect the chat bubbles. Toggling "show status" doesn't hide online dots.

**Work needed:**
- Create a `user_messaging_settings` table to store preferences
- Read settings on load and apply them (font size to chat bubbles, hide/show online dots, hide/show avatars, hide/show typing indicators)
- Save settings on change

### 2. "In Chat" Activity Status
Typing indicators work, but there is no "in chat" presence status showing when a user is actively viewing a conversation (as opposed to just being online).

**Work needed:**
- Track which conversation a user is currently viewing via Supabase Presence
- Display "Active now" or "In chat" under the user's name in the conversation list and chat header

### 3. Message Delete Not Persisted
`handleDeleteMessage` in `Messages.tsx` only removes the message from local state (`setLocalMessages`). It does not delete from the database.

**Work needed:**
- Call `supabase.from('direct_messages').delete()` or `supabase.from('group_messages').delete()` in the hook
- Add RLS policy to allow users to delete only their own messages

### 4. Request Folder: Friend Requests Not Merged
The request notification badge on the Inbox icon only counts `message_requests`. The user asked for friend requests to also appear there ("you have one new message request, you have one friend request").

**Work needed:**
- Query `friendships` table for pending friend requests alongside message requests
- Show both types in the `MessageRequestsModal` with distinct labels
- Combine counts for the badge

### 5. In-Call "Add Person" Button Not Functional
The `InCallBanner` has mute, video, and end call buttons but no "Add Person" button, which was specifically requested.

**Work needed:**
- Add a `UserPlus` button to `InCallBanner`
- On click, open a user-picker modal to invite someone into the current call
- Insert into `livekit_session_invites` to notify the invitee

### 6. In-Call Banner Not Shown on Other Pages
`InCallBanner` is only rendered inside `Messages.tsx`. The user said "which work when you go into other spaces" -- meaning the banner should persist across all pages (Dashboard, Courses, etc.) while a call is active.

**Work needed:**
- Move `InCallBanner` into a global layout component (e.g., `DashboardLayout` or `GlobalFloatingElements`)
- Ensure it renders on every page when `callState.status === 'connected'`

### 7. Privacy Enforcement (Non-Friend Message Blocking)
The settings UI has "Accept messages from non-friends" and "messages before auto-accept" but there is zero backend enforcement. Anyone can DM anyone.

**Work needed:**
- Before inserting a DM, check if sender is a friend or has an accepted message request
- If not a friend and setting is off, block the message and show a toast
- Implement the "messages before auto-accept" threshold logic

### 8. Message Forwarding
No forward functionality exists anywhere in the codebase. This is a common messaging feature that was likely discussed.

**Work needed:**
- Add a "Forward" option to the message context menu in `SwipeableChatBubble`
- Open a conversation picker modal
- Send the forwarded message to the selected conversation with a "Forwarded" label

---

## Summary Table

| Feature | UI Exists | Backend Wired | Fully Working |
|---|---|---|---|
| Sent/Seen indicators | Yes | Yes | Yes |
| Red unread badge | Yes | Yes | Yes |
| Typing indicators | Yes | Yes | Yes |
| Call participant badge | Yes | Yes | Yes |
| In-call banner (Messages page) | Yes | Yes | Yes |
| Pinned messages bar | Yes | Yes | Yes |
| Message settings UI | Yes | No | No |
| Font size applied to chat | No | No | No |
| "In chat" activity status | No | No | No |
| Message delete (DB) | No | No | No |
| Friend requests in inbox | No | No | No |
| Add person to call | No | No | No |
| In-call banner (all pages) | No | N/A | No |
| Non-friend message blocking | No | No | No |
| Message forwarding | No | No | No |

## Technical Approach

### Phase 1 -- Settings Persistence and Application
- Create `user_messaging_settings` table with columns: `user_id`, `font_size`, `show_status`, `show_activity`, `show_avatar`, `accept_non_friends`, `messages_before_accept`
- Add a custom hook `useMessagingSettings` to load/save
- Apply font size via CSS variable or inline style on the messages container
- Conditionally render online dots, avatars, and typing indicators based on settings

### Phase 2 -- Global In-Call Banner
- Move `InCallBanner` rendering from `Messages.tsx` into `DashboardLayout.tsx` (or `GlobalFloatingElements`)
- Add the "Add Person" button with a user-picker

### Phase 3 -- Delete, Forward, and Privacy
- Wire message deletion to Supabase with proper RLS
- Add forwarding UI and logic
- Enforce non-friend messaging restrictions at the send level

### Phase 4 -- Request Folder and "In Chat"
- Merge friend request queries into the request modal
- Implement "in chat" presence tracking via Supabase Presence channel metadata

