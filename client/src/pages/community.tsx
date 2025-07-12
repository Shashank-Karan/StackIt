import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { CreatePostModal } from '@/components/community/create-post-modal';
import { PostCard } from '@/components/community/post-card';
import { AIChatbot } from '@/components/ai/ai-chatbot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import type { PostWithAuthor } from '@shared/schema';

export default function Community() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/posts', { search: searchQuery }],
    enabled: isAuthenticated,
  });

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a post.",
        variant: "destructive",
      });
      return;
    }
    setIsCreateModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome to StackIt Community
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Join our developer community to share code, get feedback, and learn from others worldwide.
          </p>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transition-all shadow-lg"
          >
            Login to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onAskQuestion={() => {}} // Not needed in community
        onOpenChatbot={() => setIsChatbotOpen(!isChatbotOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${isAuthenticated && isChatbotOpen ? 'md:mr-96' : ''}`}>
          {/* Hero Section */}
          <div className="relative bg-gradient-to-br from-primary via-purple-600 to-indigo-600 text-white py-20 overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                  Developer Community
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                  Share code snippets, get feedback, and learn from fellow developers worldwide
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                  <Button 
                    onClick={handleCreatePost}
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 font-semibold shadow-xl hover:shadow-2xl transition-all px-8 py-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Post
                  </Button>
                  <div className="flex items-center space-x-6 text-white/80">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{posts?.length || 0}</div>
                      <div className="text-sm">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">∞</div>
                      <div className="text-sm">Ideas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Create Post Section */}
            <div className="mb-8 bg-card rounded-xl border border-border/50 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Community Posts
                  </h2>
                  <p className="text-muted-foreground mt-1">Share your code, thoughts, and discoveries</p>
                </div>
                <Button 
                  onClick={handleCreatePost}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl shadow-sm border border-border/50 p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-muted" />
                        <Skeleton className="h-3 w-20 bg-muted" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-3 bg-muted" />
                    <Skeleton className="h-20 w-full mb-4 bg-muted" />
                    <div className="flex space-x-4">
                      <Skeleton className="h-8 w-16 bg-muted rounded-full" />
                      <Skeleton className="h-8 w-20 bg-muted rounded-full" />
                      <Skeleton className="h-8 w-16 bg-muted rounded-full" />
                    </div>
                  </div>
                ))
              ) : posts && posts.length > 0 ? (
                posts.map((post: PostWithAuthor) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="bg-card rounded-xl shadow-sm border border-border/50 p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-3">
                    No posts yet
                  </h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                    Be the first to share something with the community! Ask questions, share code snippets, or start a discussion.
                  </p>
                  <Button 
                    onClick={handleCreatePost}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transition-all shadow-lg hover:shadow-xl px-8 py-3"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* AI Chatbot Sidebar */}
        {isAuthenticated && isChatbotOpen && (
          <aside className="w-full md:w-96 bg-card/95 backdrop-blur-sm border-l border-border/50 fixed right-0 top-18 bottom-0 overflow-hidden z-40 transform transition-transform duration-300 ease-in-out shadow-xl">
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-purple-600/5">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                  <h3 className="font-semibold text-foreground">AI Assistant</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatbotOpen(false)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  ×
                </Button>
              </div>
              {/* Chatbot Content */}
              <div className="flex-1 overflow-hidden">
                <AIChatbot />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}