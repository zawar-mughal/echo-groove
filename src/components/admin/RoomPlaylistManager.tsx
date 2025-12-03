import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, GripVertical, Plus, Search, Music, ExternalLink } from 'lucide-react';
import { MediaSubmission } from '@/types/submission';
import { Room } from '@/types/admin';

interface RoomPlaylistManagerProps {
  room: Room;
  playlistSubmissions: MediaSubmission[]; // Current playlist tracks
  availableSubmissions: MediaSubmission[]; // All submissions from past seasons
  onAddToPlaylist: (submissionId: string) => void;
  onRemoveFromPlaylist: (submissionId: string) => void;
  onReorderPlaylist: (submissionIds: string[]) => void;
}

export const RoomPlaylistManager = ({
  room,
  playlistSubmissions,
  availableSubmissions,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onReorderPlaylist
}: RoomPlaylistManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAvailable = availableSubmissions.filter(sub => 
    !room.playlist.includes(sub.id) &&
    (sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     sub.creator.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Current Playlist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Room Playlist ({playlistSubmissions.length} tracks)</span>
            <Badge variant="secondary">
              {Math.floor(playlistSubmissions.reduce((acc, sub) => acc + (sub.duration || 0), 0) / 60)} min
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {playlistSubmissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tracks in playlist. Add some from available submissions below.
            </p>
          ) : (
            <div className="space-y-2">
              {playlistSubmissions.map((submission, index) => (
                <div key={submission.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                  
                  <div className="text-sm text-muted-foreground font-mono w-8">
                    {index + 1}
                  </div>

                  {submission.coverArt && (
                    <img 
                      src={submission.coverArt} 
                      alt={submission.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{submission.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">by {submission.creator}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {submission.externalLink && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={submission.externalLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFromPlaylist(submission.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Submissions</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or artist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredAvailable.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? 'No submissions match your search' : 'All submissions are already in the playlist'}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredAvailable.map((submission) => (
                <div key={submission.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {submission.coverArt && (
                    <img 
                      src={submission.coverArt} 
                      alt={submission.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{submission.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">by {submission.creator}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {submission.boosts} boosts
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        From past season
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddToPlaylist(submission.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
