import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Hash, Megaphone, Mic, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onChannelCreated: () => void;
}

type ChannelType = 'text' | 'announcement' | 'voice';

const CreateChannelModal = ({
  open,
  onOpenChange,
  groupId,
  onChannelCreated,
}: CreateChannelModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channelType, setChannelType] = useState<ChannelType>('text');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a channel name');
      return;
    }

    setIsLoading(true);
    try {
      // Get current max order_index
      const { data: existingChannels } = await supabase
        .from('group_channels')
        .select('order_index')
        .eq('group_id', groupId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextIndex = (existingChannels?.[0]?.order_index ?? -1) + 1;

      const { error } = await supabase
        .from('group_channels')
        .insert({
          group_id: groupId,
          name: name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: description.trim() || null,
          channel_type: channelType,
          order_index: nextIndex,
          is_default: false,
        });

      if (error) throw error;

      toast.success('Channel created!', { description: `#${name.trim().toLowerCase().replace(/\s+/g, '-')}` });
      onChannelCreated();
      onOpenChange(false);
      setName('');
      setDescription('');
      setChannelType('text');
    } catch (error: any) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const channelTypes = [
    {
      value: 'text' as ChannelType,
      label: 'Text',
      description: 'Regular text channel for discussions',
      icon: Hash,
    },
    {
      value: 'announcement' as ChannelType,
      label: 'Announcement',
      description: 'Only admins can post, members can view',
      icon: Megaphone,
    },
    {
      value: 'voice' as ChannelType,
      label: 'Voice',
      description: 'Voice channel for audio conversations',
      icon: Mic,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Channel Type Selection */}
          <div className="space-y-3">
            <Label>Channel Type</Label>
            <RadioGroup
              value={channelType}
              onValueChange={(v) => setChannelType(v as ChannelType)}
              className="space-y-2"
            >
              {channelTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    channelType === type.value
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={type.value} className="sr-only" />
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      type.value === 'announcement'
                        ? 'bg-gold/20 text-gold'
                        : type.value === 'voice'
                        ? 'bg-success/20 text-success'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <type.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="channel-name"
                placeholder="general-discussion"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
                maxLength={50}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Names will be lowercase with dashes instead of spaces
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="channel-description">Description (optional)</Label>
            <Textarea
              id="channel-description"
              placeholder="What's this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Info for announcement channels */}
          {channelType === 'announcement' && (
            <div className="p-3 rounded-lg bg-gold/10 border border-gold/20">
              <p className="text-sm text-gold">
                <Megaphone className="w-4 h-4 inline mr-2" />
                Only admins and the owner can send messages in announcement channels
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-accent text-accent-foreground"
              onClick={handleCreate}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create Channel'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelModal;
