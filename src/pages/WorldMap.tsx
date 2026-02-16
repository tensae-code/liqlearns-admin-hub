import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { MapPin, Globe, Users, Eye, EyeOff, Search, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const COUNTRY_FLAGS: Record<string, string> = {
  'Ethiopia': '🇪🇹', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Canada': '🇨🇦',
  'Germany': '🇩🇪', 'France': '🇫🇷', 'India': '🇮🇳', 'China': '🇨🇳', 'Japan': '🇯🇵',
  'Brazil': '🇧🇷', 'Nigeria': '🇳🇬', 'South Africa': '🇿🇦', 'Kenya': '🇰🇪', 'Egypt': '🇪🇬',
  'Australia': '🇦🇺', 'Mexico': '🇲🇽', 'Turkey': '🇹🇷', 'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪',
  'South Korea': '🇰🇷', 'Indonesia': '🇮🇩', 'Philippines': '🇵🇭', 'Italy': '🇮🇹',
  'Spain': '🇪🇸', 'Russia': '🇷🇺', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'Ghana': '🇬🇭',
  'Tanzania': '🇹🇿', 'Uganda': '🇺🇬', 'Eritrea': '🇪🇷', 'Somalia': '🇸🇴', 'Sudan': '🇸🇩',
};

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Ethiopia': { lat: 9.0, lng: 38.7 }, 'United States': { lat: 39.8, lng: -98.6 },
  'United Kingdom': { lat: 54.0, lng: -2.0 }, 'Canada': { lat: 56.1, lng: -106.3 },
  'Germany': { lat: 51.2, lng: 10.5 }, 'France': { lat: 46.6, lng: 2.2 },
  'India': { lat: 20.6, lng: 79.0 }, 'China': { lat: 35.9, lng: 104.2 },
  'Japan': { lat: 36.2, lng: 138.3 }, 'Brazil': { lat: -14.2, lng: -51.9 },
  'Nigeria': { lat: 9.1, lng: 8.7 }, 'South Africa': { lat: -30.6, lng: 22.9 },
  'Kenya': { lat: -0.02, lng: 37.9 }, 'Egypt': { lat: 26.8, lng: 30.8 },
  'Australia': { lat: -25.3, lng: 133.8 }, 'Mexico': { lat: 23.6, lng: -102.6 },
  'Turkey': { lat: 38.9, lng: 35.2 }, 'Saudi Arabia': { lat: 23.9, lng: 45.1 },
  'UAE': { lat: 23.4, lng: 53.8 }, 'South Korea': { lat: 35.9, lng: 127.8 },
  'Indonesia': { lat: -0.8, lng: 113.9 }, 'Philippines': { lat: 12.9, lng: 121.8 },
  'Italy': { lat: 41.9, lng: 12.6 }, 'Spain': { lat: 40.5, lng: -3.7 },
  'Russia': { lat: 61.5, lng: 105.3 }, 'Argentina': { lat: -38.4, lng: -63.6 },
  'Colombia': { lat: 4.6, lng: -74.3 }, 'Ghana': { lat: 7.9, lng: -1.0 },
  'Tanzania': { lat: -6.4, lng: 34.9 }, 'Uganda': { lat: 1.4, lng: 32.3 },
  'Eritrea': { lat: 15.2, lng: 39.8 }, 'Somalia': { lat: 5.2, lng: 46.2 },
  'Sudan': { lat: 12.9, lng: 30.2 },
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
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
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

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      geoJsonLayerRef.current = null;
      markersLayerRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 18,
      scrollWheelZoom: true,
      zoomControl: true,
      worldCopyJump: true,
      // No maxBounds — allow free panning
    });

    // Light theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    mapRef.current = map;

    // Markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Load GeoJSON countries
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
                  fillOpacity: 0.1,
                  color: '#f97316',
                  weight: 1.5,
                });
                e.target.bringToFront();
                setHoveredCountry(countryName);
              },
              mouseout: (e) => {
                const isSelected = selectedCountryRef.current === countryName;
                e.target.setStyle(isSelected ? {
                  fillColor: '#f97316',
                  fillOpacity: 0.2,
                  color: '#ea580c',
                  weight: 2,
                } : {
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  color: 'transparent',
                  weight: 1,
                });
                setHoveredCountry(null);
              },
              click: () => {
                setSelectedCountry(prev => {
                  const next = prev === countryName ? null : countryName;
                  if (next) {
                    setShowBottomSheet(true);
                  } else {
                    setShowBottomSheet(false);
                  }
                  return next;
                });
              },
            });
          },
        }).addTo(map);

        geoJsonLayerRef.current = layer;
      })
      .catch(err => console.error('Failed to load GeoJSON:', err));

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      geoJsonLayerRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

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
        fillOpacity: isSelected ? 0.2 : 0,
        color: isSelected ? '#ea580c' : 'transparent',
        weight: isSelected ? 2 : 1,
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

  // Add/update orange dot markers when countryGroups change
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    Object.entries(countryGroups).forEach(([country, users]) => {
      const coords = COUNTRY_COORDS[country];
      if (!coords) return;

      const radius = Math.min(4 + users.length * 1.5, 12);

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius,
        fillColor: '#f97316',
        fillOpacity: 0.85,
        color: '#ea580c',
        weight: 1.5,
      });

      marker.bindTooltip(
        `${COUNTRY_FLAGS[country] || '🌍'} ${country} — ${users.length} user${users.length !== 1 ? 's' : ''}`,
        { direction: 'top', offset: [0, -8] }
      );

      marker.on('click', () => {
        setSelectedCountry(country);
        setShowBottomSheet(true);
      });

      markersLayer.addLayer(marker);
    });
  }, [countryGroups]);

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Globe className="w-6 h-6 text-accent" />
              World Map
            </h1>
            <p className="text-xs text-muted-foreground">
              {hoveredCountry ? `${COUNTRY_FLAGS[hoveredCountry] || '🌍'} ${hoveredCountry}` : 'Tap any country to see users'}
            </p>
          </div>
        </div>

        {/* Settings Bar */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 p-2.5 bg-card rounded-xl border border-border text-sm">
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
        </div>

        {/* Map Container — fills remaining space */}
        <div className="relative rounded-xl border border-border overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '320px' }}>
          <div ref={mapContainerRef} className="absolute inset-0" />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-[1000]">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Bottom sheet popup when a country is selected */}
          <AnimatePresence>
            {showBottomSheet && selectedCountry && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[1001] bg-card border-t border-border rounded-t-2xl shadow-lg max-h-[60%] flex flex-col"
              >
                {/* Handle */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedFlag}</span>
                    <div>
                      <h3 className="font-display font-bold text-foreground text-sm">{selectedCountry}</h3>
                      <p className="text-xs text-muted-foreground">{selectedUserCount} user{selectedUserCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setShowBottomSheet(false); setSelectedCountry(null); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 px-4 pb-2">
                  {(['all', 'friends', 'clan'] as const).map(f => (
                    <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="h-7 text-xs px-3" onClick={() => setFilter(f)}>
                      {f === 'all' ? 'All Users' : f === 'friends' ? 'Friends' : 'Clan'}
                    </Button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative px-4 pb-2">
                  <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
                </div>

                {/* User list */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {selectedUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No users found in {selectedCountry}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedUsers.map(u => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-8 w-8">
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
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default WorldMap;
