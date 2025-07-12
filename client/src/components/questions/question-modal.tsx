import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VotingButtons } from './voting-buttons';
import { AnswerForm } from './answer-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Check, Eye, MessageCircle, ThumbsUp } from 'lucide-react';
import type { QuestionWithAuthor, AnswerWithAuthor } from '@shared/schema';

interface QuestionModalProps {
  question: QuestionWithAuthor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuestionModal({ question, isOpen, onClose }: QuestionModalProps) {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acceptAnswerMutation = useMutation({
    mutationFn: async (answerId: number) => {
      await apiRequest('POST', `/api/questions/${question!.id}/answers/${answerId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions', question!.id] });
      toast({
        title: "Success",
        description: "Answer accepted successfully",
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
        description: "Failed to accept answer",
        variant: "destructive",
      });
    },
  });

  if (!question) return null;

  const authorName = question.author.firstName && question.author.lastName
    ? `${question.author.firstName} ${question.author.lastName}`
    : question.author.email || 'Anonymous';

  const authorInitials = question.author.firstName && question.author.lastName
    ? `${question.author.firstName[0]}${question.author.lastName[0]}`
    : question.author.email?.[0].toUpperCase() || 'A';

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const isQuestionAuthor = user?.id === question.authorId;

  const handleAcceptAnswer = (answerId: number) => {
    acceptAnswerMutation.mutate(answerId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-left">Question Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Content */}
          <div className="border-b pb-6">
            <div className="flex items-start space-x-4">
              {/* Question Voting */}
              <VotingButtons
                itemId={question.id}
                itemType="question"
                votes={questionDetail?.votes || question.votes || 0}
                onVoteSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
                  queryClient.invalidateQueries({ queryKey: [`/api/questions/${question.id}`] });
                }}
              />

              {/* Question Details */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {question.title}
                </h1>

                {/* Question Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{questionDetail?.votes || question.votes || 0} votes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{questionDetail?.answers?.length || question.answers?.length || 0} answers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{questionDetail?.viewCount || question.viewCount || 0} views</span>
                  </div>
                </div>

                {/* Question Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Question Description */}
                <div 
                  className="prose max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: question.description }}
                />

                {/* Question Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={question.author.profileImageUrl} alt={authorName} />
                      <AvatarFallback>{authorInitials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{authorName}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(question.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Answers Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {questionDetail?.answers?.length || question.answers?.length || 0} Answer{(questionDetail?.answers?.length || question.answers?.length || 0) !== 1 ? 's' : ''}
              </h3>
              {isAuthenticated && (
                <Button onClick={() => setShowAnswerForm(!showAnswerForm)}>
                  {showAnswerForm ? 'Cancel' : 'Write Answer'}
                </Button>
              )}
            </div>

            {/* Answer Form */}
            {showAnswerForm && (
              <div className="mb-6">
                <AnswerForm
                  questionId={question.id}
                  onSuccess={() => {
                    setShowAnswerForm(false);
                    queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
                    queryClient.invalidateQueries({ queryKey: [`/api/questions/${question.id}`] });
                  }}
                />
              </div>
            )}

            {/* Answers List */}
            <div className="space-y-6">
              {(questionDetail?.answers || question.answers || []).map((answer: AnswerWithAuthor) => {
                const answerAuthorName = answer.author.firstName && answer.author.lastName
                  ? `${answer.author.firstName} ${answer.author.lastName}`
                  : answer.author.email || 'Anonymous';

                const answerAuthorInitials = answer.author.firstName && answer.author.lastName
                  ? `${answer.author.firstName[0]}${answer.author.lastName[0]}`
                  : answer.author.email?.[0].toUpperCase() || 'A';

                return (
                  <div key={answer.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      {/* Answer Voting */}
                      <div className="flex flex-col items-center space-y-2">
                        <VotingButtons
                          itemId={answer.id}
                          itemType="answer"
                          votes={answer.votes || 0}
                          onVoteSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
                            queryClient.invalidateQueries({ queryKey: [`/api/questions/${question.id}`] });
                          }}
                        />
                        
                        {/* Accept Answer Button */}
                        {isQuestionAuthor && !answer.isAccepted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcceptAnswer(answer.id)}
                            disabled={acceptAnswerMutation.isPending}
                            className="text-green-600 hover:text-green-700 border-green-600 hover:border-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Accepted Badge */}
                        {answer.isAccepted && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Accepted
                          </Badge>
                        )}
                      </div>

                      {/* Answer Content */}
                      <div className="flex-1">
                        <div 
                          className="prose max-w-none mb-4"
                          dangerouslySetInnerHTML={{ __html: answer.content }}
                        />

                        {/* Answer Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={answer.author.profileImageUrl} alt={answerAuthorName} />
                              <AvatarFallback className="text-xs">{answerAuthorInitials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{answerAuthorName}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(answer.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* No Answers Message */}
            {question.answers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No answers yet. Be the first to answer!
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
