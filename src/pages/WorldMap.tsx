import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Globe, Users, Eye, EyeOff, Search } from 'lucide-react';

// Country coordinates for simple map placement (percentage-based on a world map)
const COUNTRY_COORDS: Record<string, { x: number; y: number; name: string }> = {
  'Ethiopia': { x: 58, y: 52, name: 'Ethiopia' },
  'United States': { x: 20, y: 35, name: 'United States' },
  'United Kingdom': { x: 47, y: 28, name: 'United Kingdom' },
  'Canada': { x: 18, y: 25, name: 'Canada' },
  'Germany': { x: 50, y: 29, name: 'Germany' },
  'France': { x: 48, y: 31, name: 'France' },
  'India': { x: 70, y: 42, name: 'India' },
  'China': { x: 77, y: 35, name: 'China' },
  'Japan': { x: 85, y: 35, name: 'Japan' },
  'Brazil': { x: 30, y: 60, name: 'Brazil' },
  'Nigeria': { x: 49, y: 50, name: 'Nigeria' },
  'South Africa': { x: 55, y: 70, name: 'South Africa' },
  'Kenya': { x: 59, y: 55, name: 'Kenya' },
  'Egypt': { x: 55, y: 40, name: 'Egypt' },
  'Australia': { x: 83, y: 68, name: 'Australia' },
  'Mexico': { x: 15, y: 42, name: 'Mexico' },
  'Turkey': { x: 56, y: 34, name: 'Turkey' },
  'Saudi Arabia': { x: 60, y: 42, name: 'Saudi Arabia' },
  'UAE': { x: 63, y: 43, name: 'UAE' },
  'South Korea': { x: 82, y: 34, name: 'South Korea' },
  'Indonesia': { x: 80, y: 57, name: 'Indonesia' },
  'Philippines': { x: 82, y: 48, name: 'Philippines' },
  'Italy': { x: 51, y: 33, name: 'Italy' },
  'Spain': { x: 46, y: 34, name: 'Spain' },
  'Russia': { x: 65, y: 22, name: 'Russia' },
  'Argentina': { x: 28, y: 72, name: 'Argentina' },
  'Colombia': { x: 24, y: 52, name: 'Colombia' },
  'Ghana': { x: 47, y: 50, name: 'Ghana' },
  'Tanzania': { x: 58, y: 58, name: 'Tanzania' },
  'Uganda': { x: 57, y: 55, name: 'Uganda' },
  'Eritrea': { x: 59, y: 47, name: 'Eritrea' },
  'Somalia': { x: 62, y: 52, name: 'Somalia' },
  'Sudan': { x: 56, y: 47, name: 'Sudan' },
};

const ALL_COUNTRIES = Object.keys(COUNTRY_COORDS).sort();

interface MapUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  country: string;
  is_friend: boolean;
  is_clan_member: boolean;
}

