import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { AccessToken, VideoGrant } from 'https://esm.sh/livekit-server-sdk@2.9.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  roomName: string;
  contextType: 'dm' | 'group' | 'study_room';
  contextId: string;
  role?: 'host' | 'moderator' | 'speaker' | 'listener';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: TokenRequest = await req.json();
    const { roomName, contextType, contextId, role = 'speaker' } = body;

    if (!roomName || !contextType || !contextId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: roomName, contextType, contextId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate access based on context type
    let hasAccess = false;

    if (contextType === 'dm') {
      // For DMs, check if user is one of the participants
      // Room name format: dm:<sortedUserId1>:<sortedUserId2>
      const userIds = roomName.replace('dm:', '').split(':');
      hasAccess = userIds.includes(profile.id);
    } else if (contextType === 'group') {
      // For groups, check group membership
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', contextId)
        .eq('user_id', profile.id)
        .single();
      hasAccess = !!membership;
    } else if (contextType === 'study_room') {
      // For study rooms, check if room is public or user is participant
      const { data: room } = await supabase
        .from('study_rooms')
        .select('id, room_type')
        .eq('id', contextId)
        .single();
      
      if (room) {
        if (room.room_type === 'public') {
          hasAccess = true;
        } else {
          const { data: participant } = await supabase
            .from('study_room_participants')
            .select('id')
            .eq('room_id', contextId)
            .eq('user_id', profile.id)
            .single();
          hasAccess = !!participant;
        }
      }
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this room' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get LiveKit credentials
    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');
    const livekitUrl = Deno.env.get('LIVEKIT_URL');

    if (!apiKey || !apiSecret || !livekitUrl) {
      console.error('LiveKit credentials not configured');
      return new Response(
        JSON.stringify({ error: 'LiveKit not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine permissions based on role
    const videoGrant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
    };

    // Set publishing permissions based on role
    if (role === 'listener') {
      // Listeners can only subscribe, no publishing
      videoGrant.canPublish = false;
      videoGrant.canPublishData = true; // Allow data messages for chat
    } else if (role === 'speaker') {
      videoGrant.canPublish = true;
      videoGrant.canPublishData = true;
    } else if (role === 'moderator' || role === 'host') {
      videoGrant.canPublish = true;
      videoGrant.canPublishData = true;
      // Hosts/moderators can manage participants (via LiveKit admin API)
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: profile.id,
      name: profile.full_name || 'Anonymous',
      ttl: 3600, // 1 hour token validity
      metadata: JSON.stringify({
        role,
        avatarUrl: profile.avatar_url,
        contextType,
        contextId,
      }),
    });

    at.addGrant(videoGrant);

    const accessToken = await at.toJwt();

    // Upsert session record
    const { error: sessionError } = await supabase
      .from('livekit_sessions')
      .upsert({
        room_name: roomName,
        context_type: contextType,
        context_id: contextId,
        host_id: profile.id,
        status: 'active',
      }, {
        onConflict: 'room_name',
        ignoreDuplicates: true,
      });

    if (sessionError) {
      console.warn('Session upsert warning:', sessionError.message);
    }

    return new Response(
      JSON.stringify({
        token: accessToken,
        url: livekitUrl,
        roomName,
        identity: profile.id,
        name: profile.full_name,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Token generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});