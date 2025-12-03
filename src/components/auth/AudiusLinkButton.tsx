import { Button } from '@/components/ui/button';
import { useAudiusAuthContext } from '@/contexts/AudiusAuthContext';
import { Loader2 } from 'lucide-react';

interface AudiusLinkButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  showUnlinkOption?: boolean;
}

export const AudiusLinkButton = ({
  variant = 'default',
  size = 'default',
  fullWidth = false,
  showUnlinkOption = true,
}: AudiusLinkButtonProps) => {
  const {
    isAudiusLinked,
    isLoading,
    linkAudiusAccount,
    unlinkAudiusAccount,
    audiusUser,
  } = useAudiusAuthContext();

  const handleClick = () => {
    if (isAudiusLinked && showUnlinkOption) {
      // Optionally show confirmation dialog before unlinking
      if (window.confirm('Are you sure you want to unlink your Audius account?')) {
        unlinkAudiusAccount();
      }
    } else {
      linkAudiusAccount();
    }
  };

  if (isAudiusLinked) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span>
            Connected as <strong>@{audiusUser?.handle || 'Audius User'}</strong>
          </span>
        </div>
        {showUnlinkOption && (
          <Button
            variant="outline"
            size={size}
            onClick={handleClick}
            disabled={isLoading}
            className={fullWidth ? 'w-full' : ''}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Unlinking...
              </>
            ) : (
              'Unlink Audius Account'
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={fullWidth ? 'w-full' : ''}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 8c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          </svg>
          Link Audius Account
        </>
      )}
    </Button>
  );
};

// Simplified version for use in sign-in flows
export const AudiusSignInButton = ({
  fullWidth = true,
  onSuccess,
}: {
  fullWidth?: boolean;
  onSuccess?: () => void;
}) => {
  const { loginWithAudius, isLoading } = useAudiusAuthContext();

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={loginWithAudius}
      disabled={isLoading}
      className={`${fullWidth ? 'w-full' : ''} border-2`}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Connecting to Audius...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-6 w-6"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 8c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0-2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          </svg>
          Continue with Audius
        </>
      )}
    </Button>
  );
};
