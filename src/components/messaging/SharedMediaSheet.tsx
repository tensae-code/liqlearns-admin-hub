import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Music,
  Play,
  Download,
  ExternalLink,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from './ConversationList';
import { Message } from './ChatWindow';

interface SharedMediaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation | null;
  messages: Message[];
}

type MediaTab = 'media' | 'files' | 'links' | 'audio';

const SharedMediaSheet = ({
  open,
  onOpenChange,
  conversation,
  messages,
}: SharedMediaSheetProps) => {
  const [activeTab, setActiveTab] = useState<MediaTab>('media');

  // Filter messages by type
  const mediaMessages = messages.filter(m => m.type === 'image');
  const fileMessages = messages.filter(m => m.type === 'file');
  const audioMessages = messages.filter(m => m.type === 'voice');
  const linkMessages = messages.filter(m => 
    m.type === 'message' && m.content.match(/https?:\/\/[^\s]+/)
  );

  const tabs: { id: MediaTab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'media', label: 'Media', count: mediaMessages.length, icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'files', label: 'Files', count: fileMessages.length, icon: <FileText className="w-4 h-4" /> },
    { id: 'links', label: 'Links', count: linkMessages.length, icon: <LinkIcon className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio', count: audioMessages.length, icon: <Music className="w-4 h-4" /> },
  ];

  // Extract links from message content
  const extractLinks = (content: string): string[] => {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return content.match(urlRegex) || [];
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!conversation) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.avatar} />
              <AvatarFallback className={
                conversation.type === 'group' 
                  ? "bg-primary/20 text-primary" 
                  : "bg-gradient-accent text-accent-foreground"
              }>
                {conversation.type === 'group' ? <Users className="w-6 h-6" /> : conversation.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-lg">{conversation.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">Shared content</p>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "flex-1 min-w-0 py-3 px-2 text-sm font-medium transition-colors flex items-center justify-center gap-1",
                activeTab === tab.id 
                  ? "text-accent border-b-2 border-accent" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="text-xs text-muted-foreground">({tab.count})</span>
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {/* Media Tab - Grid Layout */}
            {activeTab === 'media' && (
              <div className="grid grid-cols-3 gap-1">
                {mediaMessages.map((msg) => (
                  <motion.a
                    key={msg.id}
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="aspect-square rounded-md overflow-hidden bg-muted relative group"
                  >
                    <img
                      src={msg.fileUrl}
                      alt={msg.fileName || 'Image'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-white" />
                    </div>
                  </motion.a>
                ))}
                {mediaMessages.length === 0 && (
                  <div className="col-span-3 py-12 text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No media shared yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Files Tab - List Layout */}
            {activeTab === 'files' && (
              <div className="space-y-2">
                {fileMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{msg.fileName || 'File'}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(msg.fileSize)}</p>
                    </div>
                    {msg.fileUrl && (
                      <a href={msg.fileUrl} download className="shrink-0">
                        <Button variant="ghost" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </motion.div>
                ))}
                {fileMessages.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No files shared yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Links Tab - List Layout */}
            {activeTab === 'links' && (
              <div className="space-y-2">
                {linkMessages.map((msg) => {
                  const links = extractLinks(msg.content);
                  return links.map((link, i) => (
                    <motion.a
                      key={`${msg.id}-${i}`}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                        <LinkIcon className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-accent">{link}</p>
                        <p className="text-xs text-muted-foreground">
                          {new URL(link).hostname}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.a>
                  ));
                })}
                {linkMessages.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <LinkIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No links shared yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Audio Tab - List Layout */}
            {activeTab === 'audio' && (
              <div className="space-y-2">
                {audioMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                      <Play className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Voice message</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(msg.durationSeconds)} • {msg.sender.name}
                      </p>
                    </div>
                    {msg.fileUrl && (
                      <audio src={msg.fileUrl} controls className="h-8 max-w-[120px]" />
                    )}
                  </motion.div>
                ))}
                {audioMessages.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No audio shared yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default SharedMediaSheet;
