import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Sparkles, 
  Settings, 
  Activity, 
  TrendingUp, 
  MessageSquare,
  Brain,
  Zap,
  Shield,
  BarChart3,
  Clock,
  Users
} from 'lucide-react';

const CEOAIManagement = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-7 h-7 text-primary" />
              AI Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure and monitor AI features across the platform
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <Activity className="w-3 h-3 mr-1" />
              All Systems Operational
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12,456</p>
                  <p className="text-xs text-muted-foreground">AI Conversations Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">94.2%</p>
                  <p className="text-xs text-muted-foreground">Response Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1.2s</p>
                  <p className="text-xs text-muted-foreground">Avg Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Users className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3,842</p>
                  <p className="text-xs text-muted-foreground">Active AI Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="models">
              <Brain className="w-4 h-4 mr-2" />
              Models
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="safety">
              <Shield className="w-4 h-4 mr-2" />
              Safety
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI Coach Settings
                  </CardTitle>
                  <CardDescription>
                    Configure the AI learning assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-coach-enabled">Enable AI Coach</Label>
                    <Switch id="ai-coach-enabled" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="proactive-tips">Proactive Study Tips</Label>
                    <Switch id="proactive-tips" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quiz-hints">Allow Quiz Hints</Label>
                    <Switch id="quiz-hints" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="daily-limit">Daily Message Limit per User</Label>
                    <Input id="daily-limit" type="number" defaultValue={50} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    AI-powered administrative features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-moderation">Auto Content Moderation</Label>
                    <Switch id="auto-moderation" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-translation">Auto Translation</Label>
                    <Switch id="auto-translation" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="smart-notifications">Smart Notifications</Label>
                    <Switch id="smart-notifications" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Prompt Configuration</CardTitle>
                <CardDescription>
                  Customize the AI assistant's behavior and personality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Enter custom system prompt..."
                  className="min-h-[120px]"
                  defaultValue="You are Liq, a friendly and encouraging learning assistant for Liqlearns. Help students understand concepts, stay motivated, and achieve their learning goals."
                />
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle>AI Models</CardTitle>
                <CardDescription>Manage active AI models and their configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Gemini 2.5 Flash', 'GPT-5 Mini', 'Gemini 2.5 Pro'].map((model, i) => (
                    <div key={model} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{model}</p>
                          <p className="text-xs text-muted-foreground">
                            {i === 0 ? 'Primary - Learning Assistant' : i === 1 ? 'Backup - General Tasks' : 'Advanced - Complex Reasoning'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={i === 0 ? 'default' : 'outline'}>
                        {i === 0 ? 'Active' : 'Standby'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>AI Usage Analytics</CardTitle>
                <CardDescription>Monitor AI performance and usage patterns</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety">
            <Card>
              <CardHeader>
                <CardTitle>Safety & Moderation</CardTitle>
                <CardDescription>Configure content filters and safety measures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Block inappropriate content</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Flag suspicious conversations</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Child-safe mode for underage users</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Require human review for flagged content</Label>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CEOAIManagement;
