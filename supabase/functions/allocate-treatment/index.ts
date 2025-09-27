import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { experimentId } = await req.json()
    
    if (!experimentId) {
      throw new Error('Experiment ID is required')
    }

    console.log(`Allocating treatment for user ${user.id} in experiment ${experimentId}`)

    // Get experiment details
    const { data: experiment, error: experimentError } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .single()

    if (experimentError) {
      console.error('Experiment fetch error:', experimentError)
      throw new Error('Experiment not found')
    }

    if (!experiment.accepting_joiners || experiment.status === 'ended') {
      throw new Error('Experiment is not accepting new joiners')
    }

    // Check if user already joined this experiment
    const { data: existingParticipation, error: checkError } = await supabase
      .from('user_experiments')
      .select('*')
      .eq('user_id', user.id)
      .eq('experiment_id', experimentId)
      .is('left_at', null)
      .maybeSingle()

    if (checkError) {
      console.error('Participation check error:', checkError)
      throw new Error('Error checking participation status')
    }

    if (existingParticipation) {
      throw new Error('User already joined this experiment')
    }

    // Randomly allocate treatment URL
    const treatmentUrls = experiment.treatment_urls as string[]
    if (!treatmentUrls || treatmentUrls.length === 0) {
      throw new Error('No treatment URLs available for this experiment')
    }

    const randomIndex = Math.floor(Math.random() * treatmentUrls.length)
    const allocatedUrl = treatmentUrls[randomIndex]

    console.log(`Allocated treatment URL ${randomIndex + 1} of ${treatmentUrls.length}: ${allocatedUrl}`)

    // Insert user experiment record
    const { data: userExperiment, error: insertError } = await supabase
      .from('user_experiments')
      .insert({
        user_id: user.id,
        experiment_id: experimentId,
        treatment_url: allocatedUrl
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error('Failed to join experiment')
    }

    console.log('Successfully allocated treatment:', userExperiment)

    return new Response(
      JSON.stringify({ 
        success: true,
        treatment_url: allocatedUrl,
        participation_id: userExperiment.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in allocate-treatment function:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})