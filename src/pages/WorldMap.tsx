import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Country center coordinates (lat/lng)
const COUNTRY_COORDS: Record<string, { lat: number; lng: number; name: string; flag: string }> = {
  'Ethiopia': { lat: 9.0, lng: 38.7, name: 'Ethiopia', flag: '🇪🇹' },
  'United States': { lat: 39.8, lng: -98.6, name: 'United States', flag: '🇺🇸' },
  'United Kingdom': { lat: 54.0, lng: -2.0, name: 'United Kingdom', flag: '🇬🇧' },
  'Canada': { lat: 56.1, lng: -106.3, name: 'Canada', flag: '🇨🇦' },
  'Germany': { lat: 51.2, lng: 10.5, name: 'Germany', flag: '🇩🇪' },
  'France': { lat: 46.6, lng: 2.2, name: 'France', flag: '🇫🇷' },
  'India': { lat: 20.6, lng: 79.0, name: 'India', flag: '🇮🇳' },
  'China': { lat: 35.9, lng: 104.2, name: 'China', flag: '🇨🇳' },
  'Japan': { lat: 36.2, lng: 138.3, name: 'Japan', flag: '🇯🇵' },
  'Brazil': { lat: -14.2, lng: -51.9, name: 'Brazil', flag: '🇧🇷' },
  'Nigeria': { lat: 9.1, lng: 8.7, name: 'Nigeria', flag: '🇳🇬' },
  'South Africa': { lat: -30.6, lng: 22.9, name: 'South Africa', flag: '🇿🇦' },
  'Kenya': { lat: -0.02, lng: 37.9, name: 'Kenya', flag: '🇰🇪' },
  'Egypt': { lat: 26.8, lng: 30.8, name: 'Egypt', flag: '🇪🇬' },
  'Australia': { lat: -25.3, lng: 133.8, name: 'Australia', flag: '🇦🇺' },
  'Mexico': { lat: 23.6, lng: -102.6, name: 'Mexico', flag: '🇲🇽' },
  'Turkey': { lat: 38.9, lng: 35.2, name: 'Turkey', flag: '🇹🇷' },
  'Saudi Arabia': { lat: 23.9, lng: 45.1, name: 'Saudi Arabia', flag: '🇸🇦' },
  'UAE': { lat: 23.4, lng: 53.8, name: 'UAE', flag: '🇦🇪' },
  'South Korea': { lat: 35.9, lng: 127.8, name: 'South Korea', flag: '🇰🇷' },
  'Indonesia': { lat: -0.8, lng: 113.9, name: 'Indonesia', flag: '🇮🇩' },
  'Philippines': { lat: 12.9, lng: 121.8, name: 'Philippines', flag: '🇵🇭' },
  'Italy': { lat: 41.9, lng: 12.6, name: 'Italy', flag: '🇮🇹' },
  'Spain': { lat: 40.5, lng: -3.7, name: 'Spain', flag: '🇪🇸' },
  'Russia': { lat: 61.5, lng: 105.3, name: 'Russia', flag: '🇷🇺' },
  'Argentina': { lat: -38.4, lng: -63.6, name: 'Argentina', flag: '🇦🇷' },
  'Colombia': { lat: 4.6, lng: -74.3, name: 'Colombia', flag: '🇨🇴' },
  'Ghana': { lat: 7.9, lng: -1.0, name: 'Ghana', flag: '🇬🇭' },
  'Tanzania': { lat: -6.4, lng: 34.9, name: 'Tanzania', flag: '🇹🇿' },
  'Uganda': { lat: 1.4, lng: 32.3, name: 'Uganda', flag: '🇺🇬' },
  'Eritrea': { lat: 15.2, lng: 39.8, name: 'Eritrea', flag: '🇪🇷' },
  'Somalia': { lat: 5.2, lng: 46.2, name: 'Somalia', flag: '🇸🇴' },
  'Sudan': { lat: 12.9, lng: 30.2, name: 'Sudan', flag: '🇸🇩' },
};

const ALL_COUNTRIES = Object.keys(COUNTRY_COORDS).sort();

interface MapUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  country: string;
  city: string | null;
  is_friend: boolean;
  is_clan_member: boolean;
}

// Component to fly to selected country
const FlyToCountry = ({ country }: { country: string | null }) => {
  const map = useMap();
  useEffect(() => {
    if (country && COUNTRY_COORDS[country]) {
      const { lat, lng } = COUNTRY_COORDS[country];
      map.flyTo([lat, lng], 5, { duration: 1 });
    }
  }, [country, map]);
  return null;
};

