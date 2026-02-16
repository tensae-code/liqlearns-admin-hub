import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { MapPin, Globe, Users, Eye, EyeOff, Search, Map } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GlobeView from '@/components/map/GlobeView';

const COUNTRY_FLAGS: Record<string, string> = {
  'Ethiopia': '🇪🇹', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'India': '🇮🇳', 'China': '🇨🇳', 'Japan': '🇯🇵',
  'Brazil': '🇧🇷', 'Nigeria': '🇳🇬', 'South Africa': '🇿🇦', 'Kenya': '🇰🇪', 'Egypt': '🇪🇬',
  'Australia': '🇦🇺', 'Mexico': '🇲🇽', 'Turkey': '🇹🇷', 'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪',
  'South Korea': '🇰🇷', 'Indonesia': '🇮🇩', 'Philippines': '🇵🇭', 'Italy': '🇮🇹',
  'Spain': '🇪🇸', 'Russia': '🇷🇺', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Ghana': '🇬🇭',
  'Tanzania': '🇹🇿', 'Uganda': '🇺🇬', 'Eritrea': '🇪🇷', 'Somalia': '🇸🇴', 'Sudan': '🇸🇩',
};

const ALL_COUNTRIES = Object.keys(COUNTRY_FLAGS).sort();

const GEOJSON_NAME_MAP: Record<string, string> = {
  'United States of America': 'United States',
  'Republic of Korea': 'South Korea',
  'United Republic of Tanzania': 'Tanzania',
  'United Arab Emirates': 'UAE',
  'United Kingdom of Great Britain and Northern Ireland': 'United Kingdom',
};

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

const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

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
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'globe'>('map');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const selectedCountryRef = useRef<string | null>(null);

  useEffect(() => {
    selectedCountryRef.current = selectedCountry;
  }, [selectedCountry]);

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

  // Initialize Leaflet map only when in map mode
  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!mapContainerRef.current) return;

    // Destroy old map if exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      geoJsonLayerRef.current = null;
    }

    const worldBounds = L.latLngBounds(L.latLng(-60, -180), L.latLng(80, 180));

    const map = L.map(mapContainerRef.current, {
      center: [25, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      scrollWheelZoom: true,
      zoomControl: true,
      worldCopyJump: false,
      maxBounds: L.latLngBounds(L.latLng(-85, -200), L.latLng(85, 200)),
      maxBoundsViscosity: 1.0,
    });

    map.fitBounds(worldBounds, { padding: [5, 5] });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      noWrap: true,
    }).addTo(map);

    mapRef.current = map;

    fetch(GEOJSON_URL)
      .then(res => res.json())
      .then((geojson) => {
        const layer = L.geoJSON(geojson, {
          style: () => ({
            fillColor: 'transparent',
            fillOpacity: 0,
            color: 'transparent',
            weight: 1,
          }),
          onEachFeature: (feature, featureLayer) => {
            const geoName = feature.properties?.ADMIN || feature.properties?.name || '';
            const countryName = GEOJSON_NAME_MAP[geoName] || geoName;

            featureLayer.on({
              mouseover: (e) => {
                e.target.setStyle({
                  fillColor: '#f97316',
                  fillOpacity: 0.15,
                  color: '#f97316',
                  weight: 2,
                });
                e.target.bringToFront();
                setHoveredCountry(countryName);
              },
              mouseout: (e) => {
                const isSelected = selectedCountryRef.current === countryName;
                e.target.setStyle(isSelected ? {
                  fillColor: '#f97316',
                  fillOpacity: 0.25,
                  color: '#ea580c',
                  weight: 2.5,
                } : {
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  color: 'transparent',
                  weight: 1,
                });
                setHoveredCountry(null);
              },
              click: () => {
                setSelectedCountry(prev => prev === countryName ? null : countryName);
              },
            });
          },
        }).addTo(map);

        geoJsonLayerRef.current = layer;
      })
      .catch(err => console.error('Failed to load GeoJSON:', err));

    // Invalidate size after a tick so tiles fill properly
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      geoJsonLayerRef.current = null;
    };
  }, [viewMode]);

  // Update GeoJSON styles when selectedCountry changes
  useEffect(() => {
    const layer = geoJsonLayerRef.current;
    if (!layer) return;

    layer.eachLayer((featureLayer: any) => {
      const feature = featureLayer.feature;
      if (!feature) return;
      const geoName = feature.properties?.ADMIN || feature.properties?.name || '';
      const countryName = GEOJSON_NAME_MAP[geoName] || geoName;
      const isSelected = selectedCountry === countryName;

      featureLayer.setStyle({
        fillColor: isSelected ? '#f97316' : 'transparent',
        fillOpacity: isSelected ? 0.25 : 0,
        color: isSelected ? '#ea580c' : 'transparent',
        weight: isSelected ? 2.5 : 1,
      });
    });
  }, [selectedCountry]);

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

  const selectedUsers = selectedCountry ? (countryGroups[selectedCountry] || []).filter(u =>
    !searchQuery || u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const selectedFlag = selectedCountry ? (COUNTRY_FLAGS[selectedCountry] || '🌍') : '';
  const selectedUserCount = selectedCountry ? (countryGroups[selectedCountry]?.length || 0) : 0;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Globe className="w-7 h-7 text-accent" />
              World Map
            </h1>
            <p className="text-sm text-muted-foreground">
              {hoveredCountry ? `${COUNTRY_FLAGS[hoveredCountry] || '🌍'} ${hoveredCountry}` : 'Click any country to see users there'}
            </p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button
              size="sm"
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              className="h-7 text-xs px-3 gap-1.5"
              onClick={() => setViewMode('map')}
            >
              <Map className="w-3.5 h-3.5" />
              Map
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'globe' ? 'default' : 'ghost'}
              className="h-7 text-xs px-3 gap-1.5"
              onClick={() => setViewMode('globe')}
            >
              <Globe className="w-3.5 h-3.5" />
              Globe
            </Button>
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
                  <SelectItem key={c} value={c}>{COUNTRY_FLAGS[c]} {c}</SelectItem>
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

        <div className="space-y-4">
          {/* Map or Globe */}
          {viewMode === 'map' ? (
            <div className="w-full rounded-xl border border-border overflow-hidden relative z-0 isolate" style={{ height: 'clamp(220px, 38vh, 320px)' }}>
              <div ref={mapContainerRef} className="h-full w-full" />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1000]">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <GlobeView
              countryGroups={countryGroups}
              onSelectCountry={setSelectedCountry}
              selectedCountry={selectedCountry}
            />
          )}

          {/* Users Panel */}
          <div className="w-full bg-card rounded-xl border border-border p-4 max-h-[300px] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-accent" />
              <h3 className="font-display font-semibold text-foreground text-sm">
                {selectedCountry ? (
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{selectedFlag}</span>
                    {selectedCountry}
                    <Badge variant="secondary" className="text-[10px]">{selectedUserCount}</Badge>
                  </span>
                ) : 'Click a country on the map'}
              </h3>
            </div>

            {selectedCountry && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
              </div>
            )}

            {!selectedCountry ? (
              <p className="text-xs text-muted-foreground">Click any country on the map to see users located there</p>
            ) : selectedUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No users found in {selectedCountry}</p>
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
                      <AvatarFallback className="bg-accent/20 text-accent-foreground text-xs">
                        {u.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{u.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        @{u.username}
                        {u.city && <span className="ml-1 text-accent">• {u.city}</span>}
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
