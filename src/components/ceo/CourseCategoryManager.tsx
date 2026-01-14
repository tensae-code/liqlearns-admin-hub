import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Edit2, 
  Trash2, 
  BookOpen,
  Save,
  Sparkles,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { STAT_GRADIENTS } from '@/lib/theme';

interface Category {
  id: string;
  name: string;
  emoji: string;
  courseCount: number;
  teacherIds?: string[];
}

interface CourseCategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Language', emoji: '🗣️', courseCount: 45 },
  { id: '2', name: 'History', emoji: '📜', courseCount: 23 },
  { id: '3', name: 'Business', emoji: '💼', courseCount: 18 },
  { id: '4', name: 'Kids', emoji: '🧒', courseCount: 32 },
  { id: '5', name: 'Culture', emoji: '🎭', courseCount: 15 },
  { id: '6', name: 'Science', emoji: '🔬', courseCount: 28 },
  { id: '7', name: 'Arts', emoji: '🎨', courseCount: 12 },
  { id: '8', name: 'Technology', emoji: '💻', courseCount: 35 },
];

const ALLOWED_EMOJIS = [
  '📚', '🗣️', '📜', '💼', '🧒', '🎭', '🔬', '🎨', '💻', '🎵', '🏃', '🍳',
  '✈️', '🌍', '💰', '❤️', '🧠', '📐', '🔧', '🌱', '🎯', '⭐', '🏆', '🎓',
  '📖', '✏️', '🎪', '🎬', '📷', '🎸', '🎹', '🎤', '💡', '🔥', '🌟', '✨'
];

const BLOCKED_EMOJIS = ['💀', '🔫', '💊', '🍺', '🍷', '🚬', '💉', '🔪'];

const CourseCategoryManager = ({ 
  open, 
  onOpenChange 
}: CourseCategoryManagerProps) => {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📚');
  const [showNewEmojiPicker, setShowNewEmojiPicker] = useState(false);
  const [blockedEmojis, setBlockedEmojis] = useState<string[]>(BLOCKED_EMOJIS);

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditEmoji(category.emoji);
    setShowEmojiPicker(false);
  };

  const saveEdit = () => {
    if (!editName.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    setCategories(prev => prev.map(cat => 
      cat.id === editingId 
        ? { ...cat, name: editName, emoji: editEmoji }
        : cat
    ));
    
    setEditingId(null);
    toast.success('Category updated!');
  };

  const deleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category && category.courseCount > 0) {
      toast.error('Cannot delete category with courses', {
        description: 'Move or delete courses first.'
      });
      return;
    }
    
    setCategories(prev => prev.filter(cat => cat.id !== id));
    toast.success('Category deleted');
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Enter a category name');
      return;
    }
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      emoji: newCategoryEmoji,
      courseCount: 0
    };
    
    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setNewCategoryEmoji('📚');
    toast.success('Category added!');
  };

  const toggleBlockEmoji = (emoji: string) => {
    setBlockedEmojis(prev => 
      prev.includes(emoji) 
        ? prev.filter(e => e !== emoji)
        : [...prev, emoji]
    );
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STAT_GRADIENTS[3]} flex items-center justify-center`}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">Course Categories</h3>
                <p className="text-xs text-muted-foreground">{categories.length} categories • CEO controls</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Add New Category */}
            <div className="p-4 bg-muted/30 rounded-xl space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New Category
              </h4>
              <div className="flex gap-2">
                <button
                  className="w-12 h-10 rounded-lg border border-border flex items-center justify-center text-xl hover:bg-muted transition-colors"
                  onClick={() => setShowNewEmojiPicker(!showNewEmojiPicker)}
                >
                  {newCategoryEmoji}
                </button>
                <Input
                  placeholder="Category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addCategory} className="gap-2">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
              
              {showNewEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-wrap gap-2 p-3 bg-card rounded-lg border border-border"
                >
                  {ALLOWED_EMOJIS.filter(e => !blockedEmojis.includes(e)).map(emoji => (
                    <button
                      key={emoji}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-muted transition-colors",
                        newCategoryEmoji === emoji && "bg-primary/10 ring-2 ring-primary"
                      )}
                      onClick={() => {
                        setNewCategoryEmoji(emoji);
                        setShowNewEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Categories List */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Existing Categories</h4>
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    
                    {editingId === category.id ? (
                      <>
                        <button
                          className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-xl hover:bg-muted"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                          {editEmoji}
                        </button>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={saveEdit} className="gap-1">
                          <Save className="w-4 h-4" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">{category.emoji}</span>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.courseCount} courses</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => startEditing(category)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteCategory(category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Blocked Emojis */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" /> Emoji Controls
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Block emojis from being used by teachers in course icons:
              </p>
              <div className="flex flex-wrap gap-2">
                {[...ALLOWED_EMOJIS, ...BLOCKED_EMOJIS].map(emoji => (
                  <button
                    key={emoji}
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                      blockedEmojis.includes(emoji) 
                        ? "bg-destructive/10 opacity-50 line-through" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                    onClick={() => toggleBlockEmoji(emoji)}
                    title={blockedEmojis.includes(emoji) ? 'Click to allow' : 'Click to block'}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {blockedEmojis.length} emojis blocked
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border shrink-0">
            <Button className="w-full" onClick={() => {
              toast.success('Settings saved!');
              onOpenChange(false);
            }}>
              Save All Changes
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CourseCategoryManager;