const WorldMap = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [mapUsers, setMapUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showOnMap, setShowOnMap] = useState(true);
  const [mapVisibility, setMapVisibility] = useState<'everyone' | 'friends' | 'clan'>('everyone');
  const [myCountry, setMyCountry] = useState('');
  const [myCity, setMyCity] = useState('');
  const [filter, setFilter] = useState<'all' | 'friends' | 'clan'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile) {
      setShowOnMap((profile as any)?.show_on_map ?? true);
      setMyCountry((profile as any)?.country || '');
      setMyCity((profile as any)?.city || '');
      setMapVisibility((profile as any)?.map_visibility || 'everyone');
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
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, country, city')
        .eq('show_on_map', true)
        .not('country', 'is', null)
        .neq('country', '')
        .limit(500);

      if (!users) { setMapUsers([]); return; }

      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);

      const friendIds = new Set(
        (friendships || []).map(f => f.requester_id === profile.id ? f.addressee_id : f.requester_id)
      );

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
        city: (u as any).city || null,
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

  const handleUpdateCity = async () => {
    if (!user || !myCity.trim()) return;
    const { error } = await supabase.from('profiles').update({ city: myCity.trim() } as any).eq('user_id', user.id);
    if (error) toast.error('Failed to update city');
    else { toast.success('City updated!'); refetch(); fetchMapUsers(); }
  };

  const handleToggleVisibility = async (visible: boolean) => {
    if (!user) return;
    setShowOnMap(visible);
    const { error } = await supabase.from('profiles').update({ show_on_map: visible }).eq('user_id', user.id);
    if (error) toast.error('Failed to update visibility');
    else toast.success(visible ? 'Visible on map' : 'Hidden from map');
  };

  const handleUpdateMapVisibility = async (vis: string) => {
    if (!user) return;
    setMapVisibility(vis as any);
    await supabase.from('profiles').update({ map_visibility: vis } as any).eq('user_id', user.id);
  };

  const filteredUsers = useMemo(() => mapUsers.filter(u => {
    if (filter === 'friends') return u.is_friend;
    if (filter === 'clan') return u.is_clan_member;
    return true;
  }), [mapUsers, filter]);

  const countryGroups = useMemo(() => filteredUsers.reduce((acc, u) => {
    if (!acc[u.country]) acc[u.country] = [];
    acc[u.country].push(u);
    return acc;
  }, {} as Record<string, MapUser[]>), [filteredUsers]);

  const selectedUsers = selectedCountry ? (countryGroups[selectedCountry] || []).filter(u =>
    !searchQuery || u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Globe className="w-7 h-7 text-accent" />
              World Map
            </h1>
            <p className="text-sm text-muted-foreground">See where your community is around the world</p>
          </div>
        </div>

        {/* Settings Bar */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 p-3 bg-card rounded-xl border border-border text-sm">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            <Select value={myCountry} onValueChange={handleUpdateCountry}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {ALL_COUNTRIES.map(c => (
                  <SelectItem key={c} value={c}>{COUNTRY_COORDS[c]?.flag} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="City / State"
            value={myCity}
            onChange={e => setMyCity(e.target.value)}
            onBlur={handleUpdateCity}
            onKeyDown={e => e.key === 'Enter' && handleUpdateCity()}
            className="w-28 h-8 text-xs"
          />
          <div className="flex items-center gap-1.5">
            {showOnMap ? <Eye className="w-3.5 h-3.5 text-accent" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
            <Switch checked={showOnMap} onCheckedChange={handleToggleVisibility} className="scale-90" />
          </div>
          <Select value={mapVisibility} onValueChange={handleUpdateMapVisibility}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="friends">Friends only</SelectItem>
              <SelectItem value="clan">Clan only</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1 ml-auto">
            {(['all', 'friends', 'clan'] as const).map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="h-7 text-xs px-2" onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'friends' ? 'Friends' : 'Clan'}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Leaflet Map */}
          <div className="lg:col-span-2 rounded-xl border border-border overflow-hidden relative" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              maxZoom={10}
              scrollWheelZoom={true}
              zoomControl={true}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyToCountry country={selectedCountry} />

              {Object.entries(countryGroups).map(([country, users]) => {
                const coords = COUNTRY_COORDS[country];
                if (!coords) return null;
                const isSelected = selectedCountry === country;
                const radius = Math.min(6 + Math.log2(users.length + 1) * 3, 16);

                return (
                  <CircleMarker
                    key={country}
                    center={[coords.lat, coords.lng]}
                    radius={radius}
                    pathOptions={{
                      fillColor: '#f97316',
                      color: isSelected ? '#fff' : '#ea580c',
                      weight: isSelected ? 3 : 1.5,
                      fillOpacity: isSelected ? 1 : 0.8,
                    }}
                    eventHandlers={{
                      click: () => setSelectedCountry(isSelected ? null : country),
                    }}
                  />
                );
              })}
            </MapContainer>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1000]">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Users Panel */}
          <div className="bg-card rounded-xl border border-border p-4 max-h-[500px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-orange-500" />
              <h3 className="font-display font-semibold text-foreground text-sm">
                {selectedCountry ? (
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{COUNTRY_COORDS[selectedCountry]?.flag}</span>
                    {selectedCountry}
                    <Badge variant="secondary" className="text-[10px]">{countryGroups[selectedCountry]?.length || 0}</Badge>
                  </span>
                ) : 'Tap a country on the map'}
              </h3>
            </div>

            {selectedCountry && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
              </div>
            )}

            {!selectedCountry ? (
              <p className="text-xs text-muted-foreground">Click an orange dot on the map to see users in that country</p>
            ) : selectedUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No users found</p>
            ) : (
              <div className="space-y-2">
                {selectedUsers.map(u => (
                  <motion.div
                    key={u.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Avatar className="h-9 w-9">
                      {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                      <AvatarFallback className="bg-orange-500/20 text-orange-600 text-xs">
                        {u.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{u.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        @{u.username}
                        {u.city && <span className="ml-1 text-orange-500">• {u.city}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {u.is_friend && <Badge variant="secondary" className="text-[9px] px-1">Friend</Badge>}
                      {u.is_clan_member && <Badge variant="outline" className="text-[9px] px-1">Clan</Badge>}
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
