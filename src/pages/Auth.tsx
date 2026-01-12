import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Mail, 
  Lock, 
  User, 
  Phone,
  ArrowLeft, 
  ArrowRight,
  GraduationCap,
  Briefcase,
  HeadphonesIcon,
  Shield,
  Check,
  Users
} from 'lucide-react';

type Role = 'student' | 'teacher' | 'parent' | 'support' | 'admin';

interface FormData {
  role: Role;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  sponsorUsername: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

const roles = [
  { id: 'student' as Role, label: 'Student', icon: GraduationCap, description: 'Learn and grow with courses, quests, and rewards' },
  { id: 'teacher' as Role, label: 'Teacher', icon: Briefcase, description: 'Create courses and manage your students' },
  { id: 'parent' as Role, label: 'Parent', icon: Users, description: 'Monitor your child\'s learning progress' },
  { id: 'support' as Role, label: 'Support', icon: HeadphonesIcon, description: 'Help users and manage tickets' },
];

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    role: 'student',
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    sponsorUsername: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const { signIn, signUp, user, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !redirecting) {
      setRedirecting(true);
      navigate(getDashboardPath());
    }
  }, [user, navigate, getDashboardPath, redirecting]);

  const steps = isSignUp ? ['Role', 'Details', 'Policies', 'Complete'] : ['Login'];
  
  const updateFormData = (key: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleLogin = async (e?: React.FormEvent, demoEmail?: string, demoPassword?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    const email = demoEmail || formData.email;
    const password = demoPassword || formData.password;
    
    const { error, role } = await signIn(email, password);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      setLoading(false);
    } else {
      toast({ title: 'Welcome back!' });
      setRedirecting(true);
      // Navigate based on role using getDashboardPath
      const dashboardPath = role === 'ceo' ? '/ceo'
        : role === 'admin' ? '/admin'
        : role === 'support' ? '/support'
        : role === 'teacher' ? '/teacher'
        : role === 'parent' ? '/parent'
        : '/dashboard';
      navigate(dashboardPath);
    }
  };

  // Demo mode is only enabled in development environment
  const isDemoMode = import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';
  
  // Demo accounts are only shown in demo mode - credentials are not hardcoded for production
  const demoAccounts = isDemoMode ? [
    { email: 'ceo@liqlearns.com', role: 'CEO' },
    { email: 'admin@liqlearns.com', role: 'Admin' },
    { email: 'student@liqlearns.com', role: 'Student' },
    { email: 'teacher@liqlearns.com', role: 'Teacher' },
    { email: 'support@liqlearns.com', role: 'Support' },
  ] : [];

  const handleSignUp = async () => {
    setLoading(true);
    
    const { error } = await signUp(
      formData.email, 
      formData.password, 
      formData.fullName, 
      formData.username,
      formData.role
    );
    
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      setLoading(false);
    } else {
      toast({ title: 'Account created! Welcome to LiqLearns.' });
      setRedirecting(true);
      // Navigate based on role
      const dashboardPath = formData.role === 'teacher' ? '/teacher' 
        : formData.role === 'parent' ? '/parent'
        : formData.role === 'support' ? '/support'
        : '/dashboard';
      navigate(dashboardPath);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSignUp();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return formData.role;
      case 1: return formData.fullName && formData.username && formData.email && formData.password.length >= 6;
      case 2: return formData.acceptTerms && formData.acceptPrivacy;
      default: return true;
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox />
          <span className="text-muted-foreground">Remember me</span>
        </label>
        <button type="button" className="text-accent hover:underline">
          Forgot password?
        </button>
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Demo Credentials Section - Only in development/demo mode */}
      {isDemoMode && demoAccounts.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
            🔑 Demo Accounts (Development Mode):
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Enter any email below and use the default demo password to test.
          </p>
          <div className="space-y-2">
            {demoAccounts.map((demo) => (
              <div
                key={demo.email}
                className="w-full flex items-center justify-between text-xs p-2 rounded-lg bg-accent/5"
              >
                <span className="text-muted-foreground">{demo.email}</span>
                <span className="text-accent font-medium">({demo.role})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );

  const renderRoleSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Choose your role to get started
      </p>
      <div className="grid grid-cols-2 gap-3">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => updateFormData('role', role.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              formData.role === role.id
                ? 'border-accent bg-accent/5 shadow-glow'
                : 'border-border hover:border-accent/50'
            }`}
          >
            <role.icon className={`w-8 h-8 mb-2 ${
              formData.role === role.id ? 'text-accent' : 'text-muted-foreground'
            }`} />
            <h4 className="font-semibold text-foreground">{role.label}</h4>
            <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <div className="relative mt-1">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => updateFormData('fullName', e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
          <Input
            id="username"
            type="text"
            placeholder="johndoe"
            value={formData.username}
            onChange={(e) => updateFormData('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="signupEmail">Email</Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signupEmail"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone (Optional)</Label>
        <div className="relative mt-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="+1 234 567 8900"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="signupPassword">Password</Label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signupPassword"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            className="pl-10"
            required
            minLength={6}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
      </div>

      <div>
        <Label htmlFor="sponsor">Sponsor Username (Optional)</Label>
        <div className="relative mt-1">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="sponsor"
            type="text"
            placeholder="@sponsor_username"
            value={formData.sponsorUsername}
            onChange={(e) => updateFormData('sponsorUsername', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Please review and accept our policies to continue
      </p>

      <div className="space-y-4">
        <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors cursor-pointer">
          <Checkbox
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => updateFormData('acceptTerms', !!checked)}
            className="mt-0.5"
          />
          <div>
            <p className="font-medium text-foreground">Terms of Service</p>
            <p className="text-sm text-muted-foreground">
              I accept the <a href="#" className="text-accent hover:underline">Terms of Service</a> and agree to be bound by them.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-accent/50 transition-colors cursor-pointer">
          <Checkbox
            checked={formData.acceptPrivacy}
            onCheckedChange={(checked) => updateFormData('acceptPrivacy', !!checked)}
            className="mt-0.5"
          />
          <div>
            <p className="font-medium text-foreground">Privacy Policy</p>
            <p className="text-sm text-muted-foreground">
              I have read and accept the <a href="#" className="text-accent hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </label>
      </div>

      {formData.role === 'student' && (
        <div className="p-4 rounded-xl bg-gold/10 border border-gold/30">
          <p className="text-sm text-foreground">
            🎉 <strong>3-Day Free Trial!</strong> As a student, you'll get full access to all courses for 3 days.
          </p>
        </div>
      )}
    </div>
  );

  const renderComplete = () => (
    <div className="text-center space-y-6 py-4">
      <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
        <Check className="w-10 h-10 text-success" />
      </div>
      <div>
        <h3 className="text-xl font-display font-semibold text-foreground mb-2">
          Almost there!
        </h3>
        <p className="text-muted-foreground">
          Click the button below to create your account and start learning.
        </p>
      </div>
      <div className="p-4 rounded-xl bg-muted text-left">
        <p className="text-sm"><strong>Role:</strong> {roles.find(r => r.id === formData.role)?.label}</p>
        <p className="text-sm"><strong>Name:</strong> {formData.fullName}</p>
        <p className="text-sm"><strong>Username:</strong> @{formData.username}</p>
        <p className="text-sm"><strong>Email:</strong> {formData.email}</p>
      </div>
    </div>
  );

  const renderSignupStep = () => {
    switch (currentStep) {
      case 0: return renderRoleSelection();
      case 1: return renderDetailsForm();
      case 2: return renderPolicies();
      case 3: return renderComplete();
      default: return null;
    }
  };

  // Loading/Redirecting screen
  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-accent flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-accent-foreground" />
          </div>
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <h2 className="text-xl font-display font-semibold text-primary-foreground mb-2">
            Preparing your dashboard...
          </h2>
          <p className="text-primary-foreground/70">Just a moment</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button 
          variant="glass" 
          size="sm" 
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Button>

        <div className="bg-card rounded-2xl shadow-floating p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-accent flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? `Step ${currentStep + 1} of ${steps.length}` : 'Sign in to continue learning'}
            </p>
          </div>

          {/* Progress Steps (signup only) */}
          {isSignUp && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all ${
                    index <= currentStep ? 'bg-accent w-8' : 'bg-muted w-4'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Form Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? currentStep : 'login'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {isSignUp ? renderSignupStep() : renderLoginForm()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons (signup only) */}
          {isSignUp && (
            <div className="flex gap-3 mt-6">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <Button
                type="button"
                variant="hero"
                onClick={nextStep}
                disabled={!canProceed() || loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : currentStep === steps.length - 1 ? 'Create Account' : 'Continue'}
                {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setCurrentStep(0);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
