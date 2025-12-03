import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User, Camera, ExternalLink, Trash2, RefreshCw, Link as LinkIcon, Unlink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAudiusAuthContext } from '@/contexts/AudiusAuthContext';
import { toast } from 'sonner';

const Settings = () => {
  const { user, profile, logout } = useAuth();
  const { loginWithAudius, unlinkAudiusAccount, linkAudiusAccount } = useAudiusAuthContext();
  const [username, setUsername] = useState(user?.handle || '');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Determine Audius connection state
  const hasAudiusId = Boolean(profile?.audius_id);
  const hasAudiusJWT = Boolean(profile?.audius_jwt);
  const isFullyConnected = hasAudiusId && hasAudiusJWT;
  const needsReauth = hasAudiusId && !hasAudiusJWT;

  const previousConnectionState = useRef(isFullyConnected);

  // Watch for successful Audius connection
  useEffect(() => {
    // Show toast when going from not connected → fully connected
    if (isFullyConnected && !previousConnectionState.current) {
      setIsConnecting(false);
      // Toast is already shown by AudiusAuthContext
    }
    previousConnectionState.current = isFullyConnected;
  }, [isFullyConnected]);

  const handleUpdateUsername = async () => {
    if (!username.trim() || username === user?.handle) return;
    
    setIsUpdatingUsername(true);
    try {
      // Mock update - in real implementation, call API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Username updated successfully');
    } catch (error) {
      toast.error('Failed to update username');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleConnectAudius = async () => {
    setIsConnecting(true);
    try {
      await linkAudiusAccount();
      // Toast is shown by AudiusAuthContext
    } catch (error) {
      console.error('Failed to connect to Audius', error);
      toast.error('Failed to connect to Audius');
      setIsConnecting(false);
    }
  };

  const handleDisconnectAudius = async () => {
    setIsDisconnecting(true);
    try {
      await unlinkAudiusAccount();
      toast.success('Disconnected from Audius');
    } catch (error) {
      console.error('Failed to disconnect from Audius', error);
      toast.error('Failed to disconnect from Audius');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Mock deletion - in real implementation, call API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const handleProfilePictureChange = () => {
    toast.info('Profile picture management coming soon');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and data</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your profile information and avatar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.profile_picture?.['480x480']} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Profile Picture</Label>
                <div>
                  <Button variant="outline" onClick={handleProfilePictureChange}>
                    <Camera className="w-4 h-4 mr-2" />
                    Change Picture
                  </Button>
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
                <Button 
                  onClick={handleUpdateUsername}
                  disabled={isUpdatingUsername || !username.trim() || username === user?.handle}
                >
                  {isUpdatingUsername ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Account
            </CardTitle>
            <CardDescription>
              Manage your account connection and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 p-4 rounded-lg border border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">Audius Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    {isFullyConnected
                      ? 'Your Audius account is linked and connected.'
                      : needsReauth
                      ? 'Your Audius token has expired. Reauthenticate to upload tracks.'
                      : 'Link your Audius account to upload tracks and manage submissions.'}
                  </p>
                </div>
                {isFullyConnected ? (
                  <Button
                    variant="outline"
                    onClick={handleDisconnectAudius}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <>
                        <Unlink className="w-4 h-4 mr-2 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <Unlink className="w-4 h-4 mr-2" />
                        Disconnect
                      </>
                    )}
                  </Button>
                ) : needsReauth ? (
                  <Button onClick={handleConnectAudius} disabled={isConnecting} variant="default">
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Reauthenticating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reauthenticate
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleConnectAudius} disabled={isConnecting}>
                    {isConnecting ? (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Connect to Audius
                      </>
                    )}
                  </Button>
                )}
              </div>
              {!isFullyConnected && !needsReauth && (
                <p className="text-sm text-muted-foreground">
                  Connecting your Audius account lets you upload tracks and manage submissions.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that will permanently affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
              <div>
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your Echo account and all associated data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your Echo account,
                      remove all your submissions, boosts, and associated data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
