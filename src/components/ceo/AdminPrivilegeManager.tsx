import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminPrivileges, PrivilegeType } from '@/hooks/useAdminPrivileges';
import {
  Shield,
  UserX,
  Clock,
  BookOpen,
  HelpCircle,
  Users,
  BarChart3,
  FileText,
  UserCog,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const privilegeIcons: Record<PrivilegeType, React.ElementType> = {
  delete_users: UserX,
  temporary_hold_users: Clock,
  approve_courses: BookOpen,
  approve_quest_board: HelpCircle,
  manage_study_rooms: Users,
  view_analytics: BarChart3,
  manage_content: FileText,
  manage_admins: UserCog,
};

const AdminPrivilegeManager = () => {
  const {
    admins,
    loading,
    allPrivilegeTypes,
    grantPrivilege,
    revokePrivilege,
  } = useAdminPrivileges();

  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin Privileges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleTogglePrivilege = async (adminUserId: string, privilegeType: PrivilegeType, currentlyGranted: boolean) => {
    if (currentlyGranted) {
      await revokePrivilege(adminUserId, privilegeType);
    } else {
      await grantPrivilege(adminUserId, privilegeType);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Admin Privilege Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {admins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No admins found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => {
              const isExpanded = expandedAdmin === admin.user_id;
              const grantedCount = admin.privileges.filter(p => p.granted).length;

              return (
                <motion.div
                  key={admin.user_id}
                  className="border border-border rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Admin Header */}
                  <button
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedAdmin(isExpanded ? null : admin.user_id)}
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      {admin.avatar_url && <AvatarImage src={admin.avatar_url} />}
                      <AvatarFallback className="bg-gradient-accent text-accent-foreground">
                        {admin.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-foreground">{admin.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {grantedCount}/{allPrivilegeTypes.length} privileges
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Privileges Panel */}
                  {isExpanded && (
                    <motion.div
                      className="px-4 pb-4 border-t border-border"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                    >
                      <div className="grid gap-3 pt-4">
                        {allPrivilegeTypes.map((priv) => {
                          const Icon = privilegeIcons[priv.type];
                          const adminPriv = admin.privileges.find(p => p.privilege_type === priv.type);
                          const isGranted = adminPriv?.granted ?? false;

                          return (
                            <div
                              key={priv.type}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isGranted ? 'bg-success/20' : 'bg-muted'}`}>
                                  <Icon className={`w-4 h-4 ${isGranted ? 'text-success' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{priv.label}</p>
                                  <p className="text-xs text-muted-foreground">{priv.description}</p>
                                </div>
                              </div>
                              <Switch
                                checked={isGranted}
                                onCheckedChange={() => handleTogglePrivilege(admin.user_id, priv.type, isGranted)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPrivilegeManager;
