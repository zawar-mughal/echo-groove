import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Music, Trash2, Star, TrendingUp, Play, Clock } from 'lucide-react';
import { Room } from '@/types/admin';
import type { PlaylistTrack } from '@/hooks/api/usePlaylists';

interface AdminPlaylistViewProps {
  room: Room;
  playlistTracks: PlaylistTrack[];
  isLoading?: boolean;
  onBack: () => void;
  onRemoveFromPlaylist: (playlistTrackId: string) => void;
}

export function AdminPlaylistView({
  room,
  playlistTracks,
  isLoading = false,
  onBack,
  onRemoveFromPlaylist,
}: AdminPlaylistViewProps) {

  const totalDuration = playlistTracks.reduce((sum, track) => sum + (track.submission.duration || 0), 0);
  const totalPlays = playlistTracks.reduce((sum, track) => sum + (track.submission.playCount || 0), 0);
  const totalBoosts = playlistTracks.reduce((sum, track) => sum + (track.submission.boosts || 0), 0);

  const seasonsCuratedFrom = new Set(
    playlistTracks
      .map(track => track.seasonId)
      .filter(Boolean)
  ).size;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-lg">Loading playlist...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {room.title}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Music className="w-8 h-8" />
              Room Playlist
            </h1>
            <p className="text-muted-foreground">{room.title} • Curated collection</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{playlistTracks.length}</div>
            <div className="text-sm text-muted-foreground">Songs</div>
          </div>
        </div>
      </div>

      {/* Playlist Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Songs</span>
            </div>
            <div className="text-2xl font-bold">{playlistTracks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duration</span>
            </div>
            <div className="text-2xl font-bold">{formatTotalDuration(totalDuration)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Plays</span>
            </div>
            <div className="text-2xl font-bold">{totalPlays.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Boosts</span>
            </div>
            <div className="text-2xl font-bold">{totalBoosts.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Seasons Curated</span>
            </div>
            <div className="text-2xl font-bold">{seasonsCuratedFrom}</div>
          </CardContent>
        </Card>
      </div>

      {/* Playlist Table */}
      <Card>
        <CardHeader>
          <CardTitle>Playlist Songs</CardTitle>
          <CardDescription>
            Manage your room's curated playlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          {playlistTracks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Boosts</TableHead>
                  <TableHead>Plays</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playlistTracks.map((track, index) => (
                  <TableRow key={track.id}>
                    <TableCell className="font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{track.submission.title}</span>
                        {track.submission.isRising && (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200">
                            Trending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{track.submission.creator}</TableCell>
                    <TableCell>{formatDuration(track.submission.duration || 0)}</TableCell>
                    <TableCell>{track.submission.boosts.toLocaleString()}</TableCell>
                    <TableCell>{track.submission.playCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Remove from playlist">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove from Playlist</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove "{track.submission.title}" from the room playlist?
                                This action can be undone by re-adding the song.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onRemoveFromPlaylist(track.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No songs in playlist</h3>
              <p className="text-muted-foreground">
                Add songs from your seasons to build your room's curated playlist
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
