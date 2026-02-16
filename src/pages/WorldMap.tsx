import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { MapPin, Globe, Users, Eye, EyeOff, Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Country coordinates (percentage-based on a world map) with flag emoji
const COUNTRY_COORDS: Record<string, { x: number; y: number; name: string; flag: string }> = {
  'Ethiopia': { x: 58, y: 52, name: 'Ethiopia', flag: '🇪🇹' },
  'United States': { x: 20, y: 35, name: 'United States', flag: '🇺🇸' },
  'United Kingdom': { x: 47, y: 28, name: 'United Kingdom', flag: '🇬🇧' },
  'Canada': { x: 18, y: 25, name: 'Canada', flag: '🇨🇦' },
  'Germany': { x: 50, y: 29, name: 'Germany', flag: '🇩🇪' },
  'France': { x: 48, y: 31, name: 'France', flag: '🇫🇷' },
  'India': { x: 70, y: 42, name: 'India', flag: '🇮🇳' },
  'China': { x: 77, y: 35, name: 'China', flag: '🇨🇳' },
  'Japan': { x: 85, y: 35, name: 'Japan', flag: '🇯🇵' },
  'Brazil': { x: 30, y: 60, name: 'Brazil', flag: '🇧🇷' },
  'Nigeria': { x: 49, y: 50, name: 'Nigeria', flag: '🇳🇬' },
  'South Africa': { x: 55, y: 70, name: 'South Africa', flag: '🇿🇦' },
  'Kenya': { x: 59, y: 55, name: 'Kenya', flag: '🇰🇪' },
  'Egypt': { x: 55, y: 40, name: 'Egypt', flag: '🇪🇬' },
  'Australia': { x: 83, y: 68, name: 'Australia', flag: '🇦🇺' },
  'Mexico': { x: 15, y: 42, name: 'Mexico', flag: '🇲🇽' },
  'Turkey': { x: 56, y: 34, name: 'Turkey', flag: '🇹🇷' },
  'Saudi Arabia': { x: 60, y: 42, name: 'Saudi Arabia', flag: '🇸🇦' },
  'UAE': { x: 63, y: 43, name: 'UAE', flag: '🇦🇪' },
  'South Korea': { x: 82, y: 34, name: 'South Korea', flag: '🇰🇷' },
  'Indonesia': { x: 80, y: 57, name: 'Indonesia', flag: '🇮🇩' },
  'Philippines': { x: 82, y: 48, name: 'Philippines', flag: '🇵🇭' },
  'Italy': { x: 51, y: 33, name: 'Italy', flag: '🇮🇹' },
  'Spain': { x: 46, y: 34, name: 'Spain', flag: '🇪🇸' },
  'Russia': { x: 65, y: 22, name: 'Russia', flag: '🇷🇺' },
  'Argentina': { x: 28, y: 72, name: 'Argentina', flag: '🇦🇷' },
  'Colombia': { x: 24, y: 52, name: 'Colombia', flag: '🇨🇴' },
  'Ghana': { x: 47, y: 50, name: 'Ghana', flag: '🇬🇭' },
  'Tanzania': { x: 58, y: 58, name: 'Tanzania', flag: '🇹🇿' },
  'Uganda': { x: 57, y: 55, name: 'Uganda', flag: '🇺🇬' },
  'Eritrea': { x: 59, y: 47, name: 'Eritrea', flag: '🇪🇷' },
  'Somalia': { x: 62, y: 52, name: 'Somalia', flag: '🇸🇴' },
  'Sudan': { x: 56, y: 47, name: 'Sudan', flag: '🇸🇩' },
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

const WorldMap = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const [mapUsers, setMapUsers] = useState<MapUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showOnMap, setShowOnMap] = useState(true);
  const [myCountry, setMyCountry] = useState('');
  const [myCity, setMyCity] = useState('');
  const [filter, setFilter] = useState<'all' | 'friends' | 'clan'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      setShowOnMap((profile as any)?.show_on_map ?? true);
      setMyCountry((profile as any)?.country || '');
      setMyCity((profile as any)?.city || '');
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
    else toast.success(visible ? 'You are now visible on the map' : 'You are hidden from the map');
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.5, 1));
  const handleResetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const lastTouchDist = useRef<number | null>(null);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
  }, [isPanning]);
  const handleMouseUp = () => setIsPanning(false);

  // Touch: pan + pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsPanning(true);
      panStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist - lastTouchDist.current;
      setZoom(z => Math.min(Math.max(z + delta * 0.01, 1), 4));
      lastTouchDist.current = dist;
    } else if (isPanning && e.touches.length === 1) {
      setPan({ x: e.touches[0].clientX - panStart.current.x, y: e.touches[0].clientY - panStart.current.y });
    }
  }, [isPanning]);
  const handleTouchEnd = () => { setIsPanning(false); lastTouchDist.current = null; };

  // Filter & group
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
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <Select value={myCountry} onValueChange={handleUpdateCountry}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {ALL_COUNTRIES.map(c => (
                  <SelectItem key={c} value={c}>{COUNTRY_COORDS[c]?.flag} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="City / State"
              value={myCity}
              onChange={e => setMyCity(e.target.value)}
              onBlur={handleUpdateCity}
              onKeyDown={e => e.key === 'Enter' && handleUpdateCity()}
              className="w-36"
            />
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
            {/* Zoom controls */}
            <div className="absolute top-3 right-3 z-30 flex flex-col gap-1">
              <Button size="icon" variant="secondary" className="w-8 h-8" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
              <Button size="icon" variant="secondary" className="w-8 h-8" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
              <Button size="icon" variant="secondary" className="w-8 h-8" onClick={handleResetView}><RotateCcw className="w-4 h-4" /></Button>
            </div>

            <div
              ref={mapRef}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transformOrigin: 'center', transition: isPanning ? 'none' : 'transform 0.3s ease' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* World map background */}
              <img
                src="/images/world-map.png"
                alt="World Map"
                className="w-full h-full object-contain opacity-30 dark:invert dark:opacity-20"
                draggable={false}
              />

              {/* Country name labels - clickable */}
              {Object.entries(countryGroups).map(([country, users]) => {
                const coords = COUNTRY_COORDS[country];
                if (!coords) return null;
                const isSelected = selectedCountry === country;

                return (
                  <button
                    key={country}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 flex flex-col items-center gap-0.5 group`}
                    style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                    onClick={(e) => { e.stopPropagation(); setSelectedCountry(isSelected ? null : country); }}
                    title={`${coords.flag} ${coords.name}: ${users.length} users`}
                  >
                    {/* Small dot */}
                    <span className={`w-2.5 h-2.5 rounded-full block transition-all ${
                      isSelected
                        ? 'bg-orange-500 ring-2 ring-orange-300 shadow-lg shadow-orange-500/40'
                        : 'bg-orange-500 shadow-sm shadow-orange-500/30 group-hover:ring-2 group-hover:ring-orange-300'
                    }`} />
                    {/* Country name */}
                    <span className={`text-[7px] leading-none font-semibold whitespace-nowrap transition-colors ${
                      isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-foreground/60 group-hover:text-orange-500'
                    }`}>
                      {coords.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Flag popup - OUTSIDE scaled container so it stays normal size */}
            <AnimatePresence>
              {selectedCountry && COUNTRY_COORDS[selectedCountry] && (
                <motion.div
                  className="absolute z-30 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg shadow-xl border border-border pointer-events-none"
                  style={{
                    left: `${COUNTRY_COORDS[selectedCountry].x}%`,
                    top: `${Math.max(COUNTRY_COORDS[selectedCountry].y - 10, 2)}%`,
                    transform: 'translateX(-50%)',
                  }}
                  initial={{ opacity: 0, y: 5, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{COUNTRY_COORDS[selectedCountry].flag}</span>
                    <div>
                      <p className="font-semibold text-xs">{selectedCountry}</p>
                      <p className="text-[10px] text-muted-foreground">{countryGroups[selectedCountry]?.length || 0} users</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Users Panel */}
          <div className="bg-card rounded-xl border border-border p-4 max-h-[500px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-orange-500" />
              <h3 className="font-display font-semibold text-foreground">
                {selectedCountry ? (
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{COUNTRY_COORDS[selectedCountry]?.flag}</span>
                    {selectedCountry}
                  </span>
                ) : 'Select a Country'}
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
                      <AvatarFallback className="bg-orange-500/20 text-orange-600 text-sm">
                        {u.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{u.username}
                        {u.city && <span className="ml-1 text-orange-500">• {u.city}</span>}
                      </p>
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
