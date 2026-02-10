import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RotateCcw, Eraser } from 'lucide-react';
import type { GameConfig } from '@/lib/gameTypes';

interface TracingPlayerProps {
  config: GameConfig;
  onComplete?: (score: number, maxScore: number) => void;
}

const TracingPlayer = ({ config, onComplete }: TracingPlayerProps) => {
  const tracingItems = config.tracingItems || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const current = tracingItems[currentIdx];

  useEffect(() => {
    clearCanvas();
  }, [currentIdx]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw guide text
    if (current?.text) {
      ctx.font = '72px serif';
      ctx.fillStyle = 'rgba(150, 150, 150, 0.25)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(current.text, canvas.width / 2, canvas.height / 2);
    }
    setHasDrawn(false);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'hsl(var(--primary))';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const next = () => {
    if (currentIdx < tracingItems.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      onComplete?.(tracingItems.length, tracingItems.length);
    }
  };

  const prev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  };

  if (tracingItems.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No tracing items configured</p>;
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Trace: <span className="font-bold text-foreground text-lg">{current?.text}</span></p>
        <p className="text-xs text-muted-foreground">{currentIdx + 1} / {tracingItems.length}</p>
      </div>

      <div className="relative mx-auto border-2 border-border rounded-xl overflow-hidden bg-card" style={{ maxWidth: 400 }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prev} disabled={currentIdx === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <Eraser className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
        <Button size="sm" onClick={next} disabled={!hasDrawn}>
          {currentIdx < tracingItems.length - 1 ? <>Next <ChevronRight className="w-4 h-4 ml-1" /></> : 'Done ✓'}
        </Button>
      </div>
    </div>
  );
};

export default TracingPlayer;
