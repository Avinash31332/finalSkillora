import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { realtimeMessagingService, Message, ConversationPreview, TypingIndicator, UserStatus } from '@/lib/realtime-messaging.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Smile, 
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  Loader2
} from 'lucide-react';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';

export default function RealtimeMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [onlineDirectory, setOnlineDirectory] = useState<Record<string, { user_id: string; name: string; profile_picture?: string; last_seen?: string }>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize user status and load conversations
  useEffect(() => {
    if (!user?.id) return;

    const initializeChat = async () => {
      setLoading(true);
      
      // Initialize user online status
      await realtimeMessagingService.initializeUserStatus(user.id);
      
      // Load conversations (recent chats)
      const conversationsData = await realtimeMessagingService.getConversations(user.id);

      // Load all users to ensure everyone appears, then overlay presence + last messages
      const [allUsers, online] = await Promise.all([
        realtimeMessagingService.getAllUsersExcept(user.id),
        realtimeMessagingService.getOnlineUsers(user.id),
      ]);
      const onlineMap: Record<string, { user_id: string; name: string; profile_picture?: string; last_seen?: string }> = {};
      online.forEach((u) => (onlineMap[u.user_id] = u));
      setOnlineDirectory(onlineMap);

      const byId: Record<string, ConversationPreview> = {};
      conversationsData.forEach((c) => (byId[c.user_id] = c));
      allUsers.forEach((u) => {
        if (!byId[u.user_id]) {
          byId[u.user_id] = {
            user_id: u.user_id,
            name: u.name,
            profile_picture: u.profile_picture,
            last_message: undefined,
            unread_count: 0,
            is_online: !!onlineMap[u.user_id],
            last_seen: onlineMap[u.user_id]?.last_seen,
          };
        } else {
          byId[u.user_id].is_online = !!onlineMap[u.user_id];
          byId[u.user_id].last_seen = onlineMap[u.user_id]?.last_seen;
        }
      });

      // Sort: online first, then most recent message time, then name
      const merged: ConversationPreview[] = Object.values(byId).sort((a, b) => {
        if (a.is_online && !b.is_online) return -1;
        if (!a.is_online && b.is_online) return 1;
        const at = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
        const bt = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
        if (bt !== at) return bt - at;
        return a.name.localeCompare(b.name);
      });
      setConversations(merged);
      
      setLoading(false);
    };

    initializeChat();
  }, [user?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to messages
    const messagesChannel = realtimeMessagingService.subscribeToMessages(
      user.id,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
        
        // Update conversations list
        updateConversationsList(newMessage);
      },
      (updatedMessage) => {
        setMessages(prev => 
          prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
        );
      }
    );

    // Subscribe to live profile directory updates
    const profilesChannel = realtimeMessagingService.subscribeToProfiles((p) => {
      setOnlineDirectory((dir) => ({ ...dir, [p.user_id]: { user_id: p.user_id, name: p.name, profile_picture: p.profile_picture, last_seen: dir[p.user_id]?.last_seen } }));
      setConversations((prev) => {
        const exists = prev.some((c) => c.user_id === p.user_id);
        if (exists) {
          return prev.map((c) => (c.user_id === p.user_id ? { ...c, name: p.name, profile_picture: p.profile_picture } : c));
        }
        // Add new user to the list (no messages yet); online flag will be corrected by presence stream
        return [
          {
            user_id: p.user_id,
            name: p.name,
            profile_picture: p.profile_picture,
            last_message: undefined,
            unread_count: 0,
            is_online: onlineUsers.has(p.user_id),
            last_seen: onlineDirectory[p.user_id]?.last_seen,
          },
          ...prev,
        ];
      });
    });

    // Subscribe to typing indicators
    const typingChannel = realtimeMessagingService.subscribeToTypingIndicators(
      user.id,
      (typing) => {
        if (typing.target_user_id === user.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (typing.is_typing) {
              newSet.add(typing.user_id);
            } else {
              newSet.delete(typing.user_id);
            }
            return newSet;
          });
        }
      }
    );

    // Subscribe to user status changes
    const statusChannel = realtimeMessagingService.subscribeToUserStatus(
      async (status) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (status.is_online) newSet.add(status.user_id);
          else newSet.delete(status.user_id);
          return newSet;
        });

        // If the user comes online and is not in the list, fetch minimal profile and add an entry
        if (status.is_online) {
          setOnlineDirectory((dir) => ({ ...dir, [status.user_id]: { user_id: status.user_id, name: dir[status.user_id]?.name || '', profile_picture: dir[status.user_id]?.profile_picture, last_seen: status.last_seen } }));

          setConversations((prev) => {
            const exists = prev.some((c) => c.user_id === status.user_id);
            if (exists) {
              return prev.map((c) => (c.user_id === status.user_id ? { ...c, is_online: true, last_seen: status.last_seen } : c));
            }
            const minimal = onlineDirectory[status.user_id];
            if (!minimal) {
              // Try to fetch profile quickly if not cached
              (async () => {
                const list = await realtimeMessagingService.getOnlineUsers(user.id);
                const found = list.find((u) => u.user_id === status.user_id);
                if (found) {
                  setOnlineDirectory((dir2) => ({ ...dir2, [found.user_id]: found }));
                  setConversations((prev2) => [{
                    user_id: found.user_id,
                    name: found.name,
                    profile_picture: found.profile_picture,
                    last_message: undefined,
                    unread_count: 0,
                    is_online: true,
                    last_seen: found.last_seen,
                  }, ...prev2]);
                }
              })();
              return prev;
            }
            const newEntry: ConversationPreview = {
              user_id: minimal.user_id,
              name: minimal.name,
              profile_picture: minimal.profile_picture,
              last_message: undefined,
              unread_count: 0,
              is_online: true,
              last_seen: minimal.last_seen,
            };
            return [newEntry, ...prev];
          });
        } else {
          // Mark offline in the list
          setConversations((prev) => prev.map((c) => (c.user_id === status.user_id ? { ...c, is_online: false, last_seen: status.last_seen } : c)));
        }
      }
    );

    // Cleanup on unmount
    return () => {
      realtimeMessagingService.cleanup(user.id);
    };
  }, [user?.id]);

  // Load messages when user is selected
  useEffect(() => {
    if (!user?.id || !selectedUserId) return;

    const loadMessages = async () => {
      const messagesData = await realtimeMessagingService.getMessages(user.id, selectedUserId);
      setMessages(messagesData);
      scrollToBottom();
      
      // Mark messages as read
      await realtimeMessagingService.markMessagesAsRead(selectedUserId, user.id);
    };

    loadMessages();

    // Subscribe to pair broadcast fallback for instant realtime
    const pairChannel = realtimeMessagingService.subscribeToPairBroadcast(
      user.id,
      selectedUserId,
      (msg) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    );

    return () => {
      // Pair channel will be removed in cleanup() on route change/logout
    };
  }, [user?.id, selectedUserId]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Update conversations list when new message arrives
  const updateConversationsList = (message: Message) => {
    const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
    const otherUser = message.sender_id === user?.id ? message.receiver : message.sender;
    
    setConversations(prev => {
      const existingIndex = prev.findIndex(conv => conv.user_id === otherUserId);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          last_message: {
            content: message.content,
            created_at: message.created_at,
            sender_id: message.sender_id,
          },
          unread_count: message.sender_id !== user?.id ? 
            updated[existingIndex].unread_count + 1 : 
            updated[existingIndex].unread_count,
        };
        return updated;
      } else {
        return [{
          user_id: otherUserId,
          name: otherUser?.name || 'Unknown User',
          profile_picture: otherUser?.profile_picture,
          last_message: {
            content: message.content,
            created_at: message.created_at,
            sender_id: message.sender_id,
          },
          unread_count: message.sender_id !== user?.id ? 1 : 0,
          is_online: onlineUsers.has(otherUserId),
          last_seen: undefined,
        }, ...prev];
      }
    });
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !selectedUserId || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const sentMessage = await realtimeMessagingService.sendMessage(
        user.id,
        selectedUserId,
        messageContent
      );

      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        scrollToBottom();
        updateConversationsList(sentMessage);
      } else {
        // Restore text if failed and surface error
        setNewMessage(messageContent);
        alert('Failed to send message. Please ensure you are signed in and permitted.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
      alert('Failed to send message due to an unexpected error.');
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!user?.id || !selectedUserId) return;

    // Send typing indicator
    realtimeMessagingService.sendTypingIndicator(user.id, selectedUserId, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      realtimeMessagingService.sendTypingIndicator(user.id, selectedUserId, false);
    }, 1000);
  }, [user?.id, selectedUserId]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Get message status icon
  const getMessageStatusIcon = (message: Message) => {
    if (message.sender_id !== user?.id) return null;
    
    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const selectedConversation = conversations.find(c => c.user_id === selectedUserId);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Messages</CardTitle>
                  <Button size="sm" variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2"
                />
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start chatting with other users!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.user_id}
                          className={cn(
                            "p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4",
                            selectedUserId === conversation.user_id 
                              ? "border-blue-500 bg-blue-50" 
                              : "border-transparent"
                          )}
                          onClick={() => setSelectedUserId(conversation.user_id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage 
                                  src={conversation.profile_picture} 
                                  alt={conversation.name}
                                />
                                <AvatarFallback>
                                  {conversation.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {conversation.is_online && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm truncate">
                                  {conversation.name}
                                </p>
                                {conversation.unread_count > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conversation.unread_count}
                                  </Badge>
                                )}
                              </div>
                              {conversation.last_message && (
                                <p className="text-xs text-gray-500 truncate">
                                  {conversation.last_message.sender_id === user?.id ? 'You: ' : ''}
                                  {conversation.last_message.content}
                                </p>
                              )}
                              <p className="text-xs text-gray-400">
                                {conversation.last_message ? formatTime(conversation.last_message.created_at) : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {selectedUserId ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage 
                              src={selectedConversation?.profile_picture} 
                              alt={selectedConversation?.name}
                            />
                            <AvatarFallback>
                              {selectedConversation?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {selectedConversation?.is_online && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{selectedConversation?.name}</h3>
                          <p className="text-sm text-gray-500">
                            {selectedConversation?.is_online ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[calc(100vh-400px)] p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.sender_id === user?.id ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                                message.sender_id === user?.id
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              )}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className="flex items-center justify-end mt-1 space-x-1">
                                <span className="text-xs opacity-70">
                                  {formatTime(message.created_at)}
                                </span>
                                {getMessageStatusIcon(message)}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Typing Indicator */}
                        {typingUsers.has(selectedUserId) && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 px-4 py-2 rounded-lg">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Input
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button size="sm" variant="outline">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim() || sending}
                        size="sm"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-500">
                      Choose a conversation from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

