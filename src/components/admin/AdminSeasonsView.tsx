import { useState } from 'react';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Users, Calendar, Music, Video, Image, Palette, Trophy, Clock, Pencil, CalendarClock, PlayCircle } from 'lucide-react';
import { Room, Season } from '@/types/admin';
import { CreateSeasonDialog } from './CreateSeasonDialog';
import { SeasonManagementDialog } from './SeasonManagementDialog';

interface AdminSeasonsViewProps {
  room: Room;
  onBack: () => void;
  onSelectSeason: (seasonId: string) => void;
  onCreateSeason: (season: Omit<Season, 'id' | 'createdAt' | 'submissions'>) => void;
  onUpdateSeason?: (seasonId: string, updates: Partial<Season>) => void;
  onEndSeason?: (seasonId: string) => void;
}

export function AdminSeasonsView({ room, onBack, onSelectSeason, onCreateSeason, onUpdateSeason, onEndSeason }: AdminSeasonsViewProps) {
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [seasonToManage, setSeasonToManage] = useState<Season | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'voting': return 'bg-orange-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'upcoming': return 'secondary';
      case 'voting': return 'destructive';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'audio': return Music;
      case 'video': return Video;
      case 'image': return Image;
      case 'mixed': return Palette;
      default: return Music;
    }
  };

  const allSeasons = [
    ...(room.currentSeason ? [room.currentSeason] : []),
    ...room.seasons
  ].filter((season, index, self) => 
    self.findIndex(s => s.id === season.id) === index
  ).sort((a, b) => {
    // Sort by status priority (active first), then by start date
    const statusOrder = { active: 0, voting: 1, upcoming: 2, completed: 3 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
    
    if (aOrder !== bOrder) return aOrder - bOrder;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMakeActive = async (season: Season) => {
    if (!onUpdateSeason || season.status === 'active') return;

    try {
      if (room.currentSeason && room.currentSeason.id !== season.id) {
        await Promise.resolve(onUpdateSeason(room.currentSeason.id, { status: 'completed' }));
      }

      await Promise.resolve(onUpdateSeason(season.id, { status: 'active' }));
    } catch (error) {
      console.error('Failed to promote season', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4 -ml-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rooms
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{room.title}</h1>
            <p className="text-muted-foreground">{room.description}</p>
          </div>
          <Button 
            onClick={() => setShowCreateSeason(true)} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Season
          </Button>
        </div>
      </div>

      {/* Current Season Section */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        {room.currentSeason ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(room.currentSeason.status)}`} />
                <CardTitle className="text-xl">Current Season</CardTitle>
                <Badge variant={getStatusVariant(room.currentSeason.status)}>
                  {room.currentSeason.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{room.currentSeason.title}</h3>
                  <p className="text-muted-foreground mb-3">{room.currentSeason.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {React.createElement(getMediaTypeIcon(room.currentSeason.mediaType), { className: "w-4 h-4" })}
                    <span className="capitalize">{room.currentSeason.mediaType}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{room.currentSeason?.submissions?.length || 0} submissions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(room.currentSeason.startDate)} - {formatDate(room.currentSeason.endDate)}</span>
                  </div>
                  {room.currentSeason.status === 'active' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{getDaysRemaining(room.currentSeason.endDate)} days remaining</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end">
                  <Trophy className="w-12 h-12 text-primary/30" />
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Season</h3>
              <p className="text-muted-foreground mb-4">Start a new season to begin collecting submissions</p>
              <Button onClick={() => setShowCreateSeason(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Season
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* All Seasons */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Season History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSeasons.map((season) => {
            const isActive = season.id === room.currentSeason?.id;
            
            return (
              <Card 
                key={season.id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  isActive ? 'ring-2 ring-primary/20' : ''
                }`}
                onClick={() => onSelectSeason(season.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(season.status)}`} />
                        <Badge variant={getStatusVariant(season.status)} className="text-xs">
                          {season.status}
                        </Badge>
                        {isActive && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base mb-1">{season.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {season.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {onUpdateSeason && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMakeActive(season);
                          }}
                          disabled={isActive}
                          className={`hover:text-primary ${
                            isActive ? 'text-muted-foreground opacity-60 cursor-not-allowed' : 'text-muted-foreground'
                          }`}
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span className="sr-only">Make season active</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectSeason(season.id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                        <span className="sr-only">Edit season</span>
                      </Button>
                      {onUpdateSeason && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSeasonToManage(season);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span className="sr-only">Adjust season dates</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Submissions</span>
                      <span className="font-medium">{season.submissions ? season.submissions.length : 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Started</span>
                      <span className="font-medium">{formatDate(season.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {season.status === 'completed' ? 'Ended' : 'Ends'}
                      </span>
                      <span className="font-medium">{formatDate(season.endDate)}</span>
                    </div>
                    {season.status === 'active' && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Time left</span>
                        <span className="font-medium text-primary">
                          {getDaysRemaining(season.endDate)} days
                        </span>
                      </div>
                    )}
                  </div>
                  {season.status !== 'active' && onUpdateSeason && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full mt-4"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMakeActive(season);
                      }}
                    >
                      Make Active
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {allSeasons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No seasons created yet</p>
            <Button onClick={() => setShowCreateSeason(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Season
            </Button>
          </div>
        )}
      </div>

      {/* Create Season Dialog */}
      <CreateSeasonDialog
        open={showCreateSeason}
        onOpenChange={setShowCreateSeason}
        roomId={room.id}
        onCreateSeason={onCreateSeason}
        hasActiveSeason={room.currentSeason?.status === 'active'}
      />

      {/* Season Management Dialog */}
      {seasonToManage && (
        <SeasonManagementDialog
          open={!!seasonToManage}
          onOpenChange={(open) => {
            if (!open) {
              setSeasonToManage(null);
            }
          }}
          season={seasonToManage}
          onUpdateSeason={onUpdateSeason || (() => {})}
          onEndSeason={onEndSeason || (() => {})}
        />
      )}
    </div>
  );
}
