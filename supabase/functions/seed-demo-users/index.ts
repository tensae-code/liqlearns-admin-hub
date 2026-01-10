import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const demoUsers = [
  { email: 'ceo@liqlearns.com', password: 'ceo123', role: 'ceo', full_name: 'Demo CEO', username: 'demo_ceo' },
  { email: 'admin@liqlearns.com', password: 'admin123', role: 'admin', full_name: 'Demo Admin', username: 'demo_admin' },
  { email: 'student@liqlearns.com', password: 'student123', role: 'student', full_name: 'Demo Student', username: 'demo_student' },
  { email: 'teacher@liqlearns.com', password: 'teacher123', role: 'teacher', full_name: 'Demo Teacher', username: 'demo_teacher' },
  { email: 'support@liqlearns.com', password: 'support123', role: 'support', full_name: 'Demo Support', username: 'demo_support' },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const results = []

    for (const user of demoUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const userExists = existingUsers?.users?.some(u => u.email === user.email)
      
      if (userExists) {
        results.push({ email: user.email, status: 'already exists' })
        continue
      }

      // Create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          username: user.username,
          role: user.role
        }
      })

      if (authError) {
        results.push({ email: user.email, status: 'error', message: authError.message })
        continue
      }

      // Update the user_roles table with the correct role
      if (authData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: user.role })
          .eq('user_id', authData.user.id)

        if (roleError) {
          // If update failed, maybe need to insert
          await supabase
            .from('user_roles')
            .insert({ user_id: authData.user.id, role: user.role })
        }

        results.push({ email: user.email, status: 'created', userId: authData.user.id })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
