import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Search, UserPlus, Loader2, Check, X } from 'lucide-react';

interface SearchResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
}

interface AddChildModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (username: string) => Promise<SearchResult[]>;
  onAddChild: (childProfileId: string, nickname?: string) => Promise<void>;
}

const AddChildModal = ({ open, onOpenChange, onSearch, onAddChild }: AddChildModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedChild, setSelectedChild] = useState<SearchResult | null>(null);
  const [nickname, setNickname] = useState('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [step, setStep] = useState<'search' | 'confirm'>('search');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a username to search');
      return;
    }

    setSearching(true);
    try {
      const results = await onSearch(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info('No users found with that username');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to search');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectChild = (child: SearchResult) => {
    setSelectedChild(child);
    setStep('confirm');
  };

  const handleAddChild = async () => {
    if (!selectedChild) return;

    setAdding(true);
    try {
      await onAddChild(selectedChild.id, nickname || undefined);
      toast.success(`${selectedChild.full_name} has been linked to your account!`);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add child');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedChild(null);
    setNickname('');
    setStep('search');
    onOpenChange(false);
  };

  const handleBack = () => {
    setSelectedChild(null);
    setNickname('');
    setStep('search');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-accent" />
            {step === 'search' ? 'Add Child Account' : 'Confirm Child'}
          </DialogTitle>
          <DialogDescription>
            {step === 'search'
              ? 'Search for your child\'s account by their username to link it to your parent account.'
              : 'Review and confirm linking this child account.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'search' ? (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter child's username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectChild(result)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      {result.avatar_url && <AvatarImage src={result.avatar_url} />}
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {result.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{result.full_name}</p>
                      <p className="text-sm text-muted-foreground">@{result.username}</p>
                    </div>
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-muted-foreground text-center">
              Your child must have an existing account. Ask them for their username.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected Child Preview */}
            {selectedChild && (
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <Avatar className="h-14 w-14">
                  {selectedChild.avatar_url && <AvatarImage src={selectedChild.avatar_url} />}
                  <AvatarFallback className="bg-accent text-accent-foreground text-lg">
                    {selectedChild.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{selectedChild.full_name}</p>
                  <p className="text-sm text-muted-foreground">@{selectedChild.username}</p>
                </div>
              </div>
            )}

            {/* Nickname Input */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname (optional)</Label>
              <Input
                id="nickname"
                placeholder="e.g., My Little Star"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Add a nickname to easily identify this child in your dashboard.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleAddChild} disabled={adding} className="flex-1">
                {adding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Link Child
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddChildModal;
