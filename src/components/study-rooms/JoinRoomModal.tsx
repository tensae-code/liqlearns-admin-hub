import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Loader2, GraduationCap } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
  onJoin: (studyTitle: string, studyField: string) => Promise<void>;
}

const studyFields = [
  'Languages',
  'Mathematics',
  'Science',
  'History',
  'Literature',
  'Programming',
  'Art & Design',
  'Music',
  'Business',
  'Medicine',
  'Law',
  'Engineering',
  'Psychology',
  'Philosophy',
  'Other',
];

const JoinRoomModal = ({ isOpen, onClose, roomName, onJoin }: JoinRoomModalProps) => {
  const [studyTitle, setStudyTitle] = useState('');
  const [studyField, setStudyField] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (loading) return;
    
    console.log('JoinRoomModal: handleJoin clicked, studyTitle:', studyTitle, 'studyField:', studyField);
    setLoading(true);
    
    try {
      await onJoin(studyTitle, studyField);
      console.log('JoinRoomModal: onJoin completed successfully');
      setStudyTitle('');
      setStudyField('');
    } catch (error) {
      console.error('JoinRoomModal: Error in onJoin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStudyTitle('');
      setStudyField('');
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
          {/* Study Field */}
          <div className="space-y-2">
            <Label htmlFor="studyField" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              What field are you studying?
            </Label>
            <Select value={studyField} onValueChange={setStudyField} disabled={loading}>
              <SelectTrigger id="studyField">
                <SelectValue placeholder="Select your study field" />
              </SelectTrigger>
              <SelectContent>
                {studyFields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Study Title */}
          <div className="space-y-2">
            <Label htmlFor="studyTitle">What specifically are you working on?</Label>
            <Input
              id="studyTitle"
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
