import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { AudiusAuthProvider } from "@/contexts/AudiusAuthContext";
import { NavigationBar } from "@/components/NavigationBar";
import { isInDiscordApp } from "@/utils/discord-proxy";
import { setupDiscordProxy } from "@/components/DiscordEmbeddedApp";
import Home from "./pages/Home";
import Room from "./pages/Room";
import Admin from "./pages/Admin";
import AdminIndex from "./pages/admin/AdminIndex";
import AdminRoom from "./pages/admin/AdminRoom";
import AdminSeason from "./pages/admin/AdminSeason";
import AdminPlaylist from "./pages/admin/AdminPlaylist";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      throwOnError: false, // Replaced deprecated onError
    },
  },
});

const App = () => {
  const [discordReady, setDiscordReady] = useState(!isInDiscordApp());

  useEffect(() => {
    // Initialize Discord SDK if running in Discord
    if (isInDiscordApp()) {
      setupDiscordProxy()
        .then(() => {
          console.log("Discord embedded app initialized");
          setDiscordReady(true);
        })
        .catch((error) => {
          console.error("Failed to initialize Discord embedded app:", error);
          setDiscordReady(true); // Continue anyway
        });
    }
  }, []);

  // Show loading state while Discord SDK initializes
  if (!discordReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse text-lg">Initializing Discord...</div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AudiusAuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <NavigationBar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/room/:roomId" element={<Room />} />
                <Route path="/admin" element={<Admin />}>
                  <Route index element={<AdminIndex />} />
                  <Route path="rooms/:roomId" element={<AdminRoom />} />
                  <Route
                    path="rooms/:roomId/seasons/:seasonId"
                    element={<AdminSeason />}
                  />
                  <Route
                    path="rooms/:roomId/playlist"
                    element={<AdminPlaylist />}
                  />
                </Route>
                <Route path="/profile/:username?" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AudiusAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
