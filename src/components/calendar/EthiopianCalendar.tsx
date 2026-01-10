import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Star,
  Users,
  Clock
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Ethiopian months with Amharic names
const ethiopianMonths = [
  { name: 'Meskerem', amharic: 'መስከረም', days: 30, season: 'spring' },
  { name: 'Tikimt', amharic: 'ጥቅምት', days: 30, season: 'spring' },
  { name: 'Hidar', amharic: 'ኅዳር', days: 30, season: 'autumn' },
  { name: 'Tahsas', amharic: 'ታኅሣሥ', days: 30, season: 'autumn' },
  { name: 'Tir', amharic: 'ጥር', days: 30, season: 'winter' },
  { name: 'Yekatit', amharic: 'የካቲት', days: 30, season: 'winter' },
  { name: 'Megabit', amharic: 'መጋቢት', days: 30, season: 'winter' },
  { name: 'Miyazya', amharic: 'ሚያዝያ', days: 30, season: 'spring' },
  { name: 'Ginbot', amharic: 'ግንቦት', days: 30, season: 'spring' },
  { name: 'Sene', amharic: 'ሰኔ', days: 30, season: 'summer' },
  { name: 'Hamle', amharic: 'ሐምሌ', days: 30, season: 'summer' },
  { name: 'Nehase', amharic: 'ነሐሴ', days: 30, season: 'summer' },
  { name: 'Pagume', amharic: 'ጳጉሜ', days: 5, season: 'transition' }, // 6 in leap year
];

// Amharic day names
const ethiopianDays = [
  { short: 'እሁድ', english: 'Sun' },
  { short: 'ሰኞ', english: 'Mon' },
  { short: 'ማክሰ', english: 'Tue' },
  { short: 'ረቡዕ', english: 'Wed' },
  { short: 'ሐሙስ', english: 'Thu' },
  { short: 'ዓርብ', english: 'Fri' },
  { short: 'ቅዳሜ', english: 'Sat' },
];

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  day: number;
  month: number; // 0-12 (0 = Meskerem)
  year: number;
  type: 'cultural' | 'workshop' | 'webinar' | 'kids' | 'holiday';
  xpBonus?: number;
  attendees?: number;
  time?: string;
}

interface EthiopianCalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (day: number, month: number, year: number) => void;
  onEventClick?: (event: CalendarEvent) => void;
  showAmharic?: boolean;
}

