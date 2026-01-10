import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  BookOpen,
  FileText,
  Bookmark,
  Quote,
  Layers,
  Plus,
  Search,
  Star,
  Trash2,
  Edit2,
  Volume2,
  X,
  Sparkles,
  TrendingUp,
  Heart,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrainBank, BrainBankItemType, BrainBankItem, CreateBrainBankItem } from '@/hooks/useBrainBank';

interface BrainBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeConfig = {
  vocabulary: { icon: BookOpen, label: 'Vocabulary', color: 'text-accent', bg: 'bg-accent/10' },
  note: { icon: FileText, label: 'Notes', color: 'text-gold', bg: 'bg-gold/10' },
  flashcard: { icon: Layers, label: 'Flashcards', color: 'text-success', bg: 'bg-success/10' },
  bookmark: { icon: Bookmark, label: 'Bookmarks', color: 'text-primary', bg: 'bg-primary/10' },
  quote: { icon: Quote, label: 'Quotes', color: 'text-streak', bg: 'bg-streak/10' },
};

const BrainBankModal = ({ open, onOpenChange }: BrainBankModalProps) => {
  const { items, loading, stats, addItem, deleteItem, toggleFavorite, incrementMastery } = useBrainBank();
  const [activeTab, setActiveTab] = useState<BrainBankItemType | 'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<CreateBrainBankItem>({
    type: 'vocabulary',
    title: '',
    content: '',
    translation: '',
    pronunciation: '',
    category: 'general',
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'favorites') return matchesSearch && item.is_favorite;
    return matchesSearch && item.type === activeTab;
  });

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;
    
    await addItem(newItem);
    setNewItem({
      type: 'vocabulary',
      title: '',
      content: '',
      translation: '',
      pronunciation: '',
      category: 'general',
    });
    setShowAddForm(false);
  };

  const getMasteryColor = (level: number) => {
    if (level >= 4) return 'text-success';
    if (level >= 2) return 'text-gold';
    return 'text-muted-foreground';
  };

  const getMasteryLabel = (level: number) => {
    const labels = ['New', 'Learning', 'Familiar', 'Good', 'Great', 'Mastered'];
    return labels[level] || 'New';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-gradient-hero text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold text-primary-foreground">
                  Brain Bank 🧠
                </DialogTitle>
                <p className="text-sm text-primary-foreground/70">
                  {stats.total} items collected • {stats.mastered} mastered
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-white/20 hover:bg-white/30 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {Object.entries(typeConfig).map(([type, config]) => {
              const Icon = config.icon;
              const count = stats[type as keyof typeof stats] || 0;
              return (
                <div
                  key={type}
                  className="p-2 rounded-lg bg-white/10 text-center cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => setActiveTab(type as BrainBankItemType)}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1 opacity-80" />
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs opacity-70">{config.label}</p>
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search your brain bank..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all" className="gap-1">
                <Sparkles className="w-3 h-3" /> All
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1">
                <Heart className="w-3 h-3" /> Favorites
              </TabsTrigger>
              {Object.entries(typeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <TabsTrigger key={type} value={type} className="gap-1">
                    <Icon className="w-3 h-3" /> {config.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 rounded-xl border-2 border-dashed border-accent/50 bg-accent/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground">Add New Item</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  {/* Type Selection */}
                  <div className="flex gap-2">
                    {Object.entries(typeConfig).map(([type, config]) => {
                      const Icon = config.icon;
                      const isSelected = newItem.type === type;
                      return (
                        <button
                          key={type}
                          onClick={() => setNewItem({ ...newItem, type: type as BrainBankItemType })}
                          className={cn(
                            'flex-1 p-2 rounded-lg border transition-all flex flex-col items-center gap-1',
                            isSelected
                              ? 'border-accent bg-accent/10'
                              : 'border-border hover:border-accent/50'
                          )}
                        >
                          <Icon className={cn('w-4 h-4', isSelected ? config.color : 'text-muted-foreground')} />
                          <span className="text-xs">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <Input
                    placeholder="Title / Word"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  />

                  {newItem.type === 'vocabulary' && (
                    <>
                      <Input
                        placeholder="Translation"
                        value={newItem.translation || ''}
                        onChange={(e) => setNewItem({ ...newItem, translation: e.target.value })}
                      />
                      <Input
                        placeholder="Pronunciation"
                        value={newItem.pronunciation || ''}
                        onChange={(e) => setNewItem({ ...newItem, pronunciation: e.target.value })}
                      />
                    </>
                  )}

                  <Textarea
                    placeholder={newItem.type === 'note' ? 'Write your note...' : 'Additional content or example...'}
                    value={newItem.content || ''}
                    onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                    rows={3}
                  />

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddItem} disabled={!newItem.title.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Brain Bank
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Items Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {searchQuery ? 'No items found' : 'Your Brain Bank is empty'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Start collecting vocabulary, notes, and more!'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item, index) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group p-4 rounded-xl border border-border bg-card hover:border-accent/30 hover:shadow-soft transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          {item.is_favorite && (
                            <Heart className="w-4 h-4 text-streak fill-streak" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>

                        {item.translation && (
                          <p className="text-sm text-accent mb-1">{item.translation}</p>
                        )}

                        {item.pronunciation && (
                          <p className="text-xs text-muted-foreground italic mb-1 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" />
                            {item.pronunciation}
                          </p>
                        )}

                        {item.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                        )}

                        {/* Mastery */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  i < item.mastery_level ? 'bg-success' : 'bg-muted'
                                )}
                              />
                            ))}
                          </div>
                          <span className={cn('text-xs', getMasteryColor(item.mastery_level))}>
                            {getMasteryLabel(item.mastery_level)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • Reviewed {item.review_count}x
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementMastery(item.id)}
                          disabled={item.mastery_level >= 5}
                        >
                          <Check className="w-4 h-4 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleFavorite(item.id)}
                        >
                          <Heart className={cn('w-4 h-4', item.is_favorite ? 'text-streak fill-streak' : 'text-muted-foreground')} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default BrainBankModal;
