import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, Loader2 } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  onJoin: (studyTitle: string) => Promise<void>;
}

const JoinRoomModal = ({ isOpen, onClose, roomName, onJoin }: JoinRoomModalProps) => {
  const [studyTitle, setStudyTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (loading) return;
    
    console.log('JoinRoomModal: handleJoin clicked, studyTitle:', studyTitle);
    setLoading(true);
    
    try {
      await onJoin(studyTitle);
      console.log('JoinRoomModal: onJoin completed successfully');
      setStudyTitle('');
    } catch (error) {
      console.error('JoinRoomModal: Error in onJoin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStudyTitle('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" />
            Join "{roomName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Let others know what you're studying today!
            </p>
            <Input
              placeholder="e.g., Practicing Fidel, Learning verbs..."
              value={studyTitle}
              onChange={(e) => setStudyTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleJoin();
                }
              }}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleJoin} 
              disabled={loading}
              className="flex-1 bg-gradient-accent"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Room'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRoomModal;
