import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EthiopianCalendar from '@/components/calendar/EthiopianCalendar';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Star,
  Bell,
  ExternalLink,
  Languages,
  Plus,
  Zap,
  Gift
} from 'lucide-react';
import { toast } from 'sonner';

// Calendar events data
const calendarEvents = [
  {
    id: 1,
    title: 'Ethiopian New Year',
    description: 'Enkutatash celebration with traditional music and dance',
    day: 1,
    month: 0, // Meskerem
    year: 2018,
    type: 'holiday' as const,
    xpBonus: 100,
    attendees: 156,
    time: '10:00 AM - 2:00 PM',
  },
  {
    id: 2,
    title: 'Beginner Amharic Workshop',
    description: 'Interactive workshop covering basics of Fidel',
    day: 5,
    month: 1, // Tikimt
    year: 2017,
    type: 'workshop' as const,
    xpBonus: 50,
    attendees: 45,
    time: '3:00 PM - 5:00 PM',
  },
  {
    id: 3,
    title: 'Live Q&A Session',
    description: 'Get your questions answered by language experts',
    day: 12,
    month: 1,
    year: 2017,
    type: 'webinar' as const,
    xpBonus: 40,
    attendees: 89,
    time: '6:00 PM - 7:30 PM',
  },
  {
    id: 4,
    title: 'Coffee Ceremony & Vocabulary',
    description: 'Learn coffee ceremony vocabulary virtually',
    day: 3,
    month: 2, // Hidar
    year: 2017,
    type: 'cultural' as const,
    xpBonus: 60,
    attendees: 67,
    time: '11:00 AM - 1:00 PM',
  },
  {
    id: 5,
    title: 'Advanced Grammar Deep Dive',
    description: 'Intensive session on complex grammar structures',
    day: 10,
    month: 2,
    year: 2017,
    type: 'workshop' as const,
    xpBonus: 70,
    attendees: 32,
    time: '4:00 PM - 6:00 PM',
  },
  {
    id: 6,
    title: 'Kids Story Time',
    description: 'Fun storytelling session for young learners',
    day: 17,
    month: 2,
    year: 2017,
    type: 'kids' as const,
    xpBonus: 30,
    attendees: 78,
    time: '10:00 AM - 11:00 AM',
  },
  {
    id: 7,
    title: 'Meskel Celebration',
    description: 'Finding of the True Cross festival',
    day: 17,
    month: 0,
    year: 2017,
    type: 'holiday' as const,
    xpBonus: 80,
    attendees: 200,
    time: 'All Day',
  },
  {
    id: 8,
    title: 'Timkat Preparation',
    description: 'Learn about Epiphany traditions',
    day: 10,
    month: 4, // Tir
    year: 2017,
    type: 'cultural' as const,
    xpBonus: 55,
    attendees: 120,
    time: '2:00 PM - 4:00 PM',
  },
];

