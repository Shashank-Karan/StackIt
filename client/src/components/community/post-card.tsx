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
    <Card className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10 border-2 border-gray-200">
            <AvatarFallback className="bg-blue-600 text-white text-sm">
              {getInitials(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{post.author.email}</p>
            <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
          </div>
          {post.language && (
            <Badge variant="secondary" className="bg-blue-600 text-white">
              {post.language}
            </Badge>
          )}
        </div>

        {/* Post Content */}
        {post.title && (
          <h3 className="text-lg font-semibold mb-2 text-gray-900">{post.title}</h3>
        )}
        
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

        {/* Code Snippet */}
        {post.codeSnippet && (
          <div className="mb-4">
            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-200">
              {/* Code Header */}
              <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  {post.language && (
                    <span className="text-gray-400 text-sm ml-2">{post.language}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCode}
                  className="text-gray-400 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {/* Code Content */}
              <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
                <code>{post.codeSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className="text-gray-600 hover:text-red-500 hover:bg-red-50"
          >
            <Heart className="h-4 w-4 mr-1" />
            {post.likes || 0}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {post._count?.comments || 0}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <Share className="h-4 w-4 mr-1" />
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