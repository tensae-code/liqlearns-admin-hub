import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Manual JWT implementation for LiveKit tokens
// This avoids dependency issues with livekit-server-sdk on esm.sh

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRequest {
  roomName: string;
  contextType: 'dm' | 'group' | 'study_room' | 'battle';
  contextId: string;
  role?: 'host' | 'moderator' | 'speaker' | 'listener';
}

interface VideoGrant {
  room?: string;
  roomJoin?: boolean;
  roomList?: boolean;
  roomCreate?: boolean;
  roomAdmin?: boolean;
  canPublish?: boolean;
  canPublishData?: boolean;
  canSubscribe?: boolean;
  hidden?: boolean;
  recorder?: boolean;
}

interface ClaimGrants {
  video?: VideoGrant;
  metadata?: string;
  name?: string;
}

// Base64URL encode
function base64UrlEncode(data: Uint8Array | string): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Create HMAC-SHA256 signature
async function createHmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataBytes = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
  return new Uint8Array(signature);
}

// Create LiveKit access token
async function createAccessToken(
  apiKey: string,
  apiSecret: string,
  identity: string,
  name: string,
  grants: ClaimGrants,
  ttlSeconds: number = 3600
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const payload = {
    iss: apiKey,
    sub: identity,
    iat: now,
    nbf: now,
    exp: now + ttlSeconds,
    jti: crypto.randomUUID(),
    name,
    video: grants.video,
    metadata: grants.metadata,
  };
  
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;
  
  const signature = await createHmacSha256(apiSecret, toSign);
  const signatureB64 = base64UrlEncode(signature);
  
  return `${toSign}.${signatureB64}`;
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

    // Decode JWT payload to get user ID (the token is already verified by Supabase's JWT validation)
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    
    try {
      // Decode the JWT payload (middle part)
      const payloadPart = token.split('.')[1];
      const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
      userId = payload.sub;
      
      if (!userId) {
        throw new Error('No user ID in token');
      }
    } catch (e) {
      console.error('Token decode error:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    } else if (contextType === 'battle') {
      // For battles, check if user is a participant (challenger or opponent) or spectator
      const { data: battle } = await supabase
        .from('battles')
        .select('id, challenger_id, opponent_id, allow_spectators')
        .eq('id', contextId)
        .single();

      if (battle) {
        if (battle.challenger_id === profile.id || battle.opponent_id === profile.id) {
          hasAccess = true;
        } else if (battle.allow_spectators) {
          hasAccess = true;
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

    // Create access token using manual JWT implementation
    const accessToken = await createAccessToken(
      apiKey,
      apiSecret,
      profile.id,
      profile.full_name || 'Anonymous',
      {
        video: videoGrant,
        metadata: JSON.stringify({
          role,
          avatarUrl: profile.avatar_url,
          contextType,
          contextId,
        }),
      },
      3600 // 1 hour TTL
    );

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
