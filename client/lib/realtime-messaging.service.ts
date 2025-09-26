import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read';
  reply_to?: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
  sender?: {
    id: string;
    name: string;
    profile_picture?: string;
  };
  receiver?: {
    id: string;
    name: string;
    profile_picture?: string;
  };
}

export interface TypingIndicator {
  id: string;
  user_id: string;
  target_user_id: string;
  is_typing: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    profile_picture?: string;
  };
}

export interface UserStatus {
  id: string;
  user_id: string;
  is_online: boolean;
  last_seen: string;
  status_message?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    profile_picture?: string;
  };
}

export interface ConversationPreview {
  user_id: string;
  name: string;
  profile_picture?: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
  is_online: boolean;
  last_seen?: string;
}

class RealtimeMessagingService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private buildPairRoom(userIdA: string, userIdB: string): string {
    // Stable unique room for user pair (order independent)
    const [a, b] = [userIdA, userIdB].sort();
    return `dm:${a}:${b}`;
  }

  // Fetch currently online users with basic profile data
  async getOnlineUsers(currentUserId: string): Promise<Array<{ user_id: string; name: string; profile_picture?: string; last_seen?: string }>> {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('user_id, is_online, last_seen')
        .eq('is_online', true);

      if (error || !data) return [];

      const otherUserIds = data
        .map((u) => u.user_id)
        .filter((id) => id !== currentUserId);

      if (otherUserIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, profile_picture')
        .in('user_id', otherUserIds);

      const lastSeenMap = new Map<string, string | undefined>();
      data.forEach((u) => lastSeenMap.set(u.user_id, u.last_seen));

      return (profiles || []).map((p: any) => ({
        user_id: p.user_id as string,
        name: p.name as string,
        profile_picture: p.profile_picture as string | undefined,
        last_seen: lastSeenMap.get(p.user_id),
      }));
    } catch (e) {
      console.error('Error fetching online users:', e);
      return [];
    }
  }

  // Subscribe to profiles (create/update) to keep user directory live
  subscribeToProfiles(
    onUpsert: (p: { user_id: string; name: string; profile_picture?: string }) => void
  ): RealtimeChannel {
    const channelName = 'profiles:upserts';

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          const row = payload.new as any;
          if (!row) return;
          onUpsert({ user_id: row.user_id, name: row.name, profile_picture: row.profile_picture });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Fetch all users (profiles) except the current user
  async getAllUsersExcept(currentUserId: string): Promise<Array<{ user_id: string; name: string; profile_picture?: string }>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, profile_picture')
        .neq('user_id', currentUserId)
        .order('name', { ascending: true });

      if (error || !data) return [];

      return data.map((p: any) => ({
        user_id: p.user_id as string,
        name: p.name as string,
        profile_picture: p.profile_picture as string | undefined,
      }));
    } catch (e) {
      console.error('Error fetching all users:', e);
      return [];
    }
  }

  // Initialize user online status
  async initializeUserStatus(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          is_online: true,
          last_seen: new Date().toISOString(),
        });

      if (error) {
        console.error('Error initializing user status:', error);
      }
    } catch (error) {
      console.error('Error initializing user status:', error);
    }
  }

  // Update user online status
  async updateUserStatus(userId: string, isOnline: boolean, statusMessage?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          status_message: statusMessage,
        });

      if (error) {
        console.error('Error updating user status:', error);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  // Send message
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    replyTo?: string
  ): Promise<Message | null> {
    try {
      // Minimal insert compatible with simple 1:1 schema
      const insertRes = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
        })
        .select('*')
        .single();

      if (insertRes.error || !insertRes.data) {
        console.error('Error sending message:', insertRes.error);
        return null;
      }

      const inserted = insertRes.data as any;

      // Hydrate sender/receiver profiles without relying on FK names
      try {
        const [senderProfile, receiverProfile] = await Promise.all([
          supabase.from('profiles').select('id, user_id, name, profile_picture').eq('user_id', inserted.sender_id).single(),
          supabase.from('profiles').select('id, user_id, name, profile_picture').eq('user_id', inserted.receiver_id).single(),
        ]);

        const result: Message = {
          id: inserted.id,
          sender_id: inserted.sender_id,
          receiver_id: inserted.receiver_id,
          content: inserted.content,
          message_type: inserted.message_type || 'text',
          status: inserted.status || 'sent',
          reply_to: inserted.reply_to || undefined,
          created_at: inserted.created_at,
          updated_at: inserted.updated_at || inserted.created_at,
          read_at: inserted.read_at || undefined,
          sender: senderProfile.data ? { id: senderProfile.data.user_id, name: senderProfile.data.name, profile_picture: senderProfile.data.profile_picture || undefined } : undefined,
          receiver: receiverProfile.data ? { id: receiverProfile.data.user_id, name: receiverProfile.data.name, profile_picture: receiverProfile.data.profile_picture || undefined } : undefined,
        };

        // Best-effort status bump
        setTimeout(async () => {
          try { await this.updateMessageStatus(result.id, 'delivered'); } catch {}
        }, 800);

        // Also broadcast realtime to the pair room for instant UX
        await this.broadcastPairMessage(senderId, receiverId, result);

        return result;
      } catch {
        // Fallback to raw inserted row if profiles not available
        const result: Message = {
          id: inserted.id,
          sender_id: inserted.sender_id,
          receiver_id: inserted.receiver_id,
          content: inserted.content,
          message_type: inserted.message_type || 'text',
          status: inserted.status || 'sent',
          reply_to: inserted.reply_to || undefined,
          created_at: inserted.created_at,
          updated_at: inserted.updated_at || inserted.created_at,
          read_at: inserted.read_at || undefined,
        } as Message;

        setTimeout(async () => {
          try { await this.updateMessageStatus(result.id, 'delivered'); } catch {}
        }, 800);

        await this.broadcastPairMessage(senderId, receiverId, result);
        return result;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Attempt best-effort broadcast so the UI still updates across clients
      const now = new Date().toISOString();
      const temp: Message = {
        id: crypto.randomUUID(),
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        message_type: 'text',
        status: 'sent',
        created_at: now,
        updated_at: now,
      } as Message;
      try { await this.broadcastPairMessage(senderId, receiverId, temp); } catch {}
      return null;
    }
  }

  // Update message status
  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<void> {
    try {
      const updateData: any = { status };
      if (status === 'read') {
        updateData.read_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId);

      if (error) {
        console.error('Error updating message status:', error);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // Mark messages as read
  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .neq('status', 'read');

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get messages between two users (no FK-dependent joins)
  async getMessages(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error || !data) {
        if (error) console.error('Error fetching messages:', error);
        return [];
      }

      const userIds = Array.from(
        new Set<string>(
          data.flatMap((m: any) => [m.sender_id as string, m.receiver_id as string])
        )
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, profile_picture')
        .in('user_id', userIds);

      const profMap = new Map<string, { name: string; profile_picture?: string }>();
      (profiles || []).forEach((p: any) => {
        profMap.set(p.user_id as string, { name: p.name as string, profile_picture: p.profile_picture || undefined });
      });

      return (data as any[]).map((row) => ({
        id: row.id,
        sender_id: row.sender_id,
        receiver_id: row.receiver_id,
        content: row.content,
        message_type: row.message_type || 'text',
        status: row.status || 'sent',
        reply_to: row.reply_to || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at || row.created_at,
        read_at: row.read_at || undefined,
        sender: profMap.has(row.sender_id)
          ? { id: row.sender_id, name: profMap.get(row.sender_id)!.name, profile_picture: profMap.get(row.sender_id)!.profile_picture }
          : undefined,
        receiver: profMap.has(row.receiver_id)
          ? { id: row.receiver_id, name: profMap.get(row.receiver_id)!.name, profile_picture: profMap.get(row.receiver_id)!.profile_picture }
          : undefined,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Get conversations for a user (no FK-dependent joins)
  async getConversations(userId: string): Promise<ConversationPreview[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error || !data) {
        if (error) console.error('Error fetching conversations:', error);
        return [];
      }

      const conversationMap = new Map<string, ConversationPreview>();
      data.forEach((m: any) => {
        const otherUserId = m.sender_id === userId ? m.receiver_id : m.sender_id;
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            user_id: otherUserId,
            name: 'Unknown User',
            profile_picture: undefined,
            last_message: { content: m.content, created_at: m.created_at, sender_id: m.sender_id },
            unread_count: m.sender_id !== userId ? 1 : 0,
            is_online: false,
            last_seen: undefined,
          });
        } else {
          const c = conversationMap.get(otherUserId)!;
          if (m.sender_id !== userId) c.unread_count += 1;
        }
      });

      const userIds = Array.from(conversationMap.keys());
      if (userIds.length > 0) {
        const [{ data: profiles }, { data: statuses }] = await Promise.all([
          supabase.from('profiles').select('user_id, name, profile_picture').in('user_id', userIds),
          supabase.from('user_status').select('user_id, is_online, last_seen').in('user_id', userIds),
        ]);

        const pMap = new Map<string, { name: string; profile_picture?: string }>();
        (profiles || []).forEach((p: any) => pMap.set(p.user_id, { name: p.name, profile_picture: p.profile_picture || undefined }));
        const sMap = new Map<string, { is_online: boolean; last_seen?: string }>();
        (statuses || []).forEach((s: any) => sMap.set(s.user_id, { is_online: s.is_online, last_seen: s.last_seen }));

        conversationMap.forEach((c, uid) => {
          const p = pMap.get(uid);
          if (p) { c.name = p.name; c.profile_picture = p.profile_picture; }
          const s = sMap.get(uid);
          if (s) { c.is_online = s.is_online; c.last_seen = s.last_seen; }
        });
      }

      return Array.from(conversationMap.values());
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  // Subscribe to messages
  subscribeToMessages(
    userId: string,
    onNewMessage: (message: Message) => void,
    onMessageUpdate: (message: Message) => void
  ): RealtimeChannel {
    const channelName = `messages:${userId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        async (payload) => {
          const row = payload.new as any;
          // Hydrate profiles
          const [{ data: sp }, { data: rp }] = await Promise.all([
            supabase.from('profiles').select('user_id, name, profile_picture').eq('user_id', row.sender_id).single(),
            supabase.from('profiles').select('user_id, name, profile_picture').eq('user_id', row.receiver_id).single(),
          ]);
          onNewMessage({
            id: row.id,
            sender_id: row.sender_id,
            receiver_id: row.receiver_id,
            content: row.content,
            message_type: row.message_type || 'text',
            status: row.status || 'sent',
            reply_to: row.reply_to || undefined,
            created_at: row.created_at,
            updated_at: row.updated_at || row.created_at,
            read_at: row.read_at || undefined,
            sender: sp ? { id: sp.user_id, name: sp.name, profile_picture: sp.profile_picture || undefined } : undefined,
            receiver: rp ? { id: rp.user_id, name: rp.name, profile_picture: rp.profile_picture || undefined } : undefined,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id=eq.${userId},receiver_id=eq.${userId})`,
        },
        async (payload) => {
          const row = payload.new as any;
          onMessageUpdate({
            id: row.id,
            sender_id: row.sender_id,
            receiver_id: row.receiver_id,
            content: row.content,
            message_type: row.message_type || 'text',
            status: row.status || 'sent',
            reply_to: row.reply_to || undefined,
            created_at: row.created_at,
            updated_at: row.updated_at || row.created_at,
            read_at: row.read_at || undefined,
          } as Message);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Broadcast: subscribe to a user-pair room for instant realtime fallback
  subscribeToPairBroadcast(
    userId: string,
    otherUserId: string,
    onPairMessage: (message: Message) => void
  ): RealtimeChannel {
    const room = this.buildPairRoom(userId, otherUserId);
    if (this.channels.has(room)) return this.channels.get(room)!;

    const channel = supabase
      .channel(room)
      .on('broadcast', { event: 'dm' }, (payload) => {
        const msg = payload.payload as Message;
        // Only accept messages that match this pair
        if (
          (msg.sender_id === userId && msg.receiver_id === otherUserId) ||
          (msg.sender_id === otherUserId && msg.receiver_id === userId)
        ) {
          onPairMessage(msg);
        }
      })
      .subscribe();

    this.channels.set(room, channel);
    return channel;
  }

  async broadcastPairMessage(senderId: string, receiverId: string, message: Message): Promise<void> {
    const room = this.buildPairRoom(senderId, receiverId);
    let channel = this.channels.get(room);
    if (!channel) {
      channel = supabase.channel(room);
      this.channels.set(room, channel);
      channel.subscribe();
    }
    await channel.send({ type: 'broadcast', event: 'dm', payload: message });
  }

  // Subscribe to typing indicators
  subscribeToTypingIndicators(
    userId: string,
    onTypingChange: (typing: TypingIndicator) => void
  ): RealtimeChannel {
    const channelName = `typing:${userId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `target_user_id=eq.${userId}`,
        },
        async (payload) => {
          const typing = payload.new as TypingIndicator;
          
          // Fetch user details
          const { data } = await supabase
            .from('profiles')
            .select('id, name, profile_picture')
            .eq('user_id', typing.user_id)
            .single();

          if (data) {
            onTypingChange({
              ...typing,
              user: data,
            });
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Subscribe to user status changes
  subscribeToUserStatus(
    onStatusChange: (status: UserStatus) => void
  ): RealtimeChannel {
    const channelName = 'user_status';
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
        },
        async (payload) => {
          const status = payload.new as UserStatus;
          
          // Fetch user details
          const { data } = await supabase
            .from('profiles')
            .select('id, name, profile_picture')
            .eq('user_id', status.user_id)
            .single();

          if (data) {
            onStatusChange({
              ...status,
              user: data,
            });
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // Send typing indicator
  async sendTypingIndicator(userId: string, targetUserId: string, isTyping: boolean): Promise<void> {
    try {
      // Clear existing timeout
      const timeoutKey = `${userId}-${targetUserId}`;
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey)!);
        this.typingTimeouts.delete(timeoutKey);
      }

      // Update typing status
      const { error } = await supabase
        .from('typing_indicators')
        .upsert({
          user_id: userId,
          target_user_id: targetUserId,
          is_typing,
        });

      if (error) {
        console.error('Error sending typing indicator:', error);
        return;
      }

      // Set timeout to stop typing after 3 seconds
      if (isTyping) {
        const timeout = setTimeout(async () => {
          await this.sendTypingIndicator(userId, targetUserId, false);
        }, 3000);
        
        this.typingTimeouts.set(timeoutKey, timeout);
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  // Search messages
  async searchMessages(userId: string, query: string, limit: number = 20): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, name, profile_picture),
          receiver:profiles!messages_receiver_id_fkey(id, name, profile_picture)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching messages:', error);
        return [];
      }

      return data as Message[];
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Cleanup on user logout
  async cleanup(userId: string): Promise<void> {
    try {
      // Update user status to offline
      await this.updateUserStatus(userId, false);

      // Unsubscribe from all channels
      this.channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      this.channels.clear();

      // Clear typing timeouts
      this.typingTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      this.typingTimeouts.clear();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const realtimeMessagingService = new RealtimeMessagingService();

