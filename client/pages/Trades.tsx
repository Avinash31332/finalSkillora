import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import Header from '@/components/Header';
import { TradesService, TradeWithComments, Comment } from '@/lib/trades.service';
import { 
  Plus, 
  User, 
  MessageCircle, 
  Check, 
  X, 
  ArrowLeft, 
  Clock,
  MapPin,
  Calendar,
  Users,
  Filter,
  Search
} from 'lucide-react';

// Use the types from the service
type Trade = TradeWithComments;

interface NewTradeData {
  title: string;
  description: string;
  skillOffered: string;
  skillWanted: string;
  location?: string;
  deadline?: string;
}

const Trades: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { profile, hasProfile } = useProfile();
  
  // State management
  const [activeView, setActiveView] = useState<'list' | 'details' | 'new-trade'>('list');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Closed' | 'Assigned'>('all');
  
  // New trade form state
  const [newTrade, setNewTrade] = useState<NewTradeData>({
    title: '',
    description: '',
    skillOffered: '',
    skillWanted: '',
    location: '',
    deadline: ''
  });
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load trades from database
  useEffect(() => {
    const loadTrades = async () => {
      setLoading(true);
      try {
        const { data, error } = await TradesService.getTrades();
        if (error) {
          setError(error);
        } else {
          setTrades(data || []);
          setError(null);
        }
      } catch (err) {
        setError('Failed to load trades');
        console.error('Error loading trades:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrades();

    // Subscribe to real-time updates
    const subscription = TradesService.subscribeToTrades((updatedTrades) => {
      setTrades(updatedTrades);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter trades based on search and status
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trade.description && trade.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         trade.skill_offered.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.skill_wanted.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please sign in to create a trade');
      return;
    }

    if (!hasProfile) {
      alert('Please create a profile first');
      navigate('/create-profile');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!newTrade.title.trim() || !newTrade.skillOffered.trim() || !newTrade.skillWanted.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      // Create trade in database
      const { data, error } = await TradesService.createTrade({
        title: newTrade.title.trim(),
        description: newTrade.description.trim(),
        skillOffered: newTrade.skillOffered.trim(),
        skillWanted: newTrade.skillWanted.trim(),
        userId: user?.id || 'anonymous',
        userDisplayName: profile?.name || 'Anonymous User',
        location: newTrade.location?.trim(),
        deadline: newTrade.deadline
      });

      if (error) {
        setError(error);
        return;
      }

      // Reset form
      setNewTrade({
        title: '',
        description: '',
        skillOffered: '',
        skillWanted: '',
        location: '',
        deadline: ''
      });
      
      setActiveView('list');
      setError(null);
      
    } catch (err) {
      setError('Failed to create trade');
      console.error('Error creating trade:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || !selectedTrade) return;

    try {
      const newComment: Comment = {
        id: Date.now().toString(),
        author: profile?.name || 'Anonymous User',
        text: commentText.trim(),
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous'
      };

      // Add comment to database
      const { error } = await TradesService.addComment(selectedTrade.id, newComment);
      
      if (error) {
        setError(error);
        return;
      }

      setCommentText('');
      setError(null);
      
    } catch (err) {
      setError('Failed to add comment');
      console.error('Error adding comment:', err);
    }
  };

  const handleAssignTrade = async (comment: Comment) => {
    if (!selectedTrade) return;

    try {
      // Update comment status to accepted
      const { error: commentError } = await TradesService.updateCommentStatus(
        selectedTrade.id, 
        comment.id, 
        'accepted'
      );
      
      if (commentError) {
        setError(commentError);
        return;
      }

      // Assign trade
      const { error: assignError } = await TradesService.assignTrade(
        selectedTrade.id,
        {
          userId: comment.userId,
          userDisplayName: comment.author
        }
      );
      
      if (assignError) {
        setError(assignError);
        return;
      }

      setError(null);
      
    } catch (err) {
      setError('Failed to assign trade');
      console.error('Error assigning trade:', err);
    }
  };

  const handleAcceptComment = async (comment: Comment) => {
    if (!selectedTrade) return;

    try {
      // Update comment status to accepted
      const { error: commentError } = await TradesService.updateCommentStatus(
        selectedTrade.id, 
        comment.id, 
        'accepted'
      );
      
      if (commentError) {
        setError(commentError);
        return;
      }

      // Assign trade
      const { error: assignError } = await TradesService.assignTrade(
        selectedTrade.id,
        {
          userId: comment.userId,
          userDisplayName: comment.author
        }
      );
      
      if (assignError) {
        setError(assignError);
        return;
      }

      setError(null);
      
    } catch (err) {
      setError('Failed to accept comment');
      console.error('Error accepting comment:', err);
    }
  };

  const handleRejectComment = async (commentId: string) => {
    if (!selectedTrade) return;

    try {
      const { error } = await TradesService.updateCommentStatus(
        selectedTrade.id, 
        commentId, 
        'rejected'
      );
      
      if (error) {
        setError(error);
        return;
      }

      setError(null);
      
    } catch (err) {
      setError('Failed to reject comment');
      console.error('Error rejecting comment:', err);
    }
  };

  const handleUpdateStatus = async (status: 'Open' | 'Closed' | 'Assigned') => {
    if (!selectedTrade) return;

    try {
      const { error } = await TradesService.updateTradeStatus(selectedTrade.id, status);
      
      if (error) {
        setError(error);
        return;
      }

      setError(null);
      
    } catch (err) {
      setError('Failed to update trade status');
      console.error('Error updating status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-red-100 text-red-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTradeList = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Header */}
      <Header />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">Skill Trades</h1>
              <Badge variant="outline" className="text-sm">
                {filteredTrades.length} trades
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setActiveView('new-trade')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Trade
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Quick Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/skills')}
              variant="outline"
              className="text-gray-600 hover:text-green-600 hover:border-green-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Skills
            </Button>
            <Button
              onClick={() => navigate('/feed')}
              variant="outline"
              className="text-gray-600 hover:text-green-600 hover:border-green-300"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Social Feed
            </Button>
            <Button
              onClick={() => navigate('/create-post')}
              variant="outline"
              className="text-gray-600 hover:text-green-600 hover:border-green-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
            <Button
              onClick={() => navigate('/chat')}
              variant="outline"
              className="text-gray-600 hover:text-green-600 hover:border-green-300"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Button
              onClick={() => navigate('/resume')}
              variant="outline"
              className="text-gray-600 hover:text-green-600 hover:border-green-300"
            >
              <User className="w-4 h-4 mr-2" />
              Resume
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {(['all', 'Open', 'Closed', 'Assigned'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    statusFilter === status 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "text-gray-600 hover:text-green-600"
                  )}
                >
                  {status === 'all' ? 'All' : status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        {/* Trades List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading trades...</p>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trades found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Be the first to create a trade and start connecting with others!'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => setActiveView('new-trade')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Trade
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTrades.map((trade) => (
              <Card 
                key={trade.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-green-300"
                onClick={() => {
                  setSelectedTrade(trade);
                  setActiveView('details');
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-green-600 hover:text-green-700">
                      {trade.title}
                    </CardTitle>
                    <Badge className={cn("text-sm", getStatusColor(trade.status))}>
                      {trade.status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <User className="w-4 h-4 mr-1" />
                    <span className="mr-4">{trade.user_display_name}</span>
                    <Clock className="w-4 h-4 mr-1" />
                    <span>
                      {formatDistanceToNow(new Date(trade.created_at))} ago
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-green-800 mb-1">Offering:</p>
                        <p className="text-green-700">{trade.skill_offered}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-800 mb-1">Seeking:</p>
                        <p className="text-blue-700">{trade.skill_wanted}</p>
                      </div>
                    </div>
                    
                    {trade.description && (
                      <p className="text-gray-700 line-clamp-2">{trade.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {trade.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{trade.location}</span>
                          </div>
                        )}
                        {trade.deadline && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(trade.deadline).toLocaleDateString()}</span>
                </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        <span>{trade.comments.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderNewTradeForm = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Header */}
      <Header />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setActiveView('list')}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-green-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Trades
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Create New Trade</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-900">Create a Skill Trade</CardTitle>
            <p className="text-center text-gray-600">
              Exchange your skills with others in the community
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTrade} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                  Trade Title *
                </Label>
                <Input
              id="title"
                  value={newTrade.title}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What are you looking to trade?"
                  className="mt-1"
              required
            />
          </div>

              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  Description
                </Label>
                <Textarea
              id="description"
                  value={newTrade.description}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide more details about your trade..."
                  rows={4}
                  className="mt-1"
                />
          </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="skillOffered" className="text-sm font-semibold text-gray-700">
                    What You're Offering *
                  </Label>
                  <Input
              id="skillOffered"
                    value={newTrade.skillOffered}
                    onChange={(e) => setNewTrade(prev => ({ ...prev, skillOffered: e.target.value }))}
                    placeholder="e.g., Web Development, Design, Marketing"
                    className="mt-1"
              required
            />
          </div>

                <div>
                  <Label htmlFor="skillWanted" className="text-sm font-semibold text-gray-700">
                    What You're Looking For *
                  </Label>
                  <Input
              id="skillWanted"
                    value={newTrade.skillWanted}
                    onChange={(e) => setNewTrade(prev => ({ ...prev, skillWanted: e.target.value }))}
                    placeholder="e.g., Mobile App Development, Content Writing"
                    className="mt-1"
              required
            />
          </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={newTrade.location}
                    onChange={(e) => setNewTrade(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country or Remote"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700">
                    Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newTrade.deadline}
                    onChange={(e) => setNewTrade(prev => ({ ...prev, deadline: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveView('list')}
                >
              Cancel
            </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Trade'
                  )}
            </Button>
          </div>
        </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTradeDetails = () => {
    if (!selectedTrade) return null;

    const isTradeOwner = user?.id === selectedTrade.user_id;
    const isTradeOpen = selectedTrade.status === 'Open';

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Navigation Header */}
        <Header />
        
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setActiveView('list')}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-green-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Trades
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">{selectedTrade.title}</h1>
                <Badge className={cn("text-sm", getStatusColor(selectedTrade.status))}>
                  {selectedTrade.status}
                </Badge>
              </div>
              
              {isTradeOwner && (
              <div className="flex space-x-2">
                  {isTradeOpen ? (
                    <Button
                      onClick={() => handleUpdateStatus('Closed')}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close Trade
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpdateStatus('Open')}
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 border-green-300"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Reopen Trade
                  </Button>
                )}
              </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Breadcrumb Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-green-600"
              >
                Home
              </Button>
              <span className="text-gray-400">/</span>
              <Button
                onClick={() => setActiveView('list')}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-green-600"
              >
                Trades
              </Button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">{selectedTrade.title}</span>
            </nav>
                </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trade Details */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedTrade.title}</h2>
                      <div className="flex items-center text-gray-500 text-sm mt-2">
                        <User className="w-4 h-4 mr-1" />
                        <span className="mr-4">{selectedTrade.user_display_name}</span>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          {formatDistanceToNow(new Date(selectedTrade.created_at))} ago
                        </span>
                </div>
              </div>
            </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Skills */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-800 mb-2">Offering:</h3>
                      <p className="text-green-700">{selectedTrade.skill_offered}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-2">Seeking:</h3>
                      <p className="text-blue-700">{selectedTrade.skill_wanted}</p>
              </div>
            </div>

                  {/* Description */}
                  {selectedTrade.description && (
            <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Description:</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedTrade.description}</p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedTrade.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{selectedTrade.location}</span>
                      </div>
                    )}
                    {selectedTrade.deadline && (
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{new Date(selectedTrade.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Comments ({selectedTrade.comments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Comments List */}
                  {selectedTrade.comments.length > 0 ? (
                    selectedTrade.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-medium text-gray-800">{comment.author}</span>
                            {comment.status === 'accepted' && (
                              <Badge className="ml-2 text-xs bg-green-100 text-green-800">
                                Accepted
                              </Badge>
                            )}
                          {comment.status === 'rejected' && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Rejected
                              </Badge>
                            )}
                            {!comment.status && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Pending
                              </Badge>
                          )}
                        </div>
                          <span className="text-gray-500 text-sm">
                          {formatDistanceToNow(new Date(comment.timestamp))} ago
                        </span>
                      </div>
                        <p className="text-gray-700 mb-3">{comment.text}</p>
                        
                        {isTradeOwner && 
                         comment.userId !== user?.id && 
                         isTradeOpen && 
                         !comment.status && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleAcceptComment(comment)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Accept
                          </Button>
                            <Button
                              onClick={() => handleRejectComment(comment.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No comments yet. Be the first to start the conversation!</p>
                    </div>
                  )}

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="bg-white p-4 rounded-lg border border-gray-200">
                    <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                      rows={3}
                      className="mb-4"
                  required
                />
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                  Add Comment
                </Button>
              </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trade Status */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Trade Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className={cn("w-full justify-center", getStatusColor(selectedTrade.status))}>
                      {selectedTrade.status}
                    </Badge>
                    {selectedTrade.status === 'Assigned' && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Status:</p>
                        <p>Assigned</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trade Info */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Trade Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Created by:</p>
                    <p className="text-gray-600">{selectedTrade.user_display_name}</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Created:</p>
                    <p className="text-gray-600">
                      {new Date(selectedTrade.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-700">Comments:</p>
                    <p className="text-gray-600">{selectedTrade.comments.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {activeView === 'list' && renderTradeList()}
      {activeView === 'details' && selectedTrade && renderTradeDetails()}
      {activeView === 'new-trade' && renderNewTradeForm()}
    </>
  );
};

export default Trades;