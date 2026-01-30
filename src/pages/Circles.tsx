
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Users, Circle, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JoinCircleModal } from '@/components/circles/JoinCircleModal';
import { CreateCircleModal } from '@/components/circles/CreateCircleModal';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useTrendingCircles } from '@/hooks/useCircles';
import { useFollowing, useToggleFollow } from '@/hooks/useFollows';
import { useSuggestedProfiles } from '@/hooks/useProfiles';

const Circles: React.FC = () => {
  const navigate = useNavigate();
  const { data: circles = [], isLoading: circlesLoading } = useTrendingCircles(10);
  const { data: following = [], isLoading: followingLoading } = useFollowing();
  const { data: suggestions = [], isLoading: suggestionsLoading } = useSuggestedProfiles(10);
  const toggleFollow = useToggleFollow();
  
  const [isJoinCircleModalOpen, setIsJoinCircleModalOpen] = useState(false);
  const [isCreateCircleModalOpen, setIsCreateCircleModalOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // Filter contacts based on search
  const filteredContacts = contactSearchQuery
    ? following.filter(f => 
        f.profile?.full_name?.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
        f.profile?.username?.toLowerCase().includes(contactSearchQuery.toLowerCase())
      )
    : following;

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Circle</h1>
        <p className="text-muted-foreground">Connect with your circles and contacts.</p>
      </div>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="contacts">Following</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="circles">Circles</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search people you follow..." 
              className="pl-9"
              value={contactSearchQuery}
              onChange={(e) => setContactSearchQuery(e.target.value)}
            />
          </div>

          {followingLoading && renderLoadingSkeleton()}
          
          {!followingLoading && filteredContacts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {contactSearchQuery ? 'No contacts found' : 'Not following anyone yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {contactSearchQuery 
                    ? 'Try searching with a different term.'
                    : 'Follow experts and investors to see them here.'}
                </p>
                {!contactSearchQuery && (
                  <Button onClick={() => navigate('/discover')}>
                    Discover People
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {!followingLoading && filteredContacts.length > 0 && (
            <div className="space-y-2">
              {filteredContacts.map(contact => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-4 flex-1"
                        onClick={() => navigate(`/profile/${contact.profile?.username}`)}
                      >
                        <Avatar>
                          <AvatarImage src={contact.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {contact.profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{contact.profile?.full_name || 'User'}</h4>
                          <p className="text-sm text-muted-foreground">
                            @{contact.profile?.username || 'user'}
                          </p>
                          {contact.profile?.headline && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {contact.profile.headline}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow.mutate(contact.following_id);
                        }}
                        disabled={toggleFollow.isPending}
                      >
                        Unfollow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <p className="text-muted-foreground text-sm mb-4">
            People you might want to follow based on your interests.
          </p>

          {suggestionsLoading && renderLoadingSkeleton()}

          {!suggestionsLoading && suggestions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No suggestions available</h3>
                <p className="text-muted-foreground">Check back later for new people to follow.</p>
              </CardContent>
            </Card>
          )}

          {!suggestionsLoading && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map(person => (
                <Card key={person.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-4 flex-1 cursor-pointer"
                        onClick={() => navigate(`/profile/${person.username}`)}
                      >
                        <Avatar>
                          <AvatarImage src={person.avatar_url || undefined} />
                          <AvatarFallback>
                            {person.full_name?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{person.full_name || 'User'}</h4>
                          <p className="text-sm text-muted-foreground">@{person.username || 'user'}</p>
                          {person.headline && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {person.headline}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow.mutate(person.id);
                        }}
                        disabled={toggleFollow.isPending}
                      >
                        Follow
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="circles" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => setIsCreateCircleModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Circle
            </Button>
            <Button variant="outline" onClick={() => setIsJoinCircleModalOpen(true)}>
              <Search className="mr-2 h-4 w-4" />
              Join Circle
            </Button>
          </div>

          {circlesLoading && renderLoadingSkeleton()}

          {!circlesLoading && circles.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Circle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No circles yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create or join a circle to connect with like-minded investors.
                </p>
              </CardContent>
            </Card>
          )}

          {!circlesLoading && circles.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {circles.map(circle => (
                <Card 
                  key={circle.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer" 
                  onClick={() => navigate(`/circle/${circle.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{circle.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {circle.type === 'public' ? 'Public Circle' : 'Private Circle'} • {circle.member_count || 0} members
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {circle.description || 'No description available'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <JoinCircleModal 
        isOpen={isJoinCircleModalOpen} 
        onClose={() => setIsJoinCircleModalOpen(false)} 
      />
      
      <CreateCircleModal 
        isOpen={isCreateCircleModalOpen} 
        onClose={() => setIsCreateCircleModalOpen(false)} 
      />
    </div>
  );
};

export default Circles;
