import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Shield, 
  Users, 
  Search,
  Filter,
  UserCheck,
  UserX,
  Ban,
  Mail,
  MoreVertical,
  GraduationCap,
  Briefcase,
  Baby,
  Building
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CEOUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const userStats = [
    { label: 'Total Users', value: '24,567', icon: Users, color: 'text-primary' },
    { label: 'Active Today', value: '3,842', icon: UserCheck, color: 'text-success' },
    { label: 'Suspended', value: '23', icon: Ban, color: 'text-destructive' },
    { label: 'Pending Verification', value: '156', icon: UserX, color: 'text-warning' },
  ];

  const users = [
    { id: 1, name: 'Kidus M.', email: 'kidus@example.com', role: 'student', status: 'active', joined: '2 days ago', avatar: 'KM' },
    { id: 2, name: 'Sara T.', email: 'sara@school.edu', role: 'teacher', status: 'active', joined: '1 week ago', avatar: 'ST' },
    { id: 3, name: 'Abebe W.', email: 'abebe@company.com', role: 'enterprise', status: 'active', joined: '1 month ago', avatar: 'AW' },
    { id: 4, name: 'Hana G.', email: 'hana@example.com', role: 'parent', status: 'pending', joined: '3 days ago', avatar: 'HG' },
    { id: 5, name: 'Yonas K.', email: 'yonas@example.com', role: 'student', status: 'suspended', joined: '6 months ago', avatar: 'YK' },
    { id: 6, name: 'Meron A.', email: 'meron@example.com', role: 'admin', status: 'active', joined: '1 year ago', avatar: 'MA' },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher': return <GraduationCap className="w-4 h-4" />;
      case 'enterprise': return <Building className="w-4 h-4" />;
      case 'parent': return <Baby className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      student: 'bg-blue-500/10 text-blue-500',
      teacher: 'bg-purple-500/10 text-purple-500',
      enterprise: 'bg-emerald-500/10 text-emerald-500',
      parent: 'bg-pink-500/10 text-pink-500',
      admin: 'bg-red-500/10 text-red-500',
    };
    return colors[role] || 'bg-muted text-muted-foreground';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'pending': return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'suspended': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              User Control
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and permissions across the platform
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {userStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Management */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
              <TabsTrigger value="flagged">Flagged</TabsTrigger>
            </TabsList>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Complete list of platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name}</p>
                            <Badge variant="outline" className={getRoleBadge(user.role)}>
                              {getRoleIcon(user.role)}
                              <span className="ml-1 capitalize">{user.role}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          {getStatusBadge(user.status)}
                          <p className="text-xs text-muted-foreground mt-1">Joined {user.joined}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <UserCheck className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Load More Users
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Filtered student list</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers">
            <Card>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Filtered teacher list</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enterprise">
            <Card>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Filtered enterprise list</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flagged">
            <Card>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Flagged users requiring review</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CEOUsers;
