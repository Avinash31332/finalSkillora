import { supabase } from "@/lib/supabase";

export type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  user_id: string;
  name: string;
  profile_picture: string | null;
};

export type ConversationPreview = {
  user_id: string;
  profile: ProfileRow | null;
  last_message: MessageRow | null;
  unread_count: number;
};

export async function fetchConversations(currentUserId: string): Promise<ConversationPreview[]> {
  // Fetch latest messages per counterpart and unread counts
  const { data: msgs } = await supabase
    .from("messages")
    .select("id,sender_id,receiver_id,content,created_at")
    .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
    .order("created_at", { ascending: false });

  const byUser: Record<string, ConversationPreview> = {};
  (msgs || []).forEach((m) => {
    const otherId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
    if (!byUser[otherId]) {
      byUser[otherId] = {
        user_id: otherId,
        profile: null,
        last_message: m as MessageRow,
        unread_count: 0,
      };
    }
  });

  // Unread count: messages where receiver is current user and created after last opened (simplified: all unseen in local state)
  const otherIds = Object.keys(byUser);
  if (otherIds.length > 0) {
    const { data: unread } = await supabase
      .from("messages")
      .select("receiver_id,sender_id, id")
      .eq("receiver_id", currentUserId)
      .in("sender_id", otherIds);
    (unread || []).forEach((m) => {
      const sender = (m as any).sender_id as string;
      if (byUser[sender]) byUser[sender].unread_count += 1;
    });
  }

  // Profiles
  if (otherIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,user_id,name,profile_picture")
      .in("user_id", otherIds);
    const map: Record<string, ProfileRow> = {};
    (profiles || []).forEach((p: any) => {
      map[p.user_id] = p as ProfileRow;
    });
    otherIds.forEach((id) => {
      byUser[id].profile = map[id] || null;
    });
  }

  return Object.values(byUser);
}

export async function fetchMessages(currentUserId: string, otherUserId: string): Promise<MessageRow[]> {
  const { data } = await supabase
    .from("messages")
    .select("id,sender_id,receiver_id,content,created_at")
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    )
    .order("created_at", { ascending: true });
  return (data || []) as MessageRow[];
}

export async function sendMessage(currentUserId: string, otherUserId: string, content: string): Promise<MessageRow> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: currentUserId, receiver_id: otherUserId, content })
    .select("id,sender_id,receiver_id,content,created_at")
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export type Unsubscribe = () => void;

export function subscribeToIncoming(currentUserId: string, onInsert: (m: MessageRow) => void): Unsubscribe {
  const channel = supabase
    .channel("messages_realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const m = payload.new as MessageRow;
        if (m.receiver_id === currentUserId || m.sender_id === currentUserId) {
          onInsert(m);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
}


