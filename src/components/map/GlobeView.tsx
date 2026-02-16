import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

// Country coordinates for globe markers (lat/lng in degrees)
const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Ethiopia': { lat: 9.0, lng: 38.7 },
  'United States': { lat: 39.8, lng: -98.6 },
  'United Kingdom': { lat: 54.0, lng: -2.0 },
  'Canada': { lat: 56.1, lng: -106.3 },
  'Germany': { lat: 51.2, lng: 10.5 },
  'France': { lat: 46.6, lng: 2.2 },
  'India': { lat: 20.6, lng: 79.0 },
  'China': { lat: 35.9, lng: 104.2 },
  'Japan': { lat: 36.2, lng: 138.3 },
  'Brazil': { lat: -14.2, lng: -51.9 },
  'Nigeria': { lat: 9.1, lng: 8.7 },
  'South Africa': { lat: -30.6, lng: 22.9 },
  'Kenya': { lat: -0.02, lng: 37.9 },
  'Egypt': { lat: 26.8, lng: 30.8 },
  'Australia': { lat: -25.3, lng: 133.8 },
  'Mexico': { lat: 23.6, lng: -102.6 },
  'Turkey': { lat: 38.9, lng: 35.2 },
  'Saudi Arabia': { lat: 23.9, lng: 45.1 },
  'UAE': { lat: 23.4, lng: 53.8 },
  'South Korea': { lat: 35.9, lng: 127.8 },
  'Indonesia': { lat: -0.8, lng: 113.9 },
  'Philippines': { lat: 12.9, lng: 121.8 },
  'Italy': { lat: 41.9, lng: 12.6 },
  'Spain': { lat: 40.5, lng: -3.7 },
  'Russia': { lat: 61.5, lng: 105.3 },
  'Argentina': { lat: -38.4, lng: -63.6 },
  'Colombia': { lat: 4.6, lng: -74.3 },
  'Ghana': { lat: 7.9, lng: -1.0 },
  'Tanzania': { lat: -6.4, lng: 34.9 },
  'Uganda': { lat: 1.4, lng: 32.3 },
  'Eritrea': { lat: 15.2, lng: 39.8 },
  'Somalia': { lat: 5.2, lng: 46.2 },
  'Sudan': { lat: 12.9, lng: 30.2 },
};

interface GlobeViewProps {
  countryGroups: Record<string, any[]>;
  onSelectCountry: (country: string | null) => void;
  selectedCountry: string | null;
}

const GlobeView = ({ countryGroups, onSelectCountry, selectedCountry }: GlobeViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;
    let width = 0;

    const markers = Object.entries(countryGroups)
      .filter(([country]) => COUNTRY_COORDS[country])
      .map(([country, users]) => ({
        location: [
          COUNTRY_COORDS[country].lat,
          COUNTRY_COORDS[country].lng,
        ] as [number, number],
        size: Math.min(0.05 + users.length * 0.02, 0.15),
      }));

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.976, 0.451, 0.086], // #f97316
      glowColor: [0.15, 0.15, 0.15],
      markers,
      onRender: (state) => {
        if (pointerInteracting.current === null) {
          phi += 0.003;
        }
        state.phi = phi + pointerInteractionMovement.current;
        phiRef.current = state.phi;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, [countryGroups]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  };

  const handlePointerUp = () => {
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  const handlePointerOut = () => {
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta / 100;
    }
  };

  return (
    <div className="w-full flex items-center justify-center bg-background rounded-xl border border-border overflow-hidden" style={{ height: 'clamp(250px, 40vh, 350px)' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
        className="w-full h-full cursor-grab"
        style={{ maxWidth: '100%', aspectRatio: '1 / 1', contain: 'layout paint size' }}
      />
    </div>
  );
};

export default GlobeView;