// List view events
const events = [
  {
    id: 1,
    title: 'Ethiopian New Year Celebration',
    description: 'Join us for a special cultural event celebrating Enkutatash with traditional music, dance, and language activities.',
    date: 'Meskerem 1, 2018',
    gregorianDate: 'September 11, 2025',
    time: '10:00 AM - 2:00 PM',
    type: 'cultural',
    isOnline: true,
    attendees: 156,
    xpBonus: 100,
    isFeatured: true,
  },
  {
    id: 2,
    title: 'Beginner Amharic Workshop',
    description: 'Interactive workshop for beginners covering the basics of Fidel and common phrases.',
    date: 'Tikimt 5, 2017',
    gregorianDate: 'October 15, 2024',
    time: '3:00 PM - 5:00 PM',
    type: 'workshop',
    isOnline: true,
    attendees: 45,
    xpBonus: 50,
  },
  {
    id: 3,
    title: 'Live Q&A with Language Experts',
    description: 'Get your questions answered by our team of certified Amharic instructors.',
    date: 'Tikimt 12, 2017',
    gregorianDate: 'October 22, 2024',
    time: '6:00 PM - 7:30 PM',
    type: 'webinar',
    isOnline: true,
    attendees: 89,
    xpBonus: 40,
  },
  {
    id: 4,
    title: 'Ethiopian Coffee Ceremony & Vocabulary',
    description: 'Learn coffee ceremony vocabulary while experiencing this beautiful tradition virtually.',
    date: 'Hidar 3, 2017',
    gregorianDate: 'November 12, 2024',
    time: '11:00 AM - 1:00 PM',
    type: 'cultural',
    isOnline: true,
    attendees: 67,
    xpBonus: 60,
  },
  {
    id: 5,
    title: 'Advanced Grammar Deep Dive',
    description: 'Intensive session on complex grammar structures and sentence patterns.',
    date: 'Hidar 10, 2017',
    gregorianDate: 'November 19, 2024',
    time: '4:00 PM - 6:00 PM',
    type: 'workshop',
    isOnline: true,
    attendees: 32,
    xpBonus: 70,
  },
  {
    id: 6,
    title: 'Kids Story Time',
    description: 'Fun storytelling session for young learners with interactive activities.',
    date: 'Hidar 17, 2017',
    gregorianDate: 'November 26, 2024',
    time: '10:00 AM - 11:00 AM',
    type: 'kids',
    isOnline: true,
    attendees: 78,
    xpBonus: 30,
  },
];

const eventTypes = [
  { id: 'all', label: 'All Events' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'webinar', label: 'Webinars' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'kids', label: 'Kids' },
];

