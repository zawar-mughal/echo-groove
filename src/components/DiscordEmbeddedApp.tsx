import { DiscordSDK, patchUrlMappings } from "@discord/embedded-app-sdk";

// Initialize Discord SDK
export const discordSdk = new DiscordSDK(
  // import.meta.env.VITE_DISCORD_CLIENT_ID || '',
  "1443565148919955527"
);

// Setup Discord proxy for API calls
export const setupDiscordProxy = async () => {
  try {
    await discordSdk.ready();

    // Get the current site URL from environment or window
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const audiusApiUrl =
      import.meta.env.VITE_AUDIUS_API_URL ||
      "https://discoveryprovider.audius.co";

    // Patch URL Mappings for external API requests
    const mappings = [];

    // Add Supabase proxy if configured
    if (supabaseUrl) {
      const supabaseHost = new URL(supabaseUrl).hostname;
      mappings.push({
        prefix: "/supabase-api",
        target: supabaseHost,
      });
    }

    // Add Audius API proxy
    mappings.push({
      prefix: "/audius-api",
      target: new URL(audiusApiUrl).hostname,
    });

    // Add internal API proxy
    mappings.push({
      prefix: "/api",
      target: new URL(siteUrl).hostname,
    });

    if (mappings.length > 0) {
      patchUrlMappings(mappings);
      console.log("Discord proxy mappings configured:", mappings);
    }

    return true;
  } catch (error) {
    console.error("Failed to setup Discord proxy:", error);
    return false;
  }
};
