
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, Heart, MessageCircle, Share2, Users, TrendingUp, 
  Settings, CheckCheck, AlertCircle, UserPlus, Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationRead, useMarkAllNotificationsRead, Notification } from '@/hooks/useNotifications';

const Notifications: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('all');
  const { data: notifications, isLoading, error } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'follow': return UserPlus;
      case 'mention': return Share2;
      case 'system': return AlertCircle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like': return 'from-red-500 to-pink-500';
      case 'comment': return 'from-blue-500 to-cyan-500';
      case 'follow': return 'from-green-500 to-emerald-500';
      case 'mention': return 'from-purple-500 to-violet-500';
      case 'system': return 'from-slate-500 to-gray-500';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  const handleMarkAsRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllRead.mutate();
  };

  const filterNotifications = () => {
    if (!notifications) return [];
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') return notifications.filter(n => !n.is_read);
    return notifications.filter(n => n.type === activeTab);
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <Card className="rounded-3xl border-0 shadow-lg bg-card">
      <CardContent className="p-12 text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Bell className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No notifications</h3>
        <p className="text-muted-foreground">
          {activeTab === 'unread' 
            ? "You're all caught up! No unread notifications." 
            : "No notifications in this category yet."
          }
        </p>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card className="rounded-3xl border-0 shadow-lg bg-card">
      <CardContent className="p-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Failed to load notifications</h3>
        <p className="text-muted-foreground mb-4">Something went wrong. Please try again.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">Stay updated with your investment community</p>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground rounded-full h-6 w-6 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="rounded-2xl"
                disabled={unreadCount === 0 || markAllRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button variant="outline" size="sm" className="rounded-2xl">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-3xl border shadow-lg bg-card">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 h-auto mb-4 bg-muted rounded-2xl p-1">
                <TabsTrigger value="all" className="rounded-xl">All</TabsTrigger>
                <TabsTrigger value="unread" className="rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span>Unread</span>
                    {unreadCount > 0 && (
                      <Badge className="bg-destructive text-destructive-foreground rounded-full h-4 w-4 p-0 flex items-center justify-center text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="like" className="rounded-xl">
                  <Heart className="h-4 w-4 mr-1" />
                  Likes
                </TabsTrigger>
                <TabsTrigger value="comment" className="rounded-xl">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="follow" className="rounded-xl">
                  <Users className="h-4 w-4 mr-1" />
                  Follows
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading && renderLoadingSkeleton()}
          {error && renderErrorState()}
          {!isLoading && !error && filterNotifications().length === 0 && renderEmptyState()}
          {!isLoading && !error && filterNotifications().map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);
            
            return (
              <Card 
                key={notification.id} 
                className={`rounded-3xl border shadow-lg bg-card hover:shadow-xl transition-all duration-300 group ${
                  !notification.is_read ? 'ring-2 ring-primary/20' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-2xl bg-gradient-to-r ${colorClass} flex-shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    
                    {/* Avatar (if available) */}
                    {notification.actor && (
                      <Avatar className="h-12 w-12 ring-2 ring-border flex-shrink-0">
                        <AvatarImage src={notification.actor.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold">
                          {notification.actor.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{notification.title || 'Notification'}</h3>
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">
                        {notification.body || 'You have a new notification'}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                        
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="rounded-2xl text-primary hover:bg-primary/10"
                            disabled={markRead.isPending}
                          >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
