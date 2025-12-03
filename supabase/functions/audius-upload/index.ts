import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
// Using npm: specifier for better Deno compatibility with Node packages
import { sdk } from "npm:@audius/sdk@4.1.4"

serve(async (req) => {
  // CORS headers for all responses
  const headers = new Headers()
  headers.set("Access-Control-Allow-Origin", "*")
  headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type")
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
  headers.set("Content-Type", "application/json")

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers })
  }

  try {
    const audiusApiKey = Deno.env.get("AUDIUS_API_KEY")
    const audiusApiSecret = Deno.env.get("AUDIUS_API_SECRET")

    console.log("Environment check:", {
      hasApiKey: !!audiusApiKey,
      hasApiSecret: !!audiusApiSecret
    })

    if (!audiusApiKey || !audiusApiSecret) {
      console.error("Missing Audius API credentials")
      return new Response(
        JSON.stringify({ error: "Missing Audius API credentials" }),
        { status: 500, headers }
      )
    }

    console.log("Initializing Audius SDK...")
    const audiusSdk = sdk({
      apiKey: audiusApiKey,
      apiSecret: audiusApiSecret,
      appName: "Echo Groove Battle"
    })
    console.log("Audius SDK initialized successfully")

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers }
      )
    }

    console.log("Parsing form data...")
    const formData = await req.formData()
    const audioFile = formData.get("audioFile") as File
    const coverArtFile = formData.get("coverArtFile") as File | null
    const userId = formData.get("userId") as string
    const title = formData.get("title") as string
    const genre = formData.get("genre") as string
    const description = formData.get("description") as string | null
    const mood = formData.get("mood") as string | null
    const tags = formData.get("tags") as string | null

    console.log("Form data received:", {
      hasAudioFile: !!audioFile,
      audioFileName: audioFile?.name,
      audioFileSize: audioFile?.size,
      hasCoverArt: !!coverArtFile,
      userId,
      title,
      genre
    })

    if (!audioFile || !userId || !title || !genre) {
      console.error("Missing required fields:", {
        hasAudioFile: !!audioFile,
        hasUserId: !!userId,
        hasTitle: !!title,
        hasGenre: !!genre
      })
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers }
      )
    }

    console.log("Starting Audius upload:", { userId, title, genre })

    const result = await audiusSdk.tracks.uploadTrack({
      userId,
      trackFile: audioFile,
      coverArtFile: coverArtFile || undefined,
      metadata: {
        title,
        genre,
        description: description || undefined,
        mood: mood || undefined,
        tags: tags || undefined
      }
    })

    console.log("✅ Upload successful! Track ID:", result.trackId)

    console.log("Fetching uploaded track details...")
    const { data: track } = await audiusSdk.tracks.getTrack({
      trackId: result.trackId
    })

    console.log("Track details retrieved:", track ? "success" : "not found")

    return new Response(
      JSON.stringify({
        success: true,
        trackId: result.trackId,
        track: track || null
      }),
      { status: 200, headers }
    )

  } catch (error: any) {
    console.error("❌ Upload failed:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({
        error: error.message || "Upload failed",
        details: error.toString()
      }),
      { status: 500, headers }
    )
  }
})
