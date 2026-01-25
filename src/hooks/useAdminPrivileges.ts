import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type PrivilegeType = 
  | 'delete_users' 
  | 'temporary_hold_users' 
  | 'approve_courses' 
  | 'approve_quest_board'
  | 'manage_study_rooms'
  | 'view_analytics'
  | 'manage_content'
  | 'manage_admins';

export interface AdminPrivilege {
  id: string;
  admin_user_id: string;
  privilege_type: PrivilegeType;
  granted: boolean;
  granted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminWithPrivileges {
  user_id: string;
  profile_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  privileges: AdminPrivilege[];
}

const ALL_PRIVILEGES: { type: PrivilegeType; label: string; description: string }[] = [
  { type: 'delete_users', label: 'Delete Users', description: 'Permanently delete user accounts' },
  { type: 'temporary_hold_users', label: 'Temporary Hold', description: 'Put users on temporary hold' },
  { type: 'approve_courses', label: 'Approve Courses', description: 'Review and approve course submissions' },
  { type: 'approve_quest_board', label: 'Approve Quest Board', description: 'Moderate Quest Board questions' },
  { type: 'manage_study_rooms', label: 'Manage Study Rooms', description: 'Control participants in study rooms' },
  { type: 'view_analytics', label: 'View Analytics', description: 'Access platform analytics' },
  { type: 'manage_content', label: 'Manage Content', description: 'Edit and remove platform content' },
  { type: 'manage_admins', label: 'Manage Admins', description: 'Promote/demote other admins' },
];

export const useAdminPrivileges = () => {
  const { user, userRole } = useAuth();
  const [admins, setAdmins] = useState<AdminWithPrivileges[]>([]);
  const [myPrivileges, setMyPrivileges] = useState<PrivilegeType[]>([]);
  const [loading, setLoading] = useState(true);

  const isCEO = userRole === 'ceo';

  const fetchPrivileges = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch my privileges
      const { data: myPrivData } = await supabase
        .from('admin_privileges')
        .select('privilege_type, granted')
        .eq('admin_user_id', user.id);

      const granted = (myPrivData || [])
        .filter(p => p.granted)
        .map(p => p.privilege_type as PrivilegeType);
      setMyPrivileges(granted);

      // CEO can fetch all admins
      if (isCEO) {
        // Get all admin users
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        if (adminRoles && adminRoles.length > 0) {
          const adminUserIds = adminRoles.map(r => r.user_id);

          // Get profiles for these admins
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, user_id, full_name, email, avatar_url')
            .in('user_id', adminUserIds);

          // Get privileges for these admins
          const { data: allPrivileges } = await supabase
            .from('admin_privileges')
            .select('*')
            .in('admin_user_id', adminUserIds);

          const adminsWithPrivs: AdminWithPrivileges[] = (profiles || []).map(profile => ({
            user_id: profile.user_id,
            profile_id: profile.id,
            full_name: profile.full_name || 'Unknown',
            email: profile.email || '',
            avatar_url: profile.avatar_url,
            privileges: (allPrivileges || []).filter(p => p.admin_user_id === profile.user_id) as AdminPrivilege[],
          }));

          setAdmins(adminsWithPrivs);
        }
      }
    } catch (err) {
      console.error('Error fetching privileges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivileges();
  }, [user?.id, isCEO]);

  const hasPrivilege = (type: PrivilegeType): boolean => {
    if (isCEO) return true; // CEO has all privileges
    return myPrivileges.includes(type);
  };

  const grantPrivilege = async (adminUserId: string, privilegeType: PrivilegeType) => {
    if (!isCEO || !user) {
      toast.error('Only CEO can manage privileges');
      return false;
    }

    try {
      const { error } = await supabase
        .from('admin_privileges')
        .upsert({
          admin_user_id: adminUserId,
          privilege_type: privilegeType,
          granted: true,
          granted_by: user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'admin_user_id,privilege_type' });

      if (error) throw error;

      toast.success('Privilege granted');
      await fetchPrivileges();
      return true;
    } catch (err) {
      console.error('Error granting privilege:', err);
      toast.error('Failed to grant privilege');
      return false;
    }
  };

  const revokePrivilege = async (adminUserId: string, privilegeType: PrivilegeType) => {
    if (!isCEO || !user) {
      toast.error('Only CEO can manage privileges');
      return false;
    }

    try {
      const { error } = await supabase
        .from('admin_privileges')
        .upsert({
          admin_user_id: adminUserId,
          privilege_type: privilegeType,
          granted: false,
          granted_by: user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'admin_user_id,privilege_type' });

      if (error) throw error;

      toast.success('Privilege revoked');
      await fetchPrivileges();
      return true;
    } catch (err) {
      console.error('Error revoking privilege:', err);
      toast.error('Failed to revoke privilege');
      return false;
    }
  };

  const holdUser = async (profileId: string, reason: string) => {
    if (!hasPrivilege('temporary_hold_users')) {
      toast.error('You do not have permission to hold users');
      return false;
    }

    try {
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      const { error } = await supabase
        .from('profiles')
        .update({
          is_on_hold: true,
          hold_reason: reason,
          held_at: new Date().toISOString(),
          held_by: myProfile?.id,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('User placed on temporary hold');
      return true;
    } catch (err) {
      console.error('Error holding user:', err);
      toast.error('Failed to hold user');
      return false;
    }
  };

  const releaseUser = async (profileId: string) => {
    if (!hasPrivilege('temporary_hold_users')) {
      toast.error('You do not have permission');
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_on_hold: false,
          hold_reason: null,
          held_at: null,
          held_by: null,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success('User released from hold');
      return true;
    } catch (err) {
      console.error('Error releasing user:', err);
      toast.error('Failed to release user');
      return false;
    }
  };

  return {
    admins,
    myPrivileges,
    loading,
    isCEO,
    allPrivilegeTypes: ALL_PRIVILEGES,
    hasPrivilege,
    grantPrivilege,
    revokePrivilege,
    holdUser,
    releaseUser,
    refetch: fetchPrivileges,
  };
};
