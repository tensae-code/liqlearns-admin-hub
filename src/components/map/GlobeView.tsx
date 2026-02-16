import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { feature } from 'topojson-client';

// Lazy-load the heavy globe component
const Globe = lazy(() => import('react-globe.gl'));

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

// Map of numeric country IDs to country names (world-atlas uses numeric IDs)
const COUNTRY_ID_TO_NAME: Record<string, string> = {
  '231': 'Ethiopia', '840': 'United States', '826': 'United Kingdom', '124': 'Canada',
  '276': 'Germany', '250': 'France', '356': 'India', '156': 'China', '392': 'Japan',
  '076': 'Brazil', '566': 'Nigeria', '710': 'South Africa', '404': 'Kenya', '818': 'Egypt',
  '036': 'Australia', '484': 'Mexico', '792': 'Turkey', '682': 'Saudi Arabia',
  '784': 'UAE', '410': 'South Korea', '360': 'Indonesia', '608': 'Philippines',
  '380': 'Italy', '724': 'Spain', '643': 'Russia', '032': 'Argentina',
  '170': 'Colombia', '288': 'Ghana', '834': 'Tanzania', '800': 'Uganda',
  '232': 'Eritrea', '706': 'Somalia', '729': 'Sudan',
};

interface GlobeViewProps {
  countryGroups: Record<string, any[]>;
  onSelectCountry: (country: string | null) => void;
  selectedCountry: string | null;
}

const GlobeView = ({ countryGroups, onSelectCountry, selectedCountry }: GlobeViewProps) => {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Load world polygons
  useEffect(() => {
    const url = 'https://unpkg.com/world-atlas@2/countries-110m.json';
    (async () => {
      try {
        const res = await fetch(url);
        const topo = await res.json();
        const geo = feature(topo, topo.objects.countries) as any;
        setCountries(geo.features || []);
      } catch (err) {
        console.error('Failed to load world topology:', err);
      }
    })();
  }, []);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setDimensions({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Set initial point of view
  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 15, lng: 20, altitude: 2.2 }, 0);
  }, [countries]); // once countries load the globe is ready

  // Build dots from countryGroups
  const dots = useMemo(() => {
    return Object.entries(countryGroups)
      .filter(([country]) => COUNTRY_COORDS[country])
      .map(([country, users]) => ({
        countryCode: country,
        lat: COUNTRY_COORDS[country].lat,
        lng: COUNTRY_COORDS[country].lng,
        users: users.length,
      }));
  }, [countryGroups]);

  const selectedCountryId = useMemo(() => {
    if (!selectedCountry) return null;
    return Object.entries(COUNTRY_ID_TO_NAME).find(([, name]) => name === selectedCountry)?.[0] || null;
  }, [selectedCountry]);

  const onPolygonClick = (feat: any) => {
    const name = COUNTRY_ID_TO_NAME[feat.id] || null;
    onSelectCountry(name);

    // Zoom into country
    if (feat.bbox && globeRef.current) {
      const lng = (feat.bbox[0] + feat.bbox[2]) / 2;
      const lat = (feat.bbox[1] + feat.bbox[3]) / 2;
      globeRef.current.pointOfView({ lat, lng, altitude: 1.4 }, 600);
    }
  };

  const dotRadius = (d: any) => Math.min(0.55, 0.18 + Math.log10(d.users + 1) * 0.12);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden flex items-center justify-center">
      <Suspense fallback={
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          
          polygonsData={countries}
          polygonAltitude={(d: any) => (d.id === selectedCountryId ? 0.06 : 0.01)}
          polygonCapColor={(d: any) => (d.id === selectedCountryId ? 'rgba(255,140,0,0.55)' : 'rgba(255,255,255,0.06)')}
          polygonSideColor={() => 'rgba(255,140,0,0.12)'}
          polygonStrokeColor={() => 'rgba(255,140,0,0.5)'}
          polygonLabel={(d: any) => {
            const name = COUNTRY_ID_TO_NAME[d.id] || `Country #${d.id}`;
            const users = countryGroups[name]?.length || 0;
            return `<div style="font-size:12px;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;border-radius:6px"><b>${name}</b><br/>Users: ${users}</div>`;
          }}
          onPolygonClick={onPolygonClick}
          
          pointsData={dots}
          pointLat={(d: any) => d.lat}
          pointLng={(d: any) => d.lng}
          pointRadius={(d: any) => dotRadius(d)}
          pointColor={() => 'orange'}
          pointAltitude={0.02}
          pointLabel={(d: any) =>
            `<div style="font-size:12px;background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;border-radius:6px"><b>${d.countryCode}</b><br/>Users: ${d.users}</div>`
          }
          
          enablePointerInteraction={true}
        />
      </Suspense>
    </div>
  );
};

export default GlobeView;
