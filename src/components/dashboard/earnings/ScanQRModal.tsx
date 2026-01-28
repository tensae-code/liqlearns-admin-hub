import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';

interface ScanQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ScanQRModal = ({ open, onOpenChange }: ScanQRModalProps) => {
  const { profile } = useProfile();
  const [copied, setCopied] = useState(false);

  const paymentLink = `${window.location.origin}/pay/@${profile?.username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      toast.success('Payment link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Generate a simple QR-like pattern (placeholder for actual QR)
  const qrPlaceholder = (
    <div className="w-48 h-48 bg-white rounded-lg p-4 mx-auto">
      <div className="w-full h-full border-4 border-foreground rounded flex items-center justify-center">
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 25 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 ${Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <QrCode className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            QR Code
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="receive" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-9 md:h-10">
            <TabsTrigger value="receive" className="text-xs md:text-sm">Receive</TabsTrigger>
            <TabsTrigger value="scan" className="text-xs md:text-sm">Scan</TabsTrigger>
          </TabsList>

          <TabsContent value="receive" className="space-y-3 md:space-y-4 pt-3 md:pt-4">
            <p className="text-center text-xs md:text-sm text-muted-foreground">
              Share this QR code to receive payments
            </p>

            {/* QR Code Display */}
            <div className="bg-muted/30 rounded-lg p-4 md:p-6">
              {qrPlaceholder}
              <p className="text-center text-xs md:text-sm font-medium mt-3 md:mt-4">
                @{profile?.username}
              </p>
            </div>

            {/* Payment Link */}
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-muted rounded text-[10px] md:text-xs truncate">
                {paymentLink}
              </div>
              <Button size="sm" variant="outline" onClick={handleCopy} className="h-8 w-8 p-0">
                {copied ? <Check className="w-3 h-3 md:w-4 md:h-4" /> : <Copy className="w-3 h-3 md:w-4 md:h-4" />}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="scan" className="space-y-3 md:space-y-4 pt-3 md:pt-4">
            <div className="bg-muted/30 rounded-lg p-6 md:p-8 text-center">
              <QrCode className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-muted-foreground" />
              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                Camera access is required to scan QR codes
              </p>
              <Button onClick={() => toast.info('Camera feature coming soon!')} size="sm">
                Enable Camera
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ScanQRModal;
