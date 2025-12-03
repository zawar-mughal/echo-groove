import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EchoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const EchoLoginModal = ({ 
  isOpen, 
  onClose,
  title = "Join Echo",
  subtitle = "Sign in to upload your tracks and get unlimited voting power"
}: EchoLoginModalProps) => {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isLinkSent, setIsLinkSent] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn(email);
      setIsLinkSent(true);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-echo-primary to-echo-secondary rounded-full flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gradient">
            {title}
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            {subtitle}
          </p>
        </DialogHeader>

        {isLinkSent ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold">Check your inbox</h3>
            <p className="text-muted-foreground mt-2">
              A magic link has been sent to <strong>{email}</strong>. Click the link to sign in.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
            />
            <Button
              onClick={handleLogin}
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-echo-primary to-echo-secondary hover:from-echo-primary/90 hover:to-echo-secondary/90 text-white font-semibold h-12 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Music className="w-5 h-5 mr-2" />
                  Send Magic Link
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Powered by Audius • Free forever
            </p>
          </div>
      </DialogContent>
    </Dialog>
  );
};
