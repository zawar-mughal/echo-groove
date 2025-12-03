import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve((req) => {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  });

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers });
  }

  const apiKey = Deno.env.get("AUDIUS_API_KEY");
  const appName = Deno.env.get("AUDIUS_APP_NAME") ?? "Echo Groove Battle";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing Audius API configuration" }),
      { status: 500, headers },
    );
  }

  return new Response(
    JSON.stringify({
      apiKey,
      appName,
    }),
    { status: 200, headers },
  );
});
