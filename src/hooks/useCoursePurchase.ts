import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export const useCoursePurchase = () => {
  const { profile } = useProfile();

  const purchaseCourse = async (courseId: string, amount: number) => {
    if (!profile?.id) return { success: false, error: 'Not logged in' };

    try {
      const { data, error } = await supabase.rpc('purchase_course', {
        p_buyer_id: profile.id,
        p_course_id: courseId,
        p_amount: amount,
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        error?: string;
        new_balance?: number;
        instructor_share?: number;
        l1_commission?: number;
        l2_commission?: number;
      };

      if (!result.success) {
        return { success: false, error: result.error || 'Purchase failed' };
      }

      toast.success('Course purchased successfully! You are now enrolled.');
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message || 'Purchase failed' };
    }
  };

  return { purchaseCourse };
};
