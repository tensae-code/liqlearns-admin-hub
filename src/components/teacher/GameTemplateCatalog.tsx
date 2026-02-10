import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Grid3X3, Brain, GripVertical, TextCursorInput, Search, 
  Pencil, Mic, Timer, CircleCheck, Plus, Gamepad2, 
  Copy, Share2, Eye, Trash2, MoreVertical, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { GAME_TYPES, type GameType } from '@/lib/gameTypes';
import { useTeacherGameTemplates, useDeleteGameTemplate, type GameTemplate } from '@/hooks/useGameTemplates';
import CreateGameModal from './CreateGameModal';
import { toast } from 'sonner';

const ICON_MAP: Record<string, React.ElementType> = {
  Grid3X3, Brain, GripVertical, TextCursorInput, Search,
  Pencil, Mic, Timer, CircleCheck,
};

interface GameTemplateCatalogProps {
  courseId?: string;
  moduleId?: string;
  onSelectGame?: (template: GameTemplate) => void;
  mode?: 'catalog' | 'picker'; // picker mode for course builder
}

const GameTemplateCatalog = ({ courseId, moduleId, onSelectGame, mode = 'catalog' }: GameTemplateCatalogProps) => {
  const { data: templates = [], isLoading } = useTeacherGameTemplates();
  const deleteTemplate = useDeleteGameTemplate();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<GameType | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<GameTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'types' | 'my_games'>('types');

  const handleCreateGame = (type: GameType) => {
    setSelectedType(type);
    setEditingTemplate(null);
    setCreateModalOpen(true);
  };

  const handleEditGame = (template: GameTemplate) => {
    setSelectedType(template.type as GameType);
    setEditingTemplate(template);
    setCreateModalOpen(true);
  };

  const handleCopyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/game/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Game Templates</h2>
            <p className="text-xs text-muted-foreground">Create interactive activities for your students</p>
          </div>
        </div>
        {mode === 'catalog' && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'types' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('types')}
            >
              Game Types
            </Button>
            <Button
              variant={viewMode === 'my_games' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('my_games')}
            >
              My Games ({templates.length})
            </Button>
          </div>
        )}
      </div>

      {/* Game Types Grid */}
      {viewMode === 'types' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAME_TYPES.map((type, i) => {
            const Icon = ICON_MAP[type.icon] || Gamepad2;
            const typeCount = templates.filter(t => t.type === type.id).length;

            return (
              <motion.div
                key={type.id}
                className="group relative bg-card border border-border rounded-xl p-4 hover:border-accent/40 hover:shadow-lg transition-all cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleCreateGame(type.id as GameType)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0',
                    type.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{type.name}</h3>
                      {typeCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {typeCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{type.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {type.subLevels.map(sl => (
                    <Badge key={sl} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                      {sl}
                    </Badge>
                  ))}
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-5 h-5 text-accent" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* My Games List */}
      {viewMode === 'my_games' && (
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No games created yet</p>
              <p className="text-sm mt-1">Switch to "Game Types" to create your first game</p>
            </div>
          ) : (
            templates.map((template, i) => {
              const gameType = GAME_TYPES.find(t => t.id === template.type);
              const Icon = gameType ? (ICON_MAP[gameType.icon] || Gamepad2) : Gamepad2;

              return (
                <motion.div
                  key={template.id}
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-accent/30 transition-all"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shrink-0',
                    gameType?.color || 'from-gray-400 to-gray-500'
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{template.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                        {gameType?.name || template.type}
                      </Badge>
                      {template.level && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                          {template.level}
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          template.is_published ? 'text-success border-success/30' : 'text-muted-foreground'
                        )}
                      >
                        {template.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditGame(template)}>
                        <Eye className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      {template.share_code && (
                        <DropdownMenuItem onClick={() => handleCopyShareLink(template.share_code!)}>
                          <Share2 className="w-4 h-4 mr-2" /> Copy Share Link
                        </DropdownMenuItem>
                      )}
                      {mode === 'picker' && onSelectGame && (
                        <DropdownMenuItem onClick={() => onSelectGame(template)}>
                          <ExternalLink className="w-4 h-4 mr-2" /> Use in Course
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => deleteTemplate.mutate(template.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Create Game Modal */}
      <CreateGameModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        gameType={selectedType}
        editingTemplate={editingTemplate}
        courseId={courseId}
        moduleId={moduleId}
      />
    </div>
  );
};

export default GameTemplateCatalog;
