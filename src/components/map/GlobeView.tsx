import { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';

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

interface GlobeViewProps {
  countryGroups: Record<string, any[]>;
  onSelectCountry: (country: string | null) => void;
  selectedCountry: string | null;
}

const GlobeView = ({ countryGroups, onSelectCountry, selectedCountry }: GlobeViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const phiOffset = useRef(0);
  const thetaOffset = useRef(0);
  const phiVelocity = useRef(0);
  const currentPhi = useRef(0);
  const currentTheta = useRef(0.25);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const markers = Object.entries(countryGroups)
      .filter(([country]) => COUNTRY_COORDS[country])
      .map(([country, users]) => ({
        location: [COUNTRY_COORDS[country].lat, COUNTRY_COORDS[country].lng] as [number, number],
        size: Math.min(0.04 + users.length * 0.015, 0.12),
      }));

    const container = containerRef.current;
    const size = Math.min(container.offsetWidth, container.offsetHeight);

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: size * 2,
      height: size * 2,
      phi: currentPhi.current,
      theta: currentTheta.current,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.976, 0.451, 0.086],
      glowColor: [0.15, 0.15, 0.15],
      markers,
      scale: scaleRef.current,
      onRender: (state) => {
        if (!pointerStart.current) {
          phiOffset.current += 0.003;
        }
        state.phi = phiOffset.current;
        state.theta = currentTheta.current + thetaOffset.current;
        state.width = size * 2;
        state.height = size * 2;
        state.scale = scaleRef.current;
      },
    });

    globeRef.current = globe;

    return () => {
      globe.destroy();
      globeRef.current = null;
    };
  }, [countryGroups]);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    phiOffset.current += dx * 0.005;
    thetaOffset.current = Math.max(-1, Math.min(1, thetaOffset.current - dy * 0.005));
    pointerStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointerStart.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scaleRef.current = Math.max(0.8, Math.min(3, scaleRef.current + delta));
    setScale(scaleRef.current);
  };

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border border-border overflow-hidden bg-background flex items-center justify-center touch-none"
      style={{ height: 'clamp(220px, 38vh, 320px)' }}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="cursor-grab active:cursor-grabbing"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

export default GlobeView;
