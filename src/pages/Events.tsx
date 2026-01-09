import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  ChevronLeft,
  ChevronRight,
  Star,
  Bell,
  ExternalLink
} from 'lucide-react';

// Ethiopian calendar months
const ethiopianMonths = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

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
            <h1 className="text-3xl font-display font-bold text-foreground mb-1">Events</h1>
            <p className="text-muted-foreground">Upcoming workshops, webinars, and cultural celebrations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={calendarView === 'ethiopian' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCalendarView('ethiopian')}
            >
              🇪🇹 Ethiopian
            </Button>
            <Button
              variant={calendarView === 'gregorian' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCalendarView('gregorian')}
            >
              📅 Gregorian
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Featured Event */}
      {featuredEvent && (
        <motion.div
          className="mb-8 p-6 rounded-2xl bg-gradient-hero text-primary-foreground relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Badge className="bg-gold text-gold-foreground mb-3">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Featured Event
            </Badge>
            <h2 className="text-2xl lg:text-3xl font-display font-bold mb-2">{featuredEvent.title}</h2>
            <p className="text-primary-foreground/80 mb-4 max-w-2xl">{featuredEvent.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{calendarView === 'ethiopian' ? featuredEvent.date : featuredEvent.gregorianDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{featuredEvent.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{featuredEvent.attendees} attending</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Bell className="w-4 h-4 mr-2" />
                Register Now
              </Button>
              <Badge variant="secondary" className="text-lg py-2 px-4">
                +{featuredEvent.xpBonus} XP
              </Badge>
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

      {/* Mini Calendar */}
      <motion.div
        className="mb-8 p-4 rounded-xl bg-card border border-border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3 className="font-display font-semibold text-foreground">
            {calendarView === 'ethiopian' ? 'Tikimt 2017' : 'October 2024'}
          </h3>
          <Button variant="ghost" size="icon">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-xs font-medium text-muted-foreground py-2">{day}</div>
          ))}
          {Array.from({ length: 30 }, (_, i) => {
            const hasEvent = [5, 12, 15, 22].includes(i + 1);
            return (
              <div
                key={i}
                className={`py-2 text-sm rounded-lg cursor-pointer transition-all ${
                  hasEvent 
                    ? 'bg-accent text-accent-foreground font-medium' 
                    : 'hover:bg-muted'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Events List */}
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
