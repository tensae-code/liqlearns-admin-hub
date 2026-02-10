import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RotateCcw, Hand } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface SpinWheelPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const COLORS = [
  'hsl(340, 82%, 52%)', 'hsl(210, 79%, 46%)', 'hsl(150, 60%, 40%)',
  'hsl(45, 93%, 47%)', 'hsl(280, 68%, 50%)', 'hsl(20, 90%, 48%)',
  'hsl(190, 70%, 42%)', 'hsl(0, 72%, 51%)',
];

const SpinWheelPlayer = ({ config, onComplete }: SpinWheelPlayerProps) => {
  const segments = config.wheelSegments || [];
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [spins, setSpins] = useState(0);
  const [stopping, setStopping] = useState(false);
  const stopRef = useRef(false);
  const animRef = useRef<number | null>(null);
  const currentRotRef = useRef(0);

  if (segments.length === 0) return <p className="text-center text-muted-foreground py-8">No wheel segments configured.</p>;

  const segAngle = 360 / segments.length;

  const resolveResult = (finalRot: number) => {
    const normalizedAngle = (360 - (finalRot % 360)) % 360;
    const segmentIndex = Math.floor(normalizedAngle / segAngle) % segments.length;
    return segments[segmentIndex].text;
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setStopping(false);
    stopRef.current = false;
    setResult(null);

    const extraSpins = 5 + Math.random() * 5;
    const landAngle = Math.random() * 360;
    const targetRotation = rotation + extraSpins * 360 + landAngle;

    currentRotRef.current = targetRotation;
    setRotation(targetRotation);

    // After spin animation completes naturally (4s)
    const timer = setTimeout(() => {
      if (!stopRef.current) {
        const landed = resolveResult(targetRotation);
        setResult(landed);
        setSpinning(false);
        setSpins(s => s + 1);
      }
    }, 4000);

    animRef.current = timer as unknown as number;
  };

  const stopWheel = () => {
    if (!spinning || stopping) return;
    setStopping(true);
    stopRef.current = true;

    // Cancel the pending natural completion
    if (animRef.current) clearTimeout(animRef.current);

    // Snap to a random nearby position
    const snapRotation = rotation + Math.random() * 60 + 30;
    setRotation(snapRotation);

    setTimeout(() => {
      const landed = resolveResult(snapRotation);
      setResult(landed);
      setSpinning(false);
      setStopping(false);
      setSpins(s => s + 1);
    }, 800);
  };

  const reset = () => {
    setRotation(0);
    setResult(null);
    setSpins(0);
    setSpinning(false);
    setStopping(false);
    stopRef.current = false;
  };

  const radius = 130;
  const center = 150;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Spins: <span className="font-bold text-foreground">{spins}</span></p>
        <Button size="sm" variant="outline" onClick={reset} className="h-7 px-2 text-xs">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Wheel */}
      <div className="flex flex-col items-center">
        {/* Pointer */}
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-primary mb-[-4px] z-10 relative" />

        <motion.svg
          width="300"
          height="300"
          viewBox="0 0 300 300"
          animate={{ rotate: rotation }}
          transition={stopping
            ? { duration: 0.8, ease: 'easeOut' }
            : { duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }
          }
          className="block"
        >
          {segments.map((seg, i) => {
            const startAngle = (i * segAngle * Math.PI) / 180;
            const endAngle = ((i + 1) * segAngle * Math.PI) / 180;
            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);
            const largeArc = segAngle > 180 ? 1 : 0;
            const midAngle = (startAngle + endAngle) / 2;
            const textR = radius * 0.65;
            const tx = center + textR * Math.cos(midAngle);
            const ty = center + textR * Math.sin(midAngle);
            const textAngleDeg = ((midAngle * 180) / Math.PI);
            const color = seg.color || COLORS[i % COLORS.length];

            return (
              <g key={seg.id}>
                <path
                  d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={tx}
                  y={ty}
                  fill="white"
                  fontSize={segments.length > 6 ? "9" : "11"}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${textAngleDeg}, ${tx}, ${ty})`}
                >
                  {seg.text.length > 12 ? seg.text.slice(0, 12) + '…' : seg.text}
                </text>
              </g>
            );
          })}
          <circle cx={center} cy={center} r="20" fill="white" stroke="hsl(var(--border))" strokeWidth="2" />
        </motion.svg>
      </div>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 bg-primary/10 border border-primary/30 rounded-xl"
        >
          <p className="text-lg font-bold text-foreground">🎯 You landed on:</p>
          <p className="text-xl font-extrabold text-primary mt-1">{result}</p>
        </motion.div>
      )}

      {spinning ? (
        <Button onClick={stopWheel} variant="destructive" className="w-full" size="lg">
          <Hand className="w-5 h-5 mr-2" /> Stop!
        </Button>
      ) : (
        <Button onClick={spin} className="w-full" size="lg">
          🎡 Spin!
        </Button>
      )}
    </div>
  );
};

export default SpinWheelPlayer;
