import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Music, Loader2, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAudiusAuthContext } from '@/contexts/AudiusAuthContext';
import { toast } from 'sonner';
import { AudiusSignInButton } from './AudiusLinkButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { signIn, signUp } = useAuth();
  const { isLinkSent: isAudiusLinkSent, resetLinkSent: resetAudiusLinkSent, audiusEmail } = useAudiusAuthContext();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
  });
  const [isLinkSent, setIsLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!formData.username) {
          toast.error('Please enter a username');
          return;
        }
        await signUp(formData.email, formData.username);
      } else {
        await signIn(formData.email);
      }
      setIsLinkSent(true);
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setFormData({ email: '', username: '' });
    setIsLinkSent(false);
    resetAudiusLinkSent();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-echo-primary to-echo-secondary rounded-full flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gradient">
            {mode === 'signin' ? 'Welcome Back' : 'Join Echo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'signin'
              ? 'Sign in to your account to continue voting and uploading'
              : 'Create an account to submit tracks and boost your favorites'}
          </DialogDescription>
        </DialogHeader>

        {isLinkSent || isAudiusLinkSent ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold">Check your inbox</h3>
            <p className="text-muted-foreground mt-2">
              A magic link has been sent to <strong>{isAudiusLinkSent ? audiusEmail : formData.email}</strong>. Click the link to sign in.
            </p>
            <Button
              variant="link"
              className="mt-4"
              onClick={toggleMode}
            >
              Try again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {mode === 'signup' && (
              <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="beatmaker123"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_-]+$"
                title="Username can only contain letters, numbers, underscores, and hyphens"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-echo-primary to-echo-secondary hover:from-echo-primary/90 hover:to-echo-secondary/90 text-white font-semibold h-12 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                {mode === 'signin' ? 'Send Magic Link' : 'Sign Up with Email'}
              </>
            )}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <AudiusSignInButton
            fullWidth
            onSuccess={() => {
              toast.success('Successfully connected with Audius! Check your email to finish signing in.');
            }}
          />

          <div className="text-center pt-2">
            <Button
              type="button"
              variant="link"
              onClick={toggleMode}
              className="text-sm"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
