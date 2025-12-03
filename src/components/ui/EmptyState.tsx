import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) => {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <Icon className="w-12 h-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="default">
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Icon className="w-16 h-16 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="lg" className="bg-gradient-to-r from-echo-primary to-echo-secondary">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};
