import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Home, MessageSquare, Send, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSent, setTicketSent] = useState(false);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSubmitTicket = () => {
    if (!ticketMessage.trim()) {
      toast.error("Please describe the issue before submitting");
      return;
    }

    // Simulate sending ticket
    console.log("Ticket submitted:", {
      user: user?.email || "Anonymous",
      path: location.pathname,
      message: ticketMessage,
      timestamp: new Date().toISOString()
    });

    setTicketSent(true);
    toast.success("Support ticket submitted! We'll look into this.");
    
    setTimeout(() => {
      setShowTicketForm(false);
      setTicketSent(false);
      setTicketMessage("");
    }, 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/50 to-background p-4">
      <div className="text-center max-w-md w-full">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[120px] md:text-[150px] font-display font-bold text-gradient-hero opacity-20 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-accent rounded-full flex items-center justify-center shadow-glow animate-pulse-glow">
              <span className="text-4xl">🔍</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-6">
          The page <code className="bg-muted px-2 py-1 rounded text-sm text-foreground">{location.pathname}</code> doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="gap-2 bg-gradient-hero"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Button>
        </div>

        {/* Report Issue Section */}
        <div className="border-t border-border pt-6">
          {!showTicketForm ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowTicketForm(true)}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Report this issue to support
            </Button>
          ) : ticketSent ? (
            <div className="flex items-center justify-center gap-2 text-success">
              <CheckCircle className="w-5 h-5" />
              <span>Ticket submitted successfully!</span>
            </div>
          ) : (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <p className="text-sm text-muted-foreground">
                Let our support team know about this broken link
              </p>
              <Textarea
                placeholder="Describe what you were trying to access..."
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTicketForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSubmitTicket}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Ticket
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;