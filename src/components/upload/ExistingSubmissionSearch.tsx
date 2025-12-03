import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Music, Plus } from 'lucide-react';
import { useSearchSubmissions } from '@/hooks/api/useSubmissions';

interface ExistingSubmissionSearchProps {
  onSelectExisting: (submission: any) => void;
  onClearSelection: () => void;
  selectedSubmission?: any;
  searchQuery?: string;
  onCreateNew: () => void;
}

export const ExistingSubmissionSearch = ({ onSelectExisting, onClearSelection, selectedSubmission, searchQuery: initialQuery, onCreateNew }: ExistingSubmissionSearchProps) => {
  // Search ALL submissions from database using the query passed from parent
  const searchQuery = initialQuery || '';
  const { data: searchResults = [], isLoading: isSearching } = useSearchSubmissions(searchQuery, 10);

  if (selectedSubmission) {
    return (
      <Card className="border-2 border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-primary">Selected: {selectedSubmission.title}</h3>
                <p className="text-sm text-muted-foreground">by {selectedSubmission.creator}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              <Search className="w-4 h-4 mr-2" />
              Search Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {isSearching && searchQuery.length >= 2 && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Searching...</p>
        </div>
      )}
      
      {searchQuery.length >= 2 && !isSearching && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors border border-border hover:border-primary/30"
            onClick={onCreateNew}
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-medium">Create new track "{searchQuery}"</h4>
                </div>
              </div>
            </CardContent>
          </Card>
          {searchResults.map((submission) => (
            <Card
              key={submission.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors border border-border hover:border-primary/30"
              onClick={() => onSelectExisting({
                id: submission.id,
                title: submission.title,
                creator: submission.profiles?.username || submission.user_id,
                url: submission.external_url,
                thumbnail: submission.thumbnail_path,
                duration: submission.duration_seconds,
              })}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {submission.thumbnail_path ? (
                      <img
                        src={submission.thumbnail_path}
                        alt={submission.title}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                        <Music className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{submission.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        by {submission.profiles?.username || submission.user_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{submission.boost_count || 0} boosts</div>
                    <div>{submission.play_count || 0} plays</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No tracks found. Create a new one!</p>
        </div>
      )}
      
    </div>
  );
};
