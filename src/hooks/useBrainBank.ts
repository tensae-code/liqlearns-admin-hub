import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

export type BrainBankItemType = 'vocabulary' | 'note' | 'flashcard' | 'bookmark' | 'quote';

export interface BrainBankItem {
  id: string;
  user_id: string;
  type: BrainBankItemType;
  title: string;
  content: string | null;
  translation: string | null;
  pronunciation: string | null;
  category: string;
  tags: string[];
  is_favorite: boolean;
  mastery_level: number;
  review_count: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBrainBankItem {
  type: BrainBankItemType;
  title: string;
  content?: string;
  translation?: string;
  pronunciation?: string;
  category?: string;
  tags?: string[];
}

export const useBrainBank = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [items, setItems] = useState<BrainBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brain_bank')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data as BrainBankItem[]) || []);
    } catch (err) {
      console.error('Error fetching brain bank items:', err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchItems();
    }
  }, [profile?.id]);

  const addItem = async (item: CreateBrainBankItem) => {
    if (!profile?.id) {
      toast.error('Please sign in to add items');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('brain_bank')
        .insert([{
          user_id: profile.id,
          type: item.type,
          title: item.title,
          content: item.content || null,
          translation: item.translation || null,
          pronunciation: item.pronunciation || null,
          category: item.category || 'general',
          tags: item.tags || [],
        }])
        .select()
        .single();

      if (error) throw error;
      
      setItems(prev => [data as BrainBankItem, ...prev]);
      toast.success('Added to Brain Bank! 🧠');
      return data as BrainBankItem;
    } catch (err) {
      console.error('Error adding item:', err);
      toast.error('Failed to add item');
      return null;
    }
  };

  const updateItem = async (id: string, updates: Partial<BrainBankItem>) => {
    try {
      const { data, error } = await supabase
        .from('brain_bank')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setItems(prev => prev.map(item => item.id === id ? data as BrainBankItem : item));
      return data as BrainBankItem;
    } catch (err) {
      console.error('Error updating item:', err);
      toast.error('Failed to update item');
      return null;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('brain_bank')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item removed');
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item');
      return false;
    }
  };

  const toggleFavorite = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    await updateItem(id, { is_favorite: !item.is_favorite });
  };

  const incrementMastery = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || item.mastery_level >= 5) return;
    
    await updateItem(id, {
      mastery_level: item.mastery_level + 1,
      review_count: item.review_count + 1,
      last_reviewed_at: new Date().toISOString(),
    });
  };

  const getItemsByType = (type: BrainBankItemType) => {
    return items.filter(item => item.type === type);
  };

  const getFavorites = () => {
    return items.filter(item => item.is_favorite);
  };

  const stats = {
    total: items.length,
    vocabulary: items.filter(i => i.type === 'vocabulary').length,
    notes: items.filter(i => i.type === 'note').length,
    flashcards: items.filter(i => i.type === 'flashcard').length,
    bookmarks: items.filter(i => i.type === 'bookmark').length,
    quotes: items.filter(i => i.type === 'quote').length,
    favorites: items.filter(i => i.is_favorite).length,
    mastered: items.filter(i => i.mastery_level >= 4).length,
  };

  return {
    items,
    loading,
    error,
    stats,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    incrementMastery,
    getItemsByType,
    getFavorites,
    refetch: fetchItems,
  };
};