const Events = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [calendarView, setCalendarView] = useState<'ethiopian' | 'gregorian'>('ethiopian');
  const [showAmharic, setShowAmharic] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'workshop',
    isPublic: false,
  });

  const filteredEvents = events.filter(e => 
    selectedType === 'all' || e.type === selectedType
  );

  const featuredEvent = events.find(e => e.isFeatured);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-accent text-accent-foreground';
      case 'webinar': return 'bg-primary text-primary-foreground';
      case 'cultural': return 'bg-gold text-gold-foreground';
      case 'kids': return 'bg-success text-success-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleEventClick = (event: typeof calendarEvents[0]) => {
    toast.info(`Event: ${event.title}`, {
      description: event.description,
    });
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (newEvent.isPublic) {
      toast.success('Event submitted for approval!', {
        description: `${newEvent.title} has been sent to admin for review.`,
      });
    } else {
      toast.success('Private event created!', {
        description: `${newEvent.title} has been scheduled.`,
      });
    }
    setShowAddEvent(false);
    setNewEvent({ title: '', description: '', date: '', time: '', type: 'workshop', isPublic: false });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">Events 📅</h1>
            <p className="text-sm text-muted-foreground">Workshops, webinars & celebrations</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Add Event Button */}
            <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-accent text-accent-foreground">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>Schedule a new event for the community</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="event-title">Event Title *</Label>
                    <Input
                      id="event-title"
                      placeholder="e.g., Beginner Workshop"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-desc">Description</Label>
                    <Textarea
                      id="event-desc"
                      placeholder="What will this event cover?"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="event-date">Date *</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-time">Time *</Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Event Type</Label>
                      <Select value={newEvent.type} onValueChange={(v) => setNewEvent(prev => ({ ...prev, type: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="webinar">Webinar</SelectItem>
                          <SelectItem value="cultural">Cultural</SelectItem>
                          <SelectItem value="kids">Kids</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        id="make-public"
                        checked={newEvent.isPublic}
                        onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, isPublic: checked }))}
                      />
                      <Label htmlFor="make-public" className="text-sm">
                        Make Public
                        <span className="block text-xs text-muted-foreground">(Requires admin approval)</span>
                      </Label>
                    </div>
                  </div>
                  <Button onClick={handleAddEvent} className="w-full bg-gradient-accent text-accent-foreground">
                    {newEvent.isPublic ? 'Submit for Approval' : 'Create Private Event'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Amharic Toggle */}
            <div className="hidden md:flex items-center gap-2">
              <Switch
                id="amharic-mode"
                checked={showAmharic}
                onCheckedChange={setShowAmharic}
              />
              <Label htmlFor="amharic-mode" className="text-xs text-muted-foreground">
                አማርኛ
              </Label>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={calendarView === 'ethiopian' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCalendarView('ethiopian')}
                className={`text-xs px-2 ${calendarView === 'ethiopian' ? 'bg-accent text-accent-foreground' : ''}`}
              >
                🇪🇹
              </Button>
              <Button
                variant={calendarView === 'gregorian' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCalendarView('gregorian')}
                className={`text-xs px-2 ${calendarView === 'gregorian' ? 'bg-accent text-accent-foreground' : ''}`}
              >
                📅
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={`text-xs px-2 ${viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                📆
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`text-xs px-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                📋
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Compact Promo Cards - Limited Time Offer & Upcoming */}
      <motion.div
        className="grid grid-cols-2 gap-3 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        {/* Limited Time Offer */}
        <div className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Limited Time!</p>
              <p className="text-[10px] text-muted-foreground">2x XP on all events</p>
            </div>
            <Badge className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 px-1.5 py-0">
              3d left
            </Badge>
          </div>
        </div>

        {/* Upcoming Event */}
        <div className="relative overflow-hidden rounded-xl p-3 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/20">
              <Gift className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">New Year Event</p>
              <p className="text-[10px] text-muted-foreground">+100 XP bonus</p>
            </div>
            <Badge className="text-[10px] bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30 px-1.5 py-0">
              Soon
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Featured Event - Compact */}
      {featuredEvent && (
        <motion.div
          className="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-gold/20 text-gold border-gold/30">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </Badge>
                <Badge variant="outline" className="text-xs">
                  +{featuredEvent.xpBonus} XP
                </Badge>
              </div>
              <h2 className="text-lg font-display font-bold text-foreground mb-1">{featuredEvent.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-1">{featuredEvent.description}</p>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">{calendarView === 'ethiopian' ? featuredEvent.date : featuredEvent.gregorianDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{featuredEvent.attendees}</span>
              </div>
              <Button size="sm" className="bg-gradient-accent text-accent-foreground">
                <Bell className="w-3 h-3 mr-1" />
                Register
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {eventTypes.map((type) => (
          <Button
            key={type.id}
            variant={selectedType === type.id ? 'default' : 'outline'}
            className={`shrink-0 ${selectedType === type.id ? 'bg-gradient-accent text-accent-foreground' : ''}`}
            onClick={() => setSelectedType(type.id)}
          >
            {type.label}
          </Button>
        ))}
      </motion.div>

      {/* Ethiopian Calendar */}
      {viewMode === 'calendar' && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <EthiopianCalendar
            events={calendarEvents}
            onEventClick={handleEventClick}
            showAmharic={showAmharic}
          />
        </motion.div>
      )}

      {/* Events List */}
      {viewMode === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">Upcoming Events</h2>
        <div className="space-y-4">
          {filteredEvents.filter(e => !e.isFeatured).map((event, i) => (
            <motion.div
              key={event.id}
              className="p-5 rounded-xl bg-card border border-border hover:border-accent/30 transition-all"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Date Box */}
                <div className="w-20 h-20 shrink-0 rounded-xl bg-gradient-accent text-accent-foreground flex flex-col items-center justify-center">
                  <span className="text-xs uppercase">
                    {calendarView === 'ethiopian' ? event.date.split(' ')[0] : event.gregorianDate.split(' ')[0]}
                  </span>
                  <span className="text-2xl font-bold">
                    {calendarView === 'ethiopian' ? event.date.split(' ')[1].replace(',', '') : event.gregorianDate.split(' ')[1].replace(',', '')}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getTypeColor(event.type)} variant="secondary">
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                    {event.isOnline && (
                      <Badge variant="outline">
                        <Video className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees} attending</span>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1 text-gold" />
                    +{event.xpBonus} XP
                  </Badge>
                  <Button className="bg-gradient-accent text-accent-foreground hover:opacity-90">
                    <Bell className="w-4 h-4 mr-2" />
                    Register
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      )}
      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">No events found</h3>
          <p className="text-muted-foreground">Check back later for upcoming events</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Events;
