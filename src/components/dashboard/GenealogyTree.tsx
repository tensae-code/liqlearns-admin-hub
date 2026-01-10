import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Users, 
  ChevronRight,
  Crown,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NetworkMember {
  id: string;
  name: string;
  avatar: string;
  package: 'beginner' | 'basic' | 'advanced' | 'pro';
  points: number;
  referrals: number;
  children?: NetworkMember[];
}

const packageColors = {
  beginner: { border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-600', label: 'Beginner' },
  basic: { border: 'border-blue-400', bg: 'bg-blue-100', text: 'text-blue-600', label: 'Basic' },
  advanced: { border: 'border-orange-400', bg: 'bg-orange-100', text: 'text-orange-600', label: 'Advanced' },
  pro: { border: 'border-purple-400', bg: 'bg-purple-100', text: 'text-purple-600', label: 'Pro' },
};

const mockNetwork: NetworkMember = {
  id: 'you',
  name: 'You',
  avatar: 'Y',
  package: 'advanced',
  points: 200,
  referrals: 12,
  children: [
    {
      id: '1',
      name: 'Alemayehu M.',
      avatar: 'A',
      package: 'pro',
      points: 400,
      referrals: 8,
      children: [
        { id: '1-1', name: 'Sara T.', avatar: 'S', package: 'basic', points: 100, referrals: 3 },
        { id: '1-2', name: 'Dawit B.', avatar: 'D', package: 'advanced', points: 200, referrals: 5 },
      ]
    },
    {
      id: '2',
      name: 'Tigist K.',
      avatar: 'T',
      package: 'basic',
      points: 100,
      referrals: 4,
      children: [
        { id: '2-1', name: 'Yonas G.', avatar: 'Y', package: 'beginner', points: 50, referrals: 1 },
        { id: '2-2', name: 'Hanna A.', avatar: 'H', package: 'basic', points: 100, referrals: 2 },
      ]
    },
    {
      id: '3',
      name: 'Bereket F.',
      avatar: 'B',
      package: 'advanced',
      points: 200,
      referrals: 6,
      children: [
        { id: '3-1', name: 'Meron L.', avatar: 'M', package: 'pro', points: 400, referrals: 4 },
      ]
    },
  ]
};

const NetworkMemberNode = ({ 
  member, 
  isRoot = false,
  onSelect 
}: { 
  member: NetworkMember; 
  isRoot?: boolean;
  onSelect: (member: NetworkMember) => void;
}) => {
  const colors = packageColors[member.package];
  
  return (
    <div className="flex flex-col items-center">
      {/* Member Node */}
      <motion.button
        className={cn(
          'relative flex flex-col items-center p-3 rounded-xl border-2 bg-card transition-all',
          colors.border,
          'hover:shadow-lg hover:scale-105'
        )}
        whileHover={{ y: -2 }}
        onClick={() => onSelect(member)}
      >
        {/* Avatar */}
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2',
          colors.bg,
          colors.text
        )}>
          {member.avatar}
        </div>
        
        {/* Name */}
        <p className="text-sm font-medium text-foreground text-center max-w-[80px] truncate">
          {member.name}
        </p>
        
        {/* Package Badge */}
        <Badge className={cn('text-[10px] mt-1', colors.bg, colors.text)}>
          {colors.label}
        </Badge>
        
        {/* Points */}
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3 h-3 text-gold" />
          <span className="text-xs text-muted-foreground">{member.points} pts</span>
        </div>
        
        {/* Crown for root */}
        {isRoot && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Crown className="w-5 h-5 text-gold" />
          </div>
        )}
      </motion.button>

      {/* Children */}
      {member.children && member.children.length > 0 && (
        <>
          {/* Vertical line */}
          <div className="w-0.5 h-6 bg-border" />
          
          {/* Horizontal connector line */}
          <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-border" 
              style={{ width: `${Math.max(member.children.length - 1, 0) * 120}px` }} 
            />
          </div>
          
          {/* Children nodes */}
          <div className="flex gap-4 mt-6">
            {member.children.map((child) => (
              <div key={child.id} className="relative">
                {/* Vertical line to child */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-border -mt-6" />
                <NetworkMemberNode member={child} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const GenealogyTree = () => {
  const [zoom, setZoom] = useState(1);
  const [selectedMember, setSelectedMember] = useState<NetworkMember | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleReset = () => {
    setZoom(1);
    setSelectedMember(null);
  };

  // Calculate network stats
  const leftLegPoints = (mockNetwork.children?.[0]?.points || 0) + 
    (mockNetwork.children?.[0]?.children?.reduce((sum, c) => sum + c.points, 0) || 0);
  const rightLegPoints = (mockNetwork.children?.[2]?.points || 0) + 
    (mockNetwork.children?.[2]?.children?.reduce((sum, c) => sum + c.points, 0) || 0);
  const matchedVolume = Math.floor(Math.min(leftLegPoints, rightLegPoints) / 500) * 500;

  return (
    <motion.div
      className="bg-card rounded-xl border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <h2 className="font-display font-semibold text-foreground">Network Genealogy</h2>
          </div>
          <Button variant="ghost" size="sm">
            View Full <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-border bg-muted/30">
        <div className="text-center">
          <p className="text-lg font-bold text-blue-500">{leftLegPoints}</p>
          <p className="text-xs text-muted-foreground">Left Leg</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-success">{matchedVolume}</p>
          <p className="text-xs text-muted-foreground">Matched</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-500">{rightLegPoints}</p>
          <p className="text-xs text-muted-foreground">Right Leg</p>
        </div>
      </div>

      {/* Tree Container */}
      <div 
        ref={containerRef}
        className="overflow-auto p-6"
        style={{ maxHeight: '400px' }}
      >
        <div 
          className="flex justify-center min-w-max transition-transform"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          <NetworkMemberNode 
            member={mockNetwork} 
            isRoot 
            onSelect={setSelectedMember}
          />
        </div>
      </div>

      {/* Selected Member Details */}
      {selectedMember && (
        <div className="p-4 border-t border-border bg-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                packageColors[selectedMember.package].bg,
                packageColors[selectedMember.package].text
              )}>
                {selectedMember.avatar}
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedMember.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedMember.referrals} referrals • {selectedMember.points} pts
                </p>
              </div>
            </div>
            <Badge className={cn(
              packageColors[selectedMember.package].bg,
              packageColors[selectedMember.package].text
            )}>
              {packageColors[selectedMember.package].label}
            </Badge>
          </div>
        </div>
      )}

      {/* Package Legend */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Package Legend</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(packageColors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded-full', value.bg, 'border-2', value.border)} />
              <span className="text-xs text-muted-foreground">{value.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default GenealogyTree;
