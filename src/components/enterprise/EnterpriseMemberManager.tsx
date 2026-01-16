import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  UserPlus, 
  Users, 
  Building2, 
  MoreVertical,
  Mail,
  Download,
  Upload,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface EnterpriseMemberManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Member {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  progress: number;
  joinedAt: string;
}

const mockMembers: Member[] = [
  { id: '1', name: 'Alemayehu Mekuria', email: 'alemayehu@phoenix.edu', department: 'Engineering', role: 'Member', status: 'active', progress: 78, joinedAt: '2024-01-15' },
  { id: '2', name: 'Sara Tesfaye', email: 'sara@phoenix.edu', department: 'Marketing', role: 'Department Lead', status: 'active', progress: 45, joinedAt: '2024-01-20' },
  { id: '3', name: 'Dawit Bekele', email: 'dawit@phoenix.edu', department: 'Sales', role: 'Member', status: 'active', progress: 92, joinedAt: '2024-02-01' },
  { id: '4', name: 'Tigist Kebede', email: 'tigist@phoenix.edu', department: 'HR', role: 'Admin', status: 'active', progress: 34, joinedAt: '2024-02-10' },
  { id: '5', name: 'Yonas Haile', email: 'yonas@phoenix.edu', department: 'Engineering', role: 'Member', status: 'pending', progress: 0, joinedAt: '2024-03-01' },
  { id: '6', name: 'Meron Asfaw', email: 'meron@phoenix.edu', department: 'Finance', role: 'Member', status: 'inactive', progress: 15, joinedAt: '2024-01-25' },
];

const departments = ['All', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];

const EnterpriseMemberManager = ({ open, onOpenChange }: EnterpriseMemberManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [inviteEmails, setInviteEmails] = useState('');

  const filteredMembers = mockMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleBulkInvite = () => {
    const emails = inviteEmails.split(/[,\n]/).map(e => e.trim()).filter(e => e);
    if (emails.length > 0) {
      toast.success(`Invitations sent to ${emails.length} members!`);
      setInviteEmails('');
    }
  };

  const handleExportMembers = () => {
    toast.success('Member list exported as CSV');
  };

  const getStatusIcon = (status: Member['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gold" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Member['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/30">Active</Badge>;
      case 'pending':
        return <Badge className="bg-gold/10 text-gold border-gold/30">Pending</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-5 h-5 text-accent" />
            Member Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invite">Invite</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      {selectedDepartment}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {departments.map(dept => (
                      <DropdownMenuItem key={dept} onClick={() => setSelectedDepartment(dept)}>
                        {dept}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={handleExportMembers}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{member.name}</p>
                          {getStatusIcon(member.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-sm text-foreground">{member.department}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="hidden md:block">
                        {getStatusBadge(member.status)}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-accent">{member.progress}%</p>
                        <p className="text-xs text-muted-foreground">Progress</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Role</DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="w-5 h-5 text-accent" />
                <h3 className="font-medium">Bulk Email Invite</h3>
              </div>
              <textarea
                placeholder="Enter email addresses separated by commas or new lines..."
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                className="w-full h-32 p-3 rounded-lg border border-border bg-background text-foreground resize-none focus:ring-2 focus:ring-accent focus:outline-none"
              />
              <div className="flex gap-3">
                <Button onClick={handleBulkInvite} className="bg-accent hover:bg-accent/90">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invitations
                </Button>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Invite Link</h4>
              <div className="flex gap-2">
                <Input
                  value="https://liqlearns.com/join/GUILD-PHOENIX-2026"
                  readOnly
                  className="bg-background"
                />
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText('https://liqlearns.com/join/GUILD-PHOENIX-2026');
                  toast.success('Link copied!');
                }}>
                  Copy
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="grid gap-3">
              {['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'].map((dept, i) => (
                <div
                  key={dept}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{dept}</p>
                      <p className="text-xs text-muted-foreground">
                        {mockMembers.filter(m => m.department === dept).length} members
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full">
              <Building2 className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnterpriseMemberManager;
