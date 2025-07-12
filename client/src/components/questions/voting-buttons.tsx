import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  onVoteSuccess: () => void;
}

export function VotingButtons({ itemId, itemType, votes, onVoteSuccess }: VotingButtonsProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const voteMutation = useMutation({
    mutationFn: async (voteType: 'up' | 'down') => {
      const voteData = {
        voteType,
        [itemType === 'question' ? 'questionId' : 'answerId']: itemId,
      };
      await apiRequest('POST', '/api/votes', voteData);
    },
    onSuccess: () => {
      onVoteSuccess();
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
    <div className="flex flex-col items-center space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('up')}
        disabled={voteMutation.isPending}
        className="p-2 hover:bg-green-100 hover:text-green-700"
      >
        <ChevronUp className="h-6 w-6" />
      </Button>
      
      <span className="text-lg font-semibold text-gray-900">
        {votes}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('down')}
        disabled={voteMutation.isPending}
        className="p-2 hover:bg-red-100 hover:text-red-700"
      >
        <ChevronDown className="h-6 w-6" />
      </Button>
    </div>
  );
}