const EthiopianCalendar = ({
  events = [],
  onDateClick,
  onEventClick,
  showAmharic = true,
}: EthiopianCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(1); // Tikimt (0-indexed)
  const [currentYear, setCurrentYear] = useState(2017);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const monthData = ethiopianMonths[currentMonth];
  const daysInMonth = currentMonth === 12 
    ? (currentYear % 4 === 3 ? 6 : 5) // Pagume has 6 days in leap year
    : 30;

  // Calculate the starting day of the month (simplified)
  const getStartDay = () => {
    // This is a simplified calculation - in production, you'd use proper Ethiopian calendar algorithms
    const totalDays = currentYear * 365 + Math.floor(currentYear / 4);
    for (let i = 0; i < currentMonth; i++) {
      if (i === 12) continue;
      totalDays + 30;
    }
    return totalDays % 7;
  };

  const startDay = getStartDay();

  const getEventsForDay = (day: number) => {
    return events.filter(
      e => e.day === day && e.month === currentMonth && e.year === currentYear
    );
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    onDateClick?.(day, currentMonth, currentYear);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'cultural': return 'bg-gold/20 border-gold text-gold';
      case 'workshop': return 'bg-accent/20 border-accent text-accent';
      case 'webinar': return 'bg-primary/20 border-primary text-primary';
      case 'kids': return 'bg-success/20 border-success text-success';
      case 'holiday': return 'bg-destructive/20 border-destructive text-destructive';
      default: return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getSeasonEmoji = (season: string) => {
    switch (season) {
      case 'spring': return '🌸';
      case 'summer': return '☀️';
      case 'autumn': return '🍂';
      case 'winter': return '❄️';
      case 'transition': return '✨';
      default: return '📅';
    }
  };

  const years = Array.from({ length: 20 }, (_, i) => 2010 + i);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-hero p-4 text-primary-foreground">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            {/* Month Picker */}
            <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-xl font-display font-bold text-primary-foreground hover:bg-white/20 gap-1"
                >
                  {showAmharic ? monthData.amharic : monthData.name}
                  <span className="text-sm opacity-70">
                    {showAmharic ? `(${monthData.name})` : monthData.amharic}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 pointer-events-auto" align="center">
                <div className="grid grid-cols-2 gap-1">
                  {ethiopianMonths.map((month, index) => (
                    <Button
                      key={month.name}
                      variant={currentMonth === index ? 'default' : 'ghost'}
                      size="sm"
                      className="justify-start text-left"
                      onClick={() => {
                        setCurrentMonth(index);
                        setMonthPickerOpen(false);
                        setSelectedDay(null);
                      }}
                    >
                      <span className="mr-1">{getSeasonEmoji(month.season)}</span>
                      <span className="truncate">{month.amharic}</span>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Year Picker */}
            <Popover open={yearPickerOpen} onOpenChange={setYearPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-xl font-display font-bold text-primary-foreground hover:bg-white/20 gap-1"
                >
                  {currentYear}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 pointer-events-auto" align="center">
                <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                  {years.map((year) => (
                    <Button
                      key={year}
                      variant={currentYear === year ? 'default' : 'ghost'}
                      size="sm"
                      className="text-sm"
                      onClick={() => {
                        setCurrentYear(year);
                        setYearPickerOpen(false);
                        setSelectedDay(null);
                      }}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-primary-foreground/70">
          <span>{getSeasonEmoji(monthData.season)}</span>
          <span className="capitalize">{monthData.season} Season</span>
          <span>•</span>
          <span>{daysInMonth} days</span>
        </div>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 border-b border-border">
        {ethiopianDays.map((day, i) => (
          <div
            key={i}
            className="py-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0"
          >
            <span className="block">{showAmharic ? day.short : day.english}</span>
            {showAmharic && (
              <span className="block text-xs opacity-60">{day.english}</span>
            )}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells for days before the month starts */}
        {Array.from({ length: startDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-24 border-r border-b border-border bg-muted/20" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isSelected = selectedDay === day;
          const hasEvents = dayEvents.length > 0;

          return (
            <motion.div
              key={day}
              className={cn(
                "h-24 p-1 border-r border-b border-border cursor-pointer transition-colors relative",
                isSelected && "bg-accent/10 ring-2 ring-accent ring-inset",
                hasEvents && !isSelected && "bg-primary/5",
                "hover:bg-muted/50"
              )}
              onClick={() => handleDayClick(day)}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
                isSelected && "bg-accent text-accent-foreground",
                hasEvents && !isSelected && "bg-primary/20 text-primary"
              )}>
                {day}
              </div>

              {/* Event indicators */}
              <div className="mt-1 space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs px-1 py-0.5 rounded truncate border",
                      getEventTypeColor(event.type)
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Fill remaining cells */}
        {Array.from({ length: (7 - ((startDay + daysInMonth) % 7)) % 7 }, (_, i) => (
          <div key={`fill-${i}`} className="h-24 border-r border-b border-border bg-muted/20" />
        ))}
      </div>

      {/* Selected Day Events Panel */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-4 bg-muted/30">
              <h4 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-accent" />
                {monthData.amharic} {selectedDay}, {currentYear}
              </h4>

              {getEventsForDay(selectedDay).length > 0 ? (
                <div className="space-y-2">
                  {getEventsForDay(selectedDay).map((event) => (
                    <motion.div
                      key={event.id}
                      className="p-3 rounded-lg bg-card border border-border hover:border-accent/50 cursor-pointer transition-all"
                      onClick={() => onEventClick?.(event)}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge className={cn("mb-1", getEventTypeColor(event.type))}>
                            {event.type}
                          </Badge>
                          <h5 className="font-medium text-foreground">{event.title}</h5>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {event.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.time}
                              </span>
                            )}
                            {event.attendees && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {event.attendees}
                              </span>
                            )}
                          </div>
                        </div>
                        {event.xpBonus && (
                          <Badge variant="secondary" className="shrink-0">
                            <Star className="w-3 h-3 mr-1 text-gold" />
                            +{event.xpBonus} XP
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events on this day</p>
                  <Button variant="link" size="sm" className="mt-1 text-accent">
                    + Add Event
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="p-3 border-t border-border bg-muted/20">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gold/50 border border-gold" />
            <span className="text-muted-foreground">Cultural</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-accent/50 border border-accent" />
            <span className="text-muted-foreground">Workshop</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary/50 border border-primary" />
            <span className="text-muted-foreground">Webinar</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-success/50 border border-success" />
            <span className="text-muted-foreground">Kids</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-destructive/50 border border-destructive" />
            <span className="text-muted-foreground">Holiday</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EthiopianCalendar;