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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access the Community</h1>
          <p className="text-gray-600">You need to be authenticated to view and create community posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Developer Community</h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Share code snippets, get feedback, and learn from other developers worldwide.
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Create Post Card */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Post</h2>
                    <div 
                      className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      onClick={handleCreatePost}
                    >
                      <textarea
                        placeholder="What's on your mind? Share a code snippet, ask a question..."
                        className="w-full h-20 bg-transparent border-none resize-none text-gray-700 placeholder-gray-500 focus:outline-none"
                        readOnly
                      />
                    </div>
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        placeholder="Optional: Add code snippet..."
                        className="w-full p-3 rounded-lg border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        readOnly
                        onClick={handleCreatePost}
                      />
                      <input
                        type="text"
                        placeholder="Language (Optional)"
                        className="w-full p-3 rounded-lg border border-gray-300 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        readOnly
                        onClick={handleCreatePost}
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          onClick={handleCreatePost}
                        >
                          📷 Image
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          onClick={handleCreatePost}
                        >
                          🎥 Video
                        </Button>
                      </div>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleCreatePost}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Post
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32 bg-gray-200" />
                            <Skeleton className="h-3 w-20 bg-gray-200" />
                          </div>
                        </div>
                        <Skeleton className="h-20 w-full mb-4 bg-gray-200" />
                        <Skeleton className="h-32 w-full bg-gray-200" />
                      </div>
                    ))
                  ) : posts && posts.length > 0 ? (
                    posts.map((post: PostWithAuthor) => (
                      <PostCard key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Be the first to share something with the community! Ask questions, share code snippets, or start a discussion.
                      </p>
                      <Button 
                        onClick={handleCreatePost}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                        size="lg"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create First Post
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* AI Chatbot Sidebar */}
        {isAuthenticated && isChatbotOpen && (
          <aside className="w-full md:w-96 bg-white border-l border-gray-200 fixed right-0 top-16 bottom-0 overflow-hidden z-40 transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatbotOpen(false)}
                  className="h-8 w-8 p-0 text-gray-500"
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