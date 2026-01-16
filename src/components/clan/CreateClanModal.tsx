import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, Upload, Crown, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface CreateClanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClanCreated: () => void;
}

const CreateClanModal = ({
  open,
  onOpenChange,
  onClanCreated,
}: CreateClanModalProps) => {
  const { profile } = useProfile();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a clan name');
      return;
    }

    if (!profile) {
      toast.error('Please sign in to create a clan');
      return;
    }

    setIsLoading(true);
    try {
      let avatarUrl: string | null = null;

      // Upload avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `clan_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Determine owner_type based on user's teacher_type
      const ownerType = profile.teacher_type === 'enterprise' ? 'enterprise_teacher' : 'students';

      // Create the clan
      const { data: clan, error: clanError } = await supabase
        .from('clans')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          avatar_url: avatarUrl,
          owner_id: profile.id,
          owner_type: ownerType,
        })
        .select()
        .single();

      if (clanError) throw clanError;

      // Add owner as clan member
      const { error: memberError } = await supabase
        .from('clan_members')
        .insert({
          clan_id: clan.id,
          user_id: profile.id,
          role: 'leader',
        });

      if (memberError) {
        console.error('Error adding clan member:', memberError);
      }

      toast.success('Clan created!', { description: name });
      onClanCreated();
      onOpenChange(false);
      
      // Reset form
      setName('');
      setDescription('');
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      console.error('Error creating clan:', error);
      toast.error('Failed to create clan', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[150]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold" />
            Create a Clan
          </DialogTitle>
          <DialogDescription>
            Unite students or lead as an enterprise teacher. Clans can own and manage groups together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Box */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Clan Requirements:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Student clans need 3+ members to be active</li>
                  <li>Enterprise teachers can create clans individually</li>
                  <li>Clans can own multiple groups</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20 border-4 border-dashed border-muted cursor-pointer hover:border-accent transition-colors">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="bg-muted">
                <Users className="w-8 h-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <Label htmlFor="clan-avatar" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Upload className="w-4 h-4" />
                Upload clan avatar
              </div>
            </Label>
            <Input
              id="clan-avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Clan Name */}
          <div className="space-y-2">
            <Label htmlFor="clan-name">Clan Name</Label>
            <Input
              id="clan-name"
              placeholder="The Scholars"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="clan-description">Description (optional)</Label>
            <Textarea
              id="clan-description"
              placeholder="What brings your clan together?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
              maxLength={300}
            />
          </div>

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
              className="flex-1 bg-gradient-to-r from-gold to-accent text-accent-foreground"
              onClick={handleCreate}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Create Clan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClanModal;
