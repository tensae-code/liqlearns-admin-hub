// Game template type definitions and metadata

export const GAME_TYPES = [
  {
    id: 'bingo',
    name: 'Bingo',
    description: 'Match items on a card as they are called out. Supports letters, words, pictures, and audio.',
    icon: 'Grid3X3',
    color: 'from-blue-500 to-cyan-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['reading', 'speaking', 'hearing'],
    configFields: ['gridSize', 'items', 'callType'],
  },
  {
    id: 'memory',
    name: 'Memory Match',
    description: 'Flip cards to find matching pairs of letters, words, sounds, or images.',
    icon: 'Brain',
    color: 'from-purple-500 to-pink-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['reading', 'hearing'],
    configFields: ['pairs', 'matchType'],
  },
  {
    id: 'drag_drop',
    name: 'Drag & Drop',
    description: 'Drag items into correct positions. Supports ordering, sorting, matching, and sequencing.',
    icon: 'GripVertical',
    color: 'from-emerald-500 to-teal-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['reading', 'writing', 'hearing'],
    configFields: ['items', 'targets', 'mode'],
  },
  {
    id: 'fill_blanks',
    name: 'Fill in the Blanks',
    description: 'Complete text by filling in missing letters, words, or punctuation.',
    icon: 'TextCursorInput',
    color: 'from-orange-500 to-amber-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['reading', 'writing'],
    configFields: ['text', 'blanks'],
  },
  {
    id: 'word_search',
    name: 'Word Search / Puzzle',
    description: 'Find hidden words, letters, or sentences in a grid or scattered layout.',
    icon: 'Search',
    color: 'from-rose-500 to-red-400',
    levels: ['beginner', 'basics', 'advanced'],
    subLevels: ['reading'],
    configFields: ['words', 'gridSize'],
  },
  {
    id: 'tracing',
    name: 'Tracing Board',
    description: 'Trace letters or words on a digital canvas with optional background images.',
    icon: 'Pencil',
    color: 'from-indigo-500 to-violet-400',
    levels: ['beginner', 'basics'],
    subLevels: ['writing'],
    configFields: ['tracingItems', 'backgroundImage'],
  },
  {
    id: 'recording',
    name: 'Recording / Speaking',
    description: 'Record audio or video responses for pronunciation, storytelling, and speaking tasks.',
    icon: 'Mic',
    color: 'from-pink-500 to-fuchsia-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['speaking'],
    configFields: ['prompt', 'recordingType', 'maxDuration'],
  },
  {
    id: 'timer_challenge',
    name: 'Timer Challenge',
    description: 'Complete tasks before time runs out. Timed writing, rapid responses, and speed quizzes.',
    icon: 'Timer',
    color: 'from-yellow-500 to-orange-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['reading', 'writing', 'speaking'],
    configFields: ['timeLimit', 'taskType', 'items'],
  },
  {
    id: 'quiz',
    name: 'Quiz / Multiple Choice',
    description: 'Choose correct answers from options. Supports text, image, and audio-based questions.',
    icon: 'CircleCheck',
    color: 'from-cyan-500 to-blue-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['reading', 'hearing'],
    configFields: ['questions'],
  },
  {
    id: 'hangman',
    name: 'Hangman',
    description: 'Guess the word letter by letter before the figure is complete.',
    icon: 'Hash',
    color: 'from-slate-500 to-zinc-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['reading'],
    configFields: ['hangmanWords'],
  },
  {
    id: 'sentence_builder',
    name: 'Sentence Builder',
    description: 'Arrange scrambled words to form correct sentences.',
    icon: 'ListOrdered',
    color: 'from-sky-500 to-blue-400',
    levels: ['beginner', 'basics', 'advanced', 'pro'],
    subLevels: ['reading', 'writing'],
    configFields: ['sentenceItems'],
  },
  {
    id: 'odd_one_out',
    name: 'Odd One Out',
    description: 'Pick the item that doesn\'t belong in the group.',
    icon: 'CircleDot',
    color: 'from-amber-500 to-yellow-400',
    levels: ['beginner', 'basics', 'advanced'],
    subLevels: ['reading'],
    configFields: ['oddOneOutRounds'],
  },
] as const;

export type GameType = typeof GAME_TYPES[number]['id'];

export interface GameConfig {
  // Bingo
  gridSize?: number; // 3x3, 4x4, 5x5
  items?: GameItem[];
  callType?: 'text' | 'audio' | 'image';
  
  // Memory
  pairs?: { a: string; b: string; type?: 'text' | 'image' | 'audio' }[];
  matchType?: 'identical' | 'translation' | 'sound_letter';
  
  // Drag & Drop
  targets?: { id: string; label: string; acceptIds: string[] }[];
  mode?: 'ordering' | 'sorting' | 'matching' | 'sentence_building';
  
  // Fill in blanks
  text?: string; // with {{blank}} placeholders
  blanks?: { id: string; answer: string; options?: string[] }[];
  
  // Word Search
  words?: string[];
  
  // Tracing
  tracingItems?: { text: string; backgroundImage?: string }[];
  backgroundImage?: string;
  
  // Recording
  prompt?: string;
  recordingType?: 'audio' | 'video';
  maxDuration?: number; // seconds
  
  // Timer
  timeLimit?: number; // seconds
  taskType?: 'writing' | 'rapid_response' | 'speed_quiz';
  
  // Quiz
  questions?: QuizQuestion[];

  // Matching
  matchPairs?: { id: string; left: string; right: string }[];

  // Sorting / Categorize
  categories?: { id: string; name: string }[];
  sortItems?: { id: string; text: string; categoryId: string }[];

  // Sequencing
  sequenceItems?: { id: string; text: string; correctOrder: number }[];

  // Flashcards
  flashcardItems?: { id: string; front: string; back: string; hint?: string }[];

  // True or False
  statements?: { id: string; text: string; isTrue: boolean; explanation?: string }[];

  // Hotspot
  hotspotImage?: string;
  hotspots?: { id: string; x: number; y: number; radius: number; label: string }[];

  // Crossword
  crosswordClues?: { id: string; clue: string; answer: string; direction: 'across' | 'down'; row: number; col: number }[];

  // Spin the Wheel
  wheelSegments?: { id: string; text: string; color?: string }[];

  // Hangman
  hangmanWords?: { word: string; hint?: string }[];

  // Sentence Builder
  sentenceItems?: { id: string; words: string[]; hint?: string }[];

  // Odd One Out
  oddOneOutRounds?: { id: string; question?: string; items: { id: string; text: string }[]; oddId: string; explanation?: string }[];
}

export interface GameItem {
  id: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  questionType?: 'text' | 'image' | 'audio';
  questionMedia?: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export const LEVELS = [
  { id: 'beginner', name: 'Level 1: Beginner', color: 'text-emerald-500' },
  { id: 'basics', name: 'Level 2: Basics', color: 'text-blue-500' },
  { id: 'advanced', name: 'Level 3: Advanced', color: 'text-purple-500' },
  { id: 'pro', name: 'Level 4: Pro', color: 'text-orange-500' },
] as const;

export const SUB_LEVELS = [
  { id: 'reading', name: 'Reading', icon: 'BookOpen' },
  { id: 'speaking', name: 'Speaking', icon: 'Mic' },
  { id: 'writing', name: 'Writing', icon: 'PenTool' },
  { id: 'hearing', name: 'Hearing', icon: 'Headphones' },
] as const;
