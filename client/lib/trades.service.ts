import { supabase } from './supabase';
import { Database } from './supabase';

type Trade = Database['public']['Tables']['trades']['Row'];
type TradeInsert = Database['public']['Tables']['trades']['Insert'];
type TradeUpdate = Database['public']['Tables']['trades']['Update'];

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  userId: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

export interface TradeWithComments extends Trade {
  comments: Comment[];
}

export class TradesService {
  // Get all trades
  static async getTrades(): Promise<{ data: TradeWithComments[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trades:', error);
        return { data: null, error: error.message };
      }

      // Transform the data to include proper comments structure
      const tradesWithComments: TradeWithComments[] = data?.map(trade => ({
        ...trade,
        comments: trade.comments || []
      })) || [];

      return { data: tradesWithComments, error: null };
    } catch (error) {
      console.error('Error in getTrades:', error);
      return { data: null, error: 'Failed to fetch trades' };
    }
  }

  // Get a single trade by ID
  static async getTradeById(id: string): Promise<{ data: TradeWithComments | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching trade:', error);
        return { data: null, error: error.message };
      }

      const tradeWithComments: TradeWithComments = {
        ...data,
        comments: data.comments || []
      };

      return { data: tradeWithComments, error: null };
    } catch (error) {
      console.error('Error in getTradeById:', error);
      return { data: null, error: 'Failed to fetch trade' };
    }
  }

  // Create a new trade
  static async createTrade(tradeData: {
    title: string;
    description?: string;
    skillOffered: string;
    skillWanted: string;
    userId: string;
    userDisplayName: string;
    location?: string;
    deadline?: string;
  }): Promise<{ data: TradeWithComments | null; error: string | null }> {
    try {
      const tradeInsert: TradeInsert = {
        title: tradeData.title,
        description: tradeData.description || null,
        skill_offered: tradeData.skillOffered,
        skill_wanted: tradeData.skillWanted,
        user_id: tradeData.userId,
        user_display_name: tradeData.userDisplayName,
        status: 'Open',
        comments: [],
        location: tradeData.location || null,
        deadline: tradeData.deadline || null,
      };

      const { data, error } = await supabase
        .from('trades')
        .insert(tradeInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating trade:', error);
        return { data: null, error: error.message };
      }

      const tradeWithComments: TradeWithComments = {
        ...data,
        comments: data.comments || []
      };

      return { data: tradeWithComments, error: null };
    } catch (error) {
      console.error('Error in createTrade:', error);
      return { data: null, error: 'Failed to create trade' };
    }
  }

  // Update trade status
  static async updateTradeStatus(id: string, status: 'Open' | 'Closed' | 'Assigned' | 'Completed'): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating trade status:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in updateTradeStatus:', error);
      return { error: 'Failed to update trade status' };
    }
  }

  // Add comment to trade
  static async addComment(tradeId: string, comment: Comment): Promise<{ error: string | null }> {
    try {
      // First get the current trade
      const { data: trade, error: fetchError } = await supabase
        .from('trades')
        .select('comments')
        .eq('id', tradeId)
        .single();

      if (fetchError) {
        console.error('Error fetching trade for comment:', fetchError);
        return { error: fetchError.message };
      }

      // Add the new comment to the existing comments
      const currentComments = trade.comments || [];
      const updatedComments = [...currentComments, comment];

      // Update the trade with the new comment
      const { error } = await supabase
        .from('trades')
        .update({ 
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) {
        console.error('Error adding comment:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in addComment:', error);
      return { error: 'Failed to add comment' };
    }
  }

  // Update comment status (accept/reject)
  static async updateCommentStatus(tradeId: string, commentId: string, status: 'accepted' | 'rejected'): Promise<{ error: string | null }> {
    try {
      // First get the current trade
      const { data: trade, error: fetchError } = await supabase
        .from('trades')
        .select('comments')
        .eq('id', tradeId)
        .single();

      if (fetchError) {
        console.error('Error fetching trade for comment update:', fetchError);
        return { error: fetchError.message };
      }

      // Update the comment status
      const currentComments = trade.comments || [];
      const updatedComments = currentComments.map((comment: Comment) => 
        comment.id === commentId ? { ...comment, status } : comment
      );

      // Update the trade with the updated comments
      const { error } = await supabase
        .from('trades')
        .update({ 
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) {
        console.error('Error updating comment status:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in updateCommentStatus:', error);
      return { error: 'Failed to update comment status' };
    }
  }

  // Assign trade to a user
  static async assignTrade(tradeId: string, assignedTo: { userId: string; userDisplayName: string }): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({ 
          status: 'Assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (error) {
        console.error('Error assigning trade:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Error in assignTrade:', error);
      return { error: 'Failed to assign trade' };
    }
  }

  // Subscribe to trades changes for real-time updates
  static subscribeToTrades(callback: (trades: TradeWithComments[]) => void) {
    return supabase
      .channel('trades_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'trades' 
        }, 
        async () => {
          // Refetch all trades when any change occurs
          const { data } = await this.getTrades();
          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
  }
}
