import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate a cryptographically secure random password
function generateSecurePassword(length = 24): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues)
    .map((x) => charset[x % charset.length])
    .join('')
}

// Demo user configuration (passwords are generated at runtime, not hardcoded)
const demoUserConfigs = [
  { email: 'ceo@liqlearns.com', role: 'ceo', full_name: 'Demo CEO', username: 'demo_ceo' },
  { email: 'admin@liqlearns.com', role: 'admin', full_name: 'Demo Admin', username: 'demo_admin' },
  { email: 'student@liqlearns.com', role: 'student', full_name: 'Demo Student', username: 'demo_student' },
  { email: 'teacher@liqlearns.com', role: 'teacher', full_name: 'Demo Teacher', username: 'demo_teacher' },
  { email: 'support@liqlearns.com', role: 'support', full_name: 'Demo Support', username: 'demo_support' },
  { email: 'parent@liqlearns.com', role: 'parent', full_name: 'Demo Parent', username: 'demo_parent' },
  { email: 'enterprise@liqlearns.com', role: 'enterprise', full_name: 'Demo Enterprise', username: 'demo_enterprise' },
]

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Check if demo seeding is enabled (disabled by default for security)
    const enableDemoSeeding = Deno.env.get('ENABLE_DEMO_SEEDING')
    if (enableDemoSeeding !== 'true') {
      return new Response(JSON.stringify({ 
        error: 'Demo seeding is disabled. Set ENABLE_DEMO_SEEDING=true to enable.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Verify authentication - require valid auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create a client to verify the user's token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    })

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Create admin client for role checking
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify user has admin or CEO role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !roleData || !['admin', 'ceo'].includes(roleData.role)) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions. Only admins and CEOs can seed demo users.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Now proceed with seeding demo users
    const results = []
    const generatedCredentials = []

    for (const userConfig of demoUserConfigs) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers?.users?.some(u => u.email === userConfig.email)
      
      if (userExists) {
        results.push({ email: userConfig.email, status: 'already exists' })
        continue
      }

      // Generate a secure random password for each demo user
      const securePassword = generateSecurePassword()

      // Create user with secure password
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userConfig.email,
        password: securePassword,
        email_confirm: true,
        user_metadata: {
          full_name: userConfig.full_name,
          username: userConfig.username,
          role: userConfig.role
        }
      })

      if (createError) {
        results.push({ email: userConfig.email, status: 'error', message: createError.message })
        continue
      }

      // Update the user_roles table with the correct role
      if (authData.user) {
        const { error: roleUpdateError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: userConfig.role })
          .eq('user_id', authData.user.id)

        if (roleUpdateError) {
          // If update failed, maybe need to insert
          await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: authData.user.id, role: userConfig.role })
        }

        results.push({ email: userConfig.email, status: 'created', userId: authData.user.id })
        
        // Store generated credentials to return to admin (one-time display)
        generatedCredentials.push({
          email: userConfig.email,
          password: securePassword,
          role: userConfig.role
        })
      }
    }

    // Return results with generated credentials (only shown once)
    return new Response(JSON.stringify({ 
      success: true, 
      results,
      // WARNING: These credentials are shown only once. Store them securely!
      generatedCredentials: generatedCredentials.length > 0 ? generatedCredentials : undefined,
      message: generatedCredentials.length > 0 
        ? 'Demo users created. IMPORTANT: Save these credentials immediately - they cannot be retrieved again!'
        : 'No new users created.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    console.error('Seed demo users error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
