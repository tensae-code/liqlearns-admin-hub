import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Languages
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

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">Events 📅</h1>
            <p className="text-muted-foreground">Upcoming workshops, webinars, and cultural celebrations</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Amharic Toggle */}
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <Switch
                id="amharic-mode"
                checked={showAmharic}
                onCheckedChange={setShowAmharic}
              />
              <Label htmlFor="amharic-mode" className="text-sm text-muted-foreground">
                አማርኛ
              </Label>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={calendarView === 'ethiopian' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarView('ethiopian')}
                className={calendarView === 'ethiopian' ? 'bg-gradient-accent' : ''}
              >
                🇪🇹 Ethiopian
              </Button>
              <Button
                variant={calendarView === 'gregorian' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarView('gregorian')}
                className={calendarView === 'gregorian' ? 'bg-gradient-accent' : ''}
              >
                📅 Gregorian
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                📆 Calendar
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                📋 List
              </Button>
            </div>
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
