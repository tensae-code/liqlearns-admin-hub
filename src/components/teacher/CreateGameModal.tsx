import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Trash2, Loader2, Save, GripVertical, Image, Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { GAME_TYPES, LEVELS, SUB_LEVELS, type GameType, type GameConfig, type GameItem, type QuizQuestion } from '@/lib/gameTypes';
import { useCreateGameTemplate, useUpdateGameTemplate, type GameTemplate } from '@/hooks/useGameTemplates';

interface CreateGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameType: GameType | null;
  editingTemplate?: GameTemplate | null;
  courseId?: string;
  moduleId?: string;
}

const CreateGameModal = ({
  open, onOpenChange, gameType, editingTemplate, courseId, moduleId,
}: CreateGameModalProps) => {
  const createTemplate = useCreateGameTemplate();
  const updateTemplate = useUpdateGameTemplate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [subLevel, setSubLevel] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [config, setConfig] = useState<GameConfig>({});

  const typeInfo = GAME_TYPES.find(t => t.id === gameType);

  useEffect(() => {
    if (editingTemplate) {
      setTitle(editingTemplate.title);
      setDescription(editingTemplate.description || '');
      setLevel(editingTemplate.level || '');
      setSubLevel(editingTemplate.sub_level || '');
      setIsPublished(editingTemplate.is_published);
      setConfig(editingTemplate.config || {});
    } else {
      setTitle('');
      setDescription('');
      setLevel('');
      setSubLevel('');
      setIsPublished(false);
      setConfig(getDefaultConfig(gameType));
    }
  }, [editingTemplate, gameType, open]);

  const getDefaultConfig = (type: GameType | null): GameConfig => {
    switch (type) {
      case 'bingo':
        return { gridSize: 3, items: [], callType: 'text' };
      case 'memory':
        return { pairs: [], matchType: 'identical' };
      case 'drag_drop':
        return { items: [], targets: [], mode: 'ordering' };
      case 'fill_blanks':
        return { text: '', blanks: [] };
      case 'word_search':
        return { words: [], gridSize: 10 };
      case 'tracing':
        return { tracingItems: [] };
      case 'recording':
        return { prompt: '', recordingType: 'audio', maxDuration: 60 };
      case 'timer_challenge':
        return { timeLimit: 60, taskType: 'rapid_response', items: [] };
      case 'quiz':
        return { questions: [] };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    if (!gameType) return;

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          title, description, level, sub_level: subLevel,
          is_published: isPublished, config,
        });
      } else {
        await createTemplate.mutateAsync({
          title, description, type: gameType, level, sub_level: subLevel,
          config, course_id: courseId, module_id: moduleId,
          is_published: isPublished,
        });
      }
      onOpenChange(false);
    } catch (err) {
      // error handled in hook
    }
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  // Items helper for bingo/timer/drag_drop
  const addItem = () => {
    const items = [...(config.items || [])];
    items.push({ id: crypto.randomUUID(), text: '' });
    setConfig({ ...config, items });
  };
  const updateItem = (idx: number, updates: Partial<GameItem>) => {
    const items = [...(config.items || [])];
    items[idx] = { ...items[idx], ...updates };
    setConfig({ ...config, items });
  };
  const removeItem = (idx: number) => {
    const items = [...(config.items || [])];
    items.splice(idx, 1);
    setConfig({ ...config, items });
  };

  // Quiz question helpers
  const addQuestion = () => {
    const questions = [...(config.questions || [])];
    questions.push({
      id: crypto.randomUUID(),
      question: '',
      options: [
        { id: crypto.randomUUID(), text: '', isCorrect: true },
        { id: crypto.randomUUID(), text: '', isCorrect: false },
      ],
    });
    setConfig({ ...config, questions });
  };
  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
    const questions = [...(config.questions || [])];
    questions[idx] = { ...questions[idx], ...updates };
    setConfig({ ...config, questions });
  };
  const removeQuestion = (idx: number) => {
    const questions = [...(config.questions || [])];
    questions.splice(idx, 1);
    setConfig({ ...config, questions });
  };

  // Pairs helper for memory
  const addPair = () => {
    const pairs = [...(config.pairs || [])];
    pairs.push({ a: '', b: '' });
    setConfig({ ...config, pairs });
  };

  // Words helper for word search
  const addWord = () => {
    const words = [...(config.words || []), ''];
    setConfig({ ...config, words });
  };

  // Blanks helper for fill-in
  const addBlank = () => {
    const blanks = [...(config.blanks || [])];
    blanks.push({ id: crypto.randomUUID(), answer: '', options: [] });
    setConfig({ ...config, blanks });
  };

  // Tracing items helper
  const addTracingItem = () => {
    const tracingItems = [...(config.tracingItems || [])];
    tracingItems.push({ text: '' });
    setConfig({ ...config, tracingItems });
  };

  // Targets helper for drag_drop
  const addTarget = () => {
    const targets = [...(config.targets || [])];
    targets.push({ id: crypto.randomUUID(), label: '', acceptIds: [] });
    setConfig({ ...config, targets });
  };

  const renderConfigEditor = () => {
    switch (gameType) {
      case 'bingo':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grid Size</Label>
                <Select value={String(config.gridSize || 3)} onValueChange={v => setConfig({ ...config, gridSize: Number(v) })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3×3</SelectItem>
                    <SelectItem value="4">4×4</SelectItem>
                    <SelectItem value="5">5×5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Call Type</Label>
                <Select value={config.callType || 'text'} onValueChange={v => setConfig({ ...config, callType: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Bingo Items ({config.items?.length || 0})</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(config.items || []).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input value={item.text || ''} onChange={e => updateItem(idx, { text: e.target.value })} placeholder={`Item ${idx + 1}`} className="text-sm" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(idx)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'memory':
        return (
          <div className="space-y-4">
            <div>
              <Label>Match Type</Label>
              <Select value={config.matchType || 'identical'} onValueChange={v => setConfig({ ...config, matchType: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="identical">Identical Pairs</SelectItem>
                  <SelectItem value="translation">Translation Pairs</SelectItem>
                  <SelectItem value="sound_letter">Sound → Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Pairs ({config.pairs?.length || 0})</Label>
                <Button variant="outline" size="sm" onClick={addPair}><Plus className="w-3 h-3 mr-1" /> Add Pair</Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(config.pairs || []).map((pair, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={pair.a} onChange={e => { const p = [...(config.pairs || [])]; p[idx] = { ...p[idx], a: e.target.value }; setConfig({ ...config, pairs: p }); }} placeholder="Side A" className="text-sm" />
                    <span className="text-muted-foreground text-xs">↔</span>
                    <Input value={pair.b} onChange={e => { const p = [...(config.pairs || [])]; p[idx] = { ...p[idx], b: e.target.value }; setConfig({ ...config, pairs: p }); }} placeholder="Side B" className="text-sm" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { const p = [...(config.pairs || [])]; p.splice(idx, 1); setConfig({ ...config, pairs: p }); }}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'drag_drop':
        return (
          <div className="space-y-4">
            <div>
              <Label>Mode</Label>
              <Select value={config.mode || 'ordering'} onValueChange={v => setConfig({ ...config, mode: v as any })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ordering">Put in Order</SelectItem>
                  <SelectItem value="sorting">Sort into Categories</SelectItem>
                  <SelectItem value="matching">Match Items</SelectItem>
                  <SelectItem value="sentence_building">Build Sentences</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Draggable Items</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {(config.items || []).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input value={item.text || ''} onChange={e => updateItem(idx, { text: e.target.value })} placeholder={`Item ${idx + 1}`} className="text-sm" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(idx)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </div>
            {(config.mode === 'sorting' || config.mode === 'matching') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Drop Targets / Categories</Label>
                  <Button variant="outline" size="sm" onClick={addTarget}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {(config.targets || []).map((target, idx) => (
                    <div key={target.id} className="flex items-center gap-2">
                      <Input value={target.label} onChange={e => { const t = [...(config.targets || [])]; t[idx] = { ...t[idx], label: e.target.value }; setConfig({ ...config, targets: t }); }} placeholder={`Category ${idx + 1}`} className="text-sm" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { const t = [...(config.targets || [])]; t.splice(idx, 1); setConfig({ ...config, targets: t }); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'fill_blanks':
        return (
          <div className="space-y-4">
            <div>
              <Label>Text (use {"{{blank}}"} for blanks)</Label>
              <Textarea
                value={config.text || ''}
                onChange={e => setConfig({ ...config, text: e.target.value })}
                placeholder="The {{blank}} jumped over the {{blank}} fence."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Blank Answers</Label>
                <Button variant="outline" size="sm" onClick={addBlank}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {(config.blanks || []).map((blank, idx) => (
                  <div key={blank.id} className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0 text-[10px]">#{idx + 1}</Badge>
                    <Input value={blank.answer} onChange={e => { const b = [...(config.blanks || [])]; b[idx] = { ...b[idx], answer: e.target.value }; setConfig({ ...config, blanks: b }); }} placeholder="Correct answer" className="text-sm" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { const b = [...(config.blanks || [])]; b.splice(idx, 1); setConfig({ ...config, blanks: b }); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'word_search':
        return (
          <div className="space-y-4">
            <div>
              <Label>Grid Size</Label>
              <Select value={String(config.gridSize || 10)} onValueChange={v => setConfig({ ...config, gridSize: Number(v) })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8×8</SelectItem>
                  <SelectItem value="10">10×10</SelectItem>
                  <SelectItem value="12">12×12</SelectItem>
                  <SelectItem value="15">15×15</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Hidden Words ({config.words?.length || 0})</Label>
                <Button variant="outline" size="sm" onClick={addWord}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(config.words || []).map((word, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={word} onChange={e => { const w = [...(config.words || [])]; w[idx] = e.target.value; setConfig({ ...config, words: w }); }} placeholder={`Word ${idx + 1}`} className="text-sm" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { const w = [...(config.words || [])]; w.splice(idx, 1); setConfig({ ...config, words: w }); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tracing':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Letters / Words to Trace</Label>
                <Button variant="outline" size="sm" onClick={addTracingItem}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(config.tracingItems || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input value={item.text} onChange={e => { const t = [...(config.tracingItems || [])]; t[idx] = { ...t[idx], text: e.target.value }; setConfig({ ...config, tracingItems: t }); }} placeholder={`Letter/Word ${idx + 1}`} className="text-sm" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { const t = [...(config.tracingItems || [])]; t.splice(idx, 1); setConfig({ ...config, tracingItems: t }); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'recording':
        return (
          <div className="space-y-4">
            <div>
              <Label>Prompt / Instructions</Label>
              <Textarea value={config.prompt || ''} onChange={e => setConfig({ ...config, prompt: e.target.value })} placeholder="Record yourself saying..." className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Recording Type</Label>
                <Select value={config.recordingType || 'audio'} onValueChange={v => setConfig({ ...config, recordingType: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio">Audio Only</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Duration (sec)</Label>
                <Input type="number" value={config.maxDuration || 60} onChange={e => setConfig({ ...config, maxDuration: Number(e.target.value) })} className="mt-1" />
              </div>
            </div>
          </div>
        );

      case 'timer_challenge':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Time Limit (seconds)</Label>
                <Input type="number" value={config.timeLimit || 60} onChange={e => setConfig({ ...config, timeLimit: Number(e.target.value) })} className="mt-1" />
              </div>
              <div>
                <Label>Task Type</Label>
                <Select value={config.taskType || 'rapid_response'} onValueChange={v => setConfig({ ...config, taskType: v as any })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="writing">Timed Writing</SelectItem>
                    <SelectItem value="rapid_response">Rapid Response</SelectItem>
                    <SelectItem value="speed_quiz">Speed Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Challenge Items</Label>
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {(config.items || []).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input value={item.text || ''} onChange={e => updateItem(idx, { text: e.target.value })} placeholder={`Prompt ${idx + 1}`} className="text-sm" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(idx)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Questions ({config.questions?.length || 0})</Label>
              <Button variant="outline" size="sm" onClick={addQuestion}><Plus className="w-3 h-3 mr-1" /> Add Question</Button>
            </div>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {(config.questions || []).map((q, qIdx) => (
                <div key={q.id} className="p-3 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Q{qIdx + 1}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeQuestion(qIdx)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                  <Input value={q.question} onChange={e => updateQuestion(qIdx, { question: e.target.value })} placeholder="Question text..." className="text-sm" />
                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          className={cn(
                            'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                            opt.isCorrect ? 'border-success bg-success/20' : 'border-border'
                          )}
                          onClick={() => {
                            const qs = [...(config.questions || [])];
                            qs[qIdx] = {
                              ...qs[qIdx],
                              options: qs[qIdx].options.map((o, i) => ({ ...o, isCorrect: i === oIdx })),
                            };
                            setConfig({ ...config, questions: qs });
                          }}
                        >
                          {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-success" />}
                        </button>
                        <Input
                          value={opt.text}
                          onChange={e => {
                            const qs = [...(config.questions || [])];
                            qs[qIdx] = {
                              ...qs[qIdx],
                              options: qs[qIdx].options.map((o, i) => i === oIdx ? { ...o, text: e.target.value } : o),
                            };
                            setConfig({ ...config, questions: qs });
                          }}
                          placeholder={`Option ${oIdx + 1}`}
                          className="text-sm"
                        />
                        {q.options.length > 2 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => {
                            const qs = [...(config.questions || [])];
                            qs[qIdx] = { ...qs[qIdx], options: qs[qIdx].options.filter((_, i) => i !== oIdx) };
                            setConfig({ ...config, questions: qs });
                          }}><Trash2 className="w-3 h-3" /></Button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 4 && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
                        const qs = [...(config.questions || [])];
                        qs[qIdx] = { ...qs[qIdx], options: [...qs[qIdx].options, { id: crypto.randomUUID(), text: '', isCorrect: false }] };
                        setConfig({ ...config, questions: qs });
                      }}><Plus className="w-3 h-3 mr-1" /> Add Option</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!gameType || !typeInfo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br', typeInfo.color)}>
              <span className="text-white text-sm font-bold">{typeInfo.name[0]}</span>
            </div>
            {editingTemplate ? 'Edit' : 'Create'} {typeInfo.name}
          </DialogTitle>
          <DialogDescription>{typeInfo.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={`e.g., ${typeInfo.name} - Basic Letters`} className="mt-1" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this activity..." className="mt-1 min-h-[60px]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sub-Level</Label>
              <Select value={subLevel} onValueChange={setSubLevel}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select sub-level" /></SelectTrigger>
                <SelectContent>
                  {SUB_LEVELS.filter(sl => typeInfo.subLevels.includes(sl.id as any)).map(sl => (
                    <SelectItem key={sl.id} value={sl.id}>{sl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type-specific config editor */}
          <div className="border border-border rounded-lg p-4 bg-muted/20">
            <h4 className="text-sm font-semibold text-foreground mb-3">Game Configuration</h4>
            {renderConfigEditor()}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-foreground">Publish</p>
              <p className="text-xs text-muted-foreground">Make visible to students</p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> {editingTemplate ? 'Update' : 'Create'} Game</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGameModal;
