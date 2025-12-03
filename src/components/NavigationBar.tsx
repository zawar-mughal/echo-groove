import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, LogOut, Shield, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { CreateRoomDialog } from '@/components/admin/CreateRoomDialog';
import { useCreateRoom } from '@/hooks/api/useRooms';
import { PlatformPointsDisplay } from '@/components/PlatformPointsDisplay';
import { toast } from '@/hooks/use-toast';

export const NavigationBar = () => {
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const createRoomMutation = useCreateRoom();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleCreateRoom = async (roomData: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create a room",
        variant: "destructive"
      });
      return;
    }

    try {
      await createRoomMutation.mutateAsync({
        title: roomData.title,
        slug: roomData.title.toLowerCase().replace(/\s+/g, '-'),
        description: roomData.description,
        created_by: user.id,
        is_public: true,
        is_active: true,
        allow_submissions: true,
      });

      toast({
        title: "Room created!",
        description: "Your new room has been created successfully",
      });
    } catch (error) {
      console.error('Failed to create room:', error);
      toast({
        title: "Failed to create room",
        description: "There was an error creating your room",
        variant: "destructive"
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/lovable-uploads/0a873264-46a5-463f-b516-c1482ac60070.png" 
            alt="Echo" 
            className="w-8 h-8 hover:scale-110 transition-transform duration-300" 
          />
          <div className="font-bold text-xl text-gradient">Echo</div>
        </Link>

        {/* Spacer for centering */}
        <div className="flex-1"></div>

        {/* Platform Points Display - only show if logged in */}
        {isAuthenticated && user && (
          <PlatformPointsDisplay userId={user.id} linkTo="/profile" />
        )}

        {/* Auth Section */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || profile?.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || profile?.username} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.display_name || profile?.username}</p>
                  <p className="text-xs text-muted-foreground">
                    @{profile?.username}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Create Room</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              {profile?.is_admin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-gradient-to-r from-echo-primary to-echo-secondary hover:from-echo-primary/90 hover:to-echo-secondary/90"
          >
            Sign In
          </Button>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Create Room Dialog */}
      <CreateRoomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateRoom={handleCreateRoom}
      />
    </nav>
  );
};
