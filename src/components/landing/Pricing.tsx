import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '3 days',
    description: 'Perfect to explore the platform',
    features: [
      'Access to all courses',
      'Progress tracking',
      'Community access',
      'Basic badges',
    ],
    popular: false,
    variant: 'outline' as const,
  },
  {
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    description: 'Most flexible option',
    features: [
      'Everything in Free Trial',
      'Unlimited course access',
      'Certificate downloads',
      'Study room access',
      'Priority support',
      'XP multipliers',
    ],
    popular: true,
    variant: 'hero' as const,
  },
  {
    name: 'Yearly',
    price: '$99.99',
    period: '/year',
    description: 'Best value - Save 17%',
    features: [
      'Everything in Monthly',
      'Exclusive badges',
      'Early course access',
      'Referral bonuses',
      '1-on-1 mentoring sessions',
      'Marketplace discounts',
    ],
    popular: false,
    variant: 'gold' as const,
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            <Crown className="w-4 h-4" />
            Simple Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Choose Your{' '}
            <span className="text-gradient-gold">Learning Path</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with a free trial, then choose the plan that fits your goals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative p-6 md:p-8 rounded-2xl bg-card border-2 ${
                plan.popular 
                  ? 'border-accent shadow-glow scale-105 z-10' 
                  : 'border-border hover:border-accent/30'
              } transition-all duration-300`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-accent text-accent-foreground text-sm font-semibold">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-display font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.variant}
                size="lg"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
