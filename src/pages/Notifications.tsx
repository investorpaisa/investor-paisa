import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, Heart, MessageCircle, Users, 
  CheckCheck, AlertCircle, UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState('all');
  const { data: notifications, isLoading, error } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return Heart;
      case 'comment': return MessageCircle;
      case 'follow': return UserPlus;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like': return 'from-red-500 to-pink-500';
      case 'comment': return 'from-primary to-primary/70';
      case 'follow': return 'from-green-500 to-emerald-500';
      default: return 'from-primary to-primary/70';
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

  if (!user) return null;

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border border-border/50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <Card className="border border-border/50 bg-card/50">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">No notifications</h3>
        <p className="text-muted-foreground text-xs sm:text-sm">
          {activeTab === 'unread' 
            ? "You're all caught up!" 
            : "No notifications yet"
          }
        </p>
      </CardContent>
    </Card>
  );

  const renderErrorState = () => (
    <Card className="border border-border/50 bg-card/50">
      <CardContent className="p-8 sm:p-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
        <h3 className="text-base sm:text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground text-xs sm:text-sm mb-4">Failed to load notifications</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-2 py-4 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs h-8 px-3"
            disabled={unreadCount === 0 || markAllRead.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
            Mark all read
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 h-9 bg-secondary/50 rounded-xl p-0.5">
              <TabsTrigger value="all" className="text-xs rounded-lg h-8">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs rounded-lg h-8 gap-1">
                Unread
                {unreadCount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground h-4 min-w-4 p-0 flex items-center justify-center text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="like" className="text-xs rounded-lg h-8">
                <Heart className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="follow" className="text-xs rounded-lg h-8">
                <Users className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading && renderLoadingSkeleton()}
          {error && renderErrorState()}
          {!isLoading && !error && filterNotifications().length === 0 && renderEmptyState()}
          {!isLoading && !error && filterNotifications().map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);
            
            return (
              <Card 
                key={notification.id} 
                className={`border border-border/50 hover:border-primary/30 transition-all ${
                  !notification.is_read ? 'bg-primary/5' : 'bg-card/50'
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${colorClass} flex-shrink-0`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    
                    {/* Avatar */}
                    {notification.actor && (
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={notification.actor.avatar_url || undefined} />
                        <AvatarFallback className="bg-secondary text-xs">
                          {notification.actor.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-sm line-clamp-1">
                            {notification.title || 'Notification'}
                          </h3>
                          <p className="text-muted-foreground text-xs line-clamp-2 mt-0.5">
                            {notification.body || 'You have a new notification'}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                        
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10"
                            disabled={markRead.isPending}
                          >
                            Mark read
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
