import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Video, Users, Globe, GraduationCap } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    name: string;
    description?: string;
    room_type: 'public' | 'private' | 'kids';
    study_topic?: string;
    education_level?: string;
    country?: string;
    max_participants?: number;
  }) => Promise<any>;
}

const countries = [
  'Ethiopia', 'United States', 'United Kingdom', 'Canada', 'Germany',
  'France', 'Australia', 'Kenya', 'Nigeria', 'South Africa', 'Other'
];

const educationLevels = [
  { value: 'elementary', label: 'Elementary School' },
  { value: 'middle_school', label: 'Middle School' },
  { value: 'high_school', label: 'High School' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' },
  { value: 'professional', label: 'Professional' },
  { value: 'other', label: 'Other' },
];

const CreateRoomModal = ({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState<'public' | 'private' | 'kids'>('public');
  const [studyTopic, setStudyTopic] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [country, setCountry] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await onCreateRoom({
      name: name.trim(),
      description: description.trim() || undefined,
      room_type: roomType,
      study_topic: studyTopic.trim() || undefined,
      education_level: educationLevel || undefined,
      country: country || undefined,
      max_participants: parseInt(maxParticipants) || 20,
    });

    if (result) {
      setName('');
      setDescription('');
      setRoomType('public');
      setStudyTopic('');
      setEducationLevel('');
      setCountry('');
      setMaxParticipants('20');
      onClose();
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-accent" />
            Create Study Room
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Room Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Amharic Study Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What will you be studying?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Room Type</Label>
              <Select value={roomType} onValueChange={(v: 'public' | 'private' | 'kids') => setRoomType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Private
                    </div>
                  </SelectItem>
                  <SelectItem value="kids">
                    <div className="flex items-center gap-2">
                      🧒 Kids (Under 18)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Participants</Label>
              <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 people</SelectItem>
                  <SelectItem value="10">10 people</SelectItem>
                  <SelectItem value="20">20 people</SelectItem>
                  <SelectItem value="50">50 people</SelectItem>
                  <SelectItem value="100">100 people</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="studyTopic">Study Topic</Label>
            <Input
              id="studyTopic"
              placeholder="e.g., Fidel Practice, Grammar, Vocabulary"
              value={studyTopic}
              onChange={(e) => setStudyTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Education Level</Label>
              <Select value={educationLevel} onValueChange={setEducationLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {roomType === 'kids' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
            >
              <p className="text-sm text-amber-600 dark:text-amber-400">
                🛡️ <strong>Kids Room:</strong> DMs are disabled, friend requests require parental approval, and stricter moderation applies.
              </p>
            </motion.div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()} className="flex-1 bg-gradient-accent">
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomModal;
