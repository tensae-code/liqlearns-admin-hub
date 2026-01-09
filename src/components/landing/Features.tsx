import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Trophy, 
  Users, 
  Zap, 
  Target, 
  Gift,
  Video,
  Award
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Comprehensive Courses',
    description: 'Access hundreds of expertly crafted courses across multiple subjects and skill levels.',
    gradient: 'from-accent to-accent/70',
  },
  {
    icon: Trophy,
    title: 'Gamified Learning',
    description: 'Earn XP, collect badges, and maintain streaks as you progress through your learning journey.',
    gradient: 'from-gold to-gold/70',
  },
  {
    icon: Users,
    title: 'Study Rooms',
    description: 'Join virtual classrooms and collaborate with fellow students in real-time video sessions.',
    gradient: 'from-success to-success/70',
  },
  {
    icon: Zap,
    title: 'Learn Anywhere',
    description: 'Access your courses on any device, anytime. Your progress syncs seamlessly.',
    gradient: 'from-streak to-streak/70',
  },
  {
    icon: Target,
    title: 'Progress Tracking',
    description: 'Visualize your growth with detailed analytics and the unique Life Progress Wheel.',
    gradient: 'from-primary to-primary/70',
  },
  {
    icon: Gift,
    title: 'Referral Rewards',
    description: 'Earn commissions by sharing LiqLearns with friends through our sponsor program.',
    gradient: 'from-accent to-gold',
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Why LiqLearns?
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Everything You Need to{' '}
            <span className="text-gradient-accent">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Our platform combines the best of gamification, expert instruction, 
            and community to create an unparalleled learning experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-elevated transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Highlight Banner */}
        <motion.div
          className="mt-16 p-8 md:p-12 rounded-3xl bg-gradient-hero text-primary-foreground relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gold/20 flex items-center justify-center">
                <Award className="w-10 h-10 text-gold" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-2">
                  3-Day Free Trial
                </h3>
                <p className="text-primary-foreground/80">
                  Experience full access to all courses with no commitment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <Video className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-sm text-primary-foreground/70">HD Video</p>
              </div>
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-gold" />
                <p className="text-sm text-primary-foreground/70">Certificates</p>
              </div>
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-success" />
                <p className="text-sm text-primary-foreground/70">Community</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
