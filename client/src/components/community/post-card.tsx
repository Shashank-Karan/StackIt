import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { queryClient } from '@/lib/queryClient';
import type { PostWithAuthor } from '@shared/schema';

interface PostCardProps {
  post: PostWithAuthor;
}

export function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to like post');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyCode = () => {
    if (post.codeSnippet) {
      navigator.clipboard.writeText(post.codeSnippet);
      toast({
        title: "Copied!",
        description: "Code snippet copied to clipboard",
      });
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className="bg-card rounded-xl shadow-sm border border-border/50 hover:shadow-lg hover:border-border transition-all duration-300 group">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-semibold">
              {getInitials(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{post.author.email}</p>
            <p className="text-sm text-muted-foreground">{formatTimeAgo(post.createdAt)}</p>
          </div>
          {post.language && (
            <Badge variant="secondary" className="bg-gradient-to-r from-primary to-purple-600 text-white border-0 shadow-sm">
              {post.language}
            </Badge>
          )}
        </div>

        {/* Post Content */}
        {post.title && (
          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        )}
        
        <p className="text-muted-foreground mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        
        {/* Media Attachments */}
        {((post.imageUrls && post.imageUrls.length > 0) || (post.videoUrls && post.videoUrls.length > 0)) && (
          <div className="mb-4 space-y-4">
            {/* Images */}
            {post.imageUrls && post.imageUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {post.imageUrls.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={imageUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-border/50 shadow-sm group-hover:shadow-md transition-all cursor-pointer"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-all" />
                  </div>
                ))}
              </div>
            )}
            
            {/* Videos */}
            {post.videoUrls && post.videoUrls.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.videoUrls.map((videoUrl, index) => (
                  <div key={index} className="relative">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-64 rounded-lg border border-border/50 shadow-sm"
                      style={{ objectFit: 'cover' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Code Snippet */}
        {post.codeSnippet && (
          <div className="mb-4">
            <div className="bg-accent rounded-xl overflow-hidden border border-border/50 shadow-sm">
              {/* Code Header */}
              <div className="flex items-center justify-between bg-accent/50 px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  {post.language && (
                    <Badge variant="outline" className="text-xs bg-background/50">
                      {post.language}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCode}
                  className="text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {/* Code Content */}
              <pre className="p-4 text-sm text-accent-foreground overflow-x-auto scrollbar-thin">
                <code>{post.codeSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
          >
            <Heart className="h-4 w-4 mr-1.5" />
            {post._count?.likes || post.likes?.length || 0}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            {post._count?.comments || 0}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950 transition-all"
          >
            <Share className="h-4 w-4 mr-1.5" />
            Share
          </Button>
        </div>

        {/* Comments Section (if expanded) */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-3">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 border border-gray-200">
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials(comment.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {comment.author.name}
                        </p>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}