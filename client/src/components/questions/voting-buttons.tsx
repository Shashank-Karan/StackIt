import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';

interface VotingButtonsProps {
  itemId: number;
  itemType: 'question' | 'answer';
  votes: number;
  onVoteSuccess?: () => void;
}

export function VotingButtons({ itemId, itemType, votes, onVoteSuccess }: VotingButtonsProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async (voteType: 'up' | 'down') => {
      const voteData = {
        voteType,
        questionId: itemType === 'question' ? itemId : null,
        answerId: itemType === 'answer' ? itemId : null,
      };
      const response = await apiRequest('POST', '/api/votes', voteData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant queries to ensure real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${itemId}`] });
      
      // Call the success callback if provided
      if (onVoteSuccess) {
        onVoteSuccess();
      }
      
      toast({
        title: "Success",
        description: "Vote recorded successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to vote",
        variant: "destructive",
      });
    },
  });

  const handleVote = (voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to vote",
        variant: "destructive",
      });
      return;
    }
    
    voteMutation.mutate(voteType);
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('up')}
        disabled={voteMutation.isPending}
        className="p-2 hover:bg-green-100 hover:text-green-700 transition-colors"
      >
        <ChevronUp className="h-6 w-6" />
      </Button>
      
      <div className="text-center px-3 py-1 bg-gray-100 rounded-md min-w-[40px]">
        <span className="text-lg font-bold text-gray-900">
          {votes}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('down')}
        disabled={voteMutation.isPending}
        className="p-2 hover:bg-red-100 hover:text-red-700 transition-colors"
      >
        <ChevronDown className="h-6 w-6" />
      </Button>
    </div>
  );
}
