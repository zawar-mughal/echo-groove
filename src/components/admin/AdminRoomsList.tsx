import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Users, Calendar, ExternalLink, ListMusic, Copy } from 'lucide-react';
import { Room } from '@/types/admin';
import { toast } from '@/hooks/use-toast';

interface AdminRoomsListProps {
  rooms: Room[];
  onSelectRoom: (roomId: string) => void;
  onAddAdmin: (roomId: string) => void;
  onLinkDiscord: (roomId: string) => void;
  onShowPlaylist?: (roomId: string) => void;
}

export function AdminRoomsList({ rooms, onSelectRoom, onAddAdmin, onLinkDiscord, onShowPlaylist }: AdminRoomsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [discordModalRoom, setDiscordModalRoom] = useState<Room | null>(null);
  const [discordLinkCopied, setDiscordLinkCopied] = useState(false);

  const filteredRooms = rooms.filter(room => {
    const query = searchQuery.toLowerCase();
    return (
      room.title.toLowerCase().includes(query) ||
      room.description?.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'voting': return 'bg-orange-500';
      case 'completed': return 'bg-muted';
      default: return 'bg-muted-foreground';
    }
  };

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Manage Rooms</h1>
        <p className="text-muted-foreground">Select a room to view and manage its seasons</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{room.title}</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono mb-2">/room/{room.slug}</p>
                  <CardDescription className="line-clamp-2">
                    {room.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Current Season Status */}
              <div className="mb-4">
                {room.currentSeason ? (
                  <Badge variant="secondary" className="text-xs">
                    {room.currentSeason.submissions?.length || 0} submissions
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">No Active Season</Badge>
                )}
              </div>

              {/* Room URL Slug - Copy to Clipboard */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1 block">Room URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-2 py-1 rounded border">
                    /room/{room.slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await navigator.clipboard.writeText(`/room/${room.slug}`);
                        toast({
                          title: 'Copied!',
                          description: 'Room URL copied to clipboard',
                        });
                      } catch (error) {
                        console.error('Failed to copy', error);
                      }
                    }}
                    className="h-7 px-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => onSelectRoom(room.id)}
                  size="sm" 
                  className="w-full"
                >
                  Manage Seasons
                </Button>
                {onShowPlaylist && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowPlaylist(room.id);
                    }}
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <ListMusic className="w-4 h-4" />
                    Manage Playlist
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No rooms found matching your search</p>
          <p className="text-sm text-muted-foreground">Rooms can only be created from the home page</p>
        </div>
      )}
      </div>

      <Dialog open={!!discordModalRoom} onOpenChange={(open) => {
        if (!open) {
          setDiscordModalRoom(null);
          setDiscordLinkCopied(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discord Proxy Link</DialogTitle>
            <DialogDescription>
              Share this link with the Discord proxy app to manage {discordModalRoom?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {discordModalRoom ? (
              (() => {
                const link = buildDiscordLink(discordModalRoom);
                if (link) {
                  return (
                    <div className="space-y-2">
                      <Input readOnly value={link} />
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(link);
                              setDiscordLinkCopied(true);
                              setTimeout(() => setDiscordLinkCopied(false), 2000);
                            } catch (error) {
                              console.error('Failed to copy Discord link', error);
                            }
                          }}
                        >
                          {discordLinkCopied ? 'Copied!' : 'Copy Link'}
                        </Button>
                        {onLinkDiscord && (
                          <Button
                            variant="outline"
                            onClick={() => onLinkDiscord(discordModalRoom.id)}
                          >
                            Update Connection
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      This room is not linked to Discord yet. Generate a link to allow admins to open the room from the Discord proxy app.
                    </p>
                    {onLinkDiscord && (
                      <Button onClick={() => onLinkDiscord(discordModalRoom.id)}>
                        Generate Discord Link
                      </Button>
                    )}
                  </div>
                );
              })()
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const DiscordLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M20.317 4.3698c-1.1865-.5216-2.4585-.9037-3.7822-1.1104-.1616.2947-.3435.6961-.4704 1.0025-1.366-.204-2.737-.204-4.0899 0-.1269-.3064-.321-.7078-.4827-1.0025-1.3237.2067-2.5957.5888-3.7822 1.1104-2.3857 3.3602-3.0322 6.6405-2.7135 9.8593 1.7325 1.2913 3.4157 2.0744 5.0443 2.592.4035-.5532.7646-1.1446 1.0743-1.765-.6108-.2328-1.1944-.5216-1.7462-.8738.1467-.1056.2873-.2168.424-.3314 3.3216 1.5565 6.9098 1.5565 10.1927 0 .1376.1146.2782.2258.424.3314-.5518.3522-1.1354.641-1.748.8738.3384.6204.6994 1.2118 1.103 1.765 1.6286-.5176 3.3118-1.3007 5.0443-2.592.4137-4.2054-.6983-7.4563-2.7135-9.8593zm-12.162 7.7558c-.9935 0-1.8076-.9037-1.8076-2.0177 0-1.114.798-2.0176 1.8076-2.0176 1.0097 0 1.8238.9036 1.8076 2.0176 0 1.114-.798 2.0177-1.8076 2.0177zm7.69 0c-.9936 0-1.8076-.9037-1.8076-2.0177 0-1.114.798-2.0176 1.8076-2.0176 1.0096 0 1.8237.9036 1.8076 2.0176 0 1.114-.798 2.0177-1.8076 2.0177z"
    />
  </svg>
);

const buildDiscordLink = (room: Room) => {
  if (room.discordGuildId && room.discordChannelId) {
    return `https://discord.com/channels/${room.discordGuildId}/${room.discordChannelId}`;
  }
  return room.discordChannelId || null;
};