const WorldMap = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [mapUsers, setMapUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showOnMap, setShowOnMap] = useState(true);
  const [myCountry, setMyCountry] = useState('');
  const [filter, setFilter] = useState<'all' | 'friends' | 'clan'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile) {
      setShowOnMap((profile as any)?.show_on_map ?? true);
      setMyCountry((profile as any)?.country || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;
    fetchMapUsers();
  }, [profile?.id]);

  const fetchMapUsers = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // Get users who are on the map
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, country')
        .eq('show_on_map', true)
        .not('country', 'is', null)
        .neq('country', '')
        .limit(500);

      if (!users) { setMapUsers([]); return; }

      // Get friends
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

      const friendIds = new Set(
        (friendships || []).map(f => f.requester_id === profile.id ? f.addressee_id : f.requester_id)
      );

      // Get clan members
      const { data: myClan } = await supabase
        .from('clan_members')
        .select('clan_id')
        .eq('user_id', profile.id)
        .limit(1)
        .maybeSingle();

      let clanMemberIds = new Set<string>();
      if (myClan) {
        const { data: clanMembers } = await supabase
          .from('clan_members')
          .select('user_id')
          .eq('clan_id', myClan.clan_id);
        clanMemberIds = new Set((clanMembers || []).map(m => m.user_id));
      }

      setMapUsers(users.map(u => ({
        ...u,
        country: u.country!,
        is_friend: friendIds.has(u.id),
        is_clan_member: clanMemberIds.has(u.id),
      })));
    } catch (err) {
      console.error('Error fetching map users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCountry = async (country: string) => {
    if (!user) return;
    setMyCountry(country);
    const { error } = await supabase.from('profiles').update({ country }).eq('user_id', user.id);
    if (error) toast.error('Failed to update country');
    else { toast.success('Country updated!'); refetch(); fetchMapUsers(); }
  };

  const handleToggleVisibility = async (visible: boolean) => {
    if (!user) return;
    setShowOnMap(visible);
    const { error } = await supabase.from('profiles').update({ show_on_map: visible }).eq('user_id', user.id);
    if (error) toast.error('Failed to update visibility');
    else toast.success(visible ? 'You are now visible on the map' : 'You are hidden from the map');
  };

  // Group users by country
  const filteredUsers = mapUsers.filter(u => {
    if (filter === 'friends') return u.is_friend;
    if (filter === 'clan') return u.is_clan_member;
    return true;
  });

  const countryGroups = filteredUsers.reduce((acc, u) => {
    if (!acc[u.country]) acc[u.country] = [];
    acc[u.country].push(u);
    return acc;
  }, {} as Record<string, MapUser[]>);

  const selectedUsers = selectedCountry ? (countryGroups[selectedCountry] || []).filter(u =>
    !searchQuery || u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Globe className="w-8 h-8 text-accent" />
              World Map
            </h1>
            <p className="text-muted-foreground">See where your friends and community are around the world</p>
          </div>
        </div>

        {/* Settings Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <Select value={myCountry} onValueChange={handleUpdateCountry}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Set your country" />
              </SelectTrigger>
              <SelectContent>
                {ALL_COUNTRIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {showOnMap ? <Eye className="w-4 h-4 text-accent" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
            <span className="text-sm text-foreground">Visible</span>
            <Switch checked={showOnMap} onCheckedChange={handleToggleVisibility} />
          </div>
          <div className="flex gap-2 ml-auto">
            {(['all', 'friends', 'clan'] as const).map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Everyone' : f === 'friends' ? 'Friends' : 'Clan'}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2 relative bg-card rounded-xl border border-border overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {/* Real world map background */}
            <div className="absolute inset-0">
              <img
                src="/images/world-map.png"
                alt="World Map"
                className="w-full h-full object-contain opacity-30 dark:invert dark:opacity-20"
                draggable={false}
              />
            </div>

            {/* Country dots */}
            {Object.entries(countryGroups).map(([country, users]) => {
              const coords = COUNTRY_COORDS[country];
              if (!coords) return null;
              const isSelected = selectedCountry === country;
              const size = Math.min(12 + users.length * 2, 32);

              return (
                <motion.button
                  key={country}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer transition-all z-10 ${
                    isSelected ? 'ring-4 ring-accent bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground hover:ring-2 hover:ring-accent'
                  }`}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%`, width: size, height: size }}
                  onClick={() => setSelectedCountry(isSelected ? null : country)}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.3 }}
                  title={`${coords.name}: ${users.length} user${users.length > 1 ? 's' : ''}`}
                >
                  <span className="text-[8px] font-bold">{users.length}</span>
                </motion.button>
              );
            })}

            {/* Country label on hover */}
            {selectedCountry && COUNTRY_COORDS[selectedCountry] && (
              <motion.div
                className="absolute z-20 bg-popover text-popover-foreground px-3 py-1 rounded-lg shadow-lg text-sm font-medium"
                style={{
                  left: `${COUNTRY_COORDS[selectedCountry].x}%`,
                  top: `${COUNTRY_COORDS[selectedCountry].y - 6}%`,
                  transform: 'translateX(-50%)',
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {selectedCountry} • {countryGroups[selectedCountry]?.length || 0} users
              </motion.div>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Users Panel */}
          <div className="bg-card rounded-xl border border-border p-4 max-h-[500px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-accent" />
              <h3 className="font-display font-semibold text-foreground">
                {selectedCountry ? selectedCountry : 'Select a Country'}
              </h3>
            </div>

            {selectedCountry && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}

            {!selectedCountry ? (
              <p className="text-sm text-muted-foreground">Click a dot on the map to see users in that country</p>
            ) : selectedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found</p>
            ) : (
              <div className="space-y-3">
                {selectedUsers.map(u => (
                  <motion.div
                    key={u.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Avatar className="h-10 w-10">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                      <AvatarFallback className="bg-accent/20 text-accent text-sm">
                        {u.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                    <div className="flex gap-1">
                      {u.is_friend && <Badge variant="secondary" className="text-[10px] px-1.5">Friend</Badge>}
                      {u.is_clan_member && <Badge variant="outline" className="text-[10px] px-1.5">Clan</Badge>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default WorldMap;
