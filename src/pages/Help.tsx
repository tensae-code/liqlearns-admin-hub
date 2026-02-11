import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  BookOpen,
  Video,
  MessageCircle,
  HelpCircle,
  Mail,
  ChevronRight,
  Play,
  Send
} from 'lucide-react';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { toast } from 'sonner';

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click the "Get Started" button on the home page and follow the registration process. You can sign up with your email address or social accounts.',
      },
      {
        q: 'What subscription plans are available?',
        a: 'We offer Free (Trial), Beginner, Basic, Advanced, and Pro tiers. Each tier unlocks additional features and content. Visit the Pricing page for details.',
      },
      {
        q: 'How do I earn XP and Aura points?',
        a: 'Complete lessons, quizzes, daily missions, and participate in study rooms to earn XP. Aura points are bonus rewards for achievements and can be spent in the marketplace.',
      },
    ],
  },
  {
    id: 'learning',
    title: 'Learning & Courses',
    icon: '📚',
    questions: [
      {
        q: 'What languages are available?',
        a: 'Currently, we focus on Amharic language learning with plans to expand to other Ethiopian languages and more.',
      },
      {
        q: 'Can I download lessons for offline use?',
        a: 'Premium subscribers can download lessons, audio, and certain materials for offline learning through the mobile app.',
      },
      {
        q: 'How does the skill tracking work?',
        a: 'We track four core skills: Listening, Reading, Writing, and Speaking. Your progress in each is measured and displayed on your dashboard.',
      },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    icon: '🛒',
    questions: [
      {
        q: 'How do I purchase items in the marketplace?',
        a: 'Browse the marketplace, add items to your cart, and complete payment using your preferred method. All purchases are secure.',
      },
      {
        q: 'Can I become a seller?',
        a: 'Yes! Apply to become a seller through your account settings. Once approved, you can list courses, e-books, and other educational content.',
      },
      {
        q: 'What is the refund policy?',
        a: 'Digital products can be refunded within 7 days of purchase if you haven\'t completed more than 20% of the content.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: '⚙️',
    questions: [
      {
        q: 'The app is running slowly. What should I do?',
        a: 'Try clearing your browser cache, disabling extensions, or using a different browser. Check your internet connection as well.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Click "Forgot Password" on the login page and enter your email. You\'ll receive a reset link within a few minutes.',
      },
      {
        q: 'How do I update my profile information?',
        a: 'Go to Settings > Profile to update your name, email, avatar, and other personal information.',
      },
    ],
  },
];

const popularArticles = [
  'How to maintain your learning streak',
  'Understanding the Ethiopian calendar',
  'Tips for mastering Fidel characters',
  'Getting the most out of study rooms',
  'Referral program explained',
];

const Help = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const { submitTicket, submitting, startLiveChat } = useSupportTickets();

  const activeCategory = faqCategories.find(c => c.id === selectedCategory);

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const success = await submitTicket(
      ticketForm.subject,
      ticketForm.description,
      ticketForm.category,
      ticketForm.priority
    );

    if (success) {
      setShowTicketModal(false);
      setTicketForm({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
    }
  };

  const handleLiveChat = async () => {
    const supportUserId = await startLiveChat();
    if (supportUserId) {
      navigate(`/messages?dm=${supportUserId}`);
      toast.success('Connected to support!', {
        description: 'You can now chat with our support team.',
      });
    }
  };

  const helpResources = [
    { title: 'Video Tutorials', description: 'Watch step-by-step guides', icon: Video, action: () => toast.info('Coming soon!') },
    { title: 'User Guide', description: 'Detailed documentation', icon: BookOpen, action: () => toast.info('Coming soon!') },
    { title: 'Live Chat', description: 'Chat with support', icon: MessageCircle, action: handleLiveChat },
    { title: 'Submit Ticket', description: 'Get help via email', icon: Mail, action: () => setShowTicketModal(true) },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">How can we help you?</h1>
        <p className="text-muted-foreground mb-6">Find answers, tutorials, and support resources</p>
        
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
          />
        </div>
      </motion.div>

      {/* Quick Resources */}
      <motion.div
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {helpResources.map((resource) => (
          <button
            key={resource.title}
            onClick={resource.action}
            className="p-5 rounded-xl bg-card border border-border hover:border-accent/30 hover:shadow-lg transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
              <resource.icon className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors">
              {resource.title}
            </h3>
            <p className="text-sm text-muted-foreground">{resource.description}</p>
          </button>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* FAQ Categories */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {faqCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className={`shrink-0 ${selectedCategory === cat.id ? 'bg-gradient-accent text-accent-foreground' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.title}
              </Button>
            ))}
          </div>

          {/* FAQ List */}
          {activeCategory && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-xl font-display font-semibold text-foreground mb-4">
                {activeCategory.icon} {activeCategory.title}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {activeCategory.questions.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left hover:text-accent">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Articles */}
          <motion.div
            className="p-5 rounded-xl bg-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-accent" />
              Popular Articles
            </h3>
            <ul className="space-y-3">
              {popularArticles.map((article, i) => (
                <li key={i}>
                  <button
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors group w-full text-left"
                  >
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    {article}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Video Guide */}
          <motion.div
            className="p-5 rounded-xl bg-gradient-hero text-primary-foreground relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center mb-3">
                <Play className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-display font-semibold mb-2">Platform Tour</h3>
              <p className="text-sm text-primary-foreground/80 mb-4">
                Watch a quick video guide to get started with LiqLearns.
              </p>
              <Button size="sm" className="bg-gold text-gold-foreground hover:bg-gold/90">
                Watch Now
              </Button>
            </div>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            className="p-5 rounded-xl bg-card border border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="font-display font-semibold text-foreground mb-2">Still need help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team is available 24/7 to assist you.
            </p>
            <Button 
              className="w-full bg-gradient-accent text-accent-foreground hover:opacity-90"
              onClick={() => setShowTicketModal(true)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Submit Ticket Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Support Ticket</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={ticketForm.category} 
                  onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={ticketForm.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setTicketForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please describe your issue in detail..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTicketModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitTicket}
              disabled={submitting}
              className="bg-gradient-accent text-accent-foreground"
            >
              {submitting ? 'Submitting...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Help;
