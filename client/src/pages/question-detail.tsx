import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Eye, MessageCircle, ThumbsUp, Check, Bot } from 'lucide-react';
import { VotingButtons } from '@/components/questions/voting-buttons';
import { AnswerForm } from '@/components/questions/answer-form';
import { AskQuestionModal } from '@/components/questions/ask-question-modal';
import { AIChatbot } from '@/components/ai/ai-chatbot';
import { Header } from '@/components/layout/header';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { QuestionWithAuthor, AnswerWithAuthor } from '@shared/schema';

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch question details
  const { 
    data: question, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: [`/api/questions/${id}`],
    enabled: !!id,
    retry: false,
    staleTime: 0,
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: async (answerId: number) => {
      await apiRequest('POST', `/api/questions/${question!.id}/answers/${answerId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}`] });
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

  const handleAnswerSuccess = () => {
    setShowAnswerForm(false);
    queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}`] });
  };

  const handleAskQuestion = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to ask a question",
        variant: "destructive",
      });
      return;
    }
    setIsAskModalOpen(true);
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onAskQuestion={handleAskQuestion}
          onOpenChatbot={() => setIsChatbotOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onAskQuestion={handleAskQuestion}
          onOpenChatbot={() => setIsChatbotOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Question Not Found</h1>
            <p className="text-gray-600 mb-4">The question you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const authorName = question.author.firstName && question.author.lastName
    ? `${question.author.firstName} ${question.author.lastName}`
    : question.author.email || 'Anonymous';

  const authorInitials = question.author.firstName && question.author.lastName
    ? `${question.author.firstName[0]}${question.author.lastName[0]}`
    : question.author.email?.[0].toUpperCase() || 'A';

  const isQuestionAuthor = user?.id === question.authorId;

  const handleAcceptAnswer = (answerId: number) => {
    acceptAnswerMutation.mutate(answerId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAskQuestion={handleAskQuestion}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        searchQuery=""
        onSearchChange={() => {}}
      />
      
      <div className="flex">
        <main className={`flex-1 px-4 sm:px-6 lg:px-8 py-8 ${isAuthenticated ? 'mr-96' : 'max-w-4xl mx-auto'}`}>
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Button>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {/* Voting Buttons */}
              <VotingButtons
                itemType="question"
                itemId={question.id}
                votes={question.votes || 0}
                onVoteSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
                  queryClient.invalidateQueries({ queryKey: [`/api/questions/${question.id}`] });
                }}
              />

              {/* Question Content */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h1>
                
                {/* Question Description */}
                <div 
                  className="prose max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: question.description }}
                />

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Question Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{question.viewCount} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{question.answers?.length || 0} answers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{question.voteScore} votes</span>
                  </div>
                </div>

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
        </div>

        {/* Answers Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {question.answers?.length || 0} Answer{(question.answers?.length || 0) !== 1 ? 's' : ''}
              </h2>
              {isAuthenticated && (
                <Button onClick={() => setShowAnswerForm(!showAnswerForm)}>
                  {showAnswerForm ? 'Cancel' : 'Write Answer'}
                </Button>
              )}
            </div>

            {/* Answer Form */}
            {showAnswerForm && (
              <div className="mb-8">
                <AnswerForm
                  questionId={question.id}
                  onSuccess={handleAnswerSuccess}
                />
              </div>
            )}

            {/* Answers List */}
            <div className="space-y-6">
              {question.answers?.map((answer: AnswerWithAuthor) => {
                const answerAuthorName = answer.author.firstName && answer.author.lastName
                  ? `${answer.author.firstName} ${answer.author.lastName}`
                  : answer.author.email || 'Anonymous';

                const answerAuthorInitials = answer.author.firstName && answer.author.lastName
                  ? `${answer.author.firstName[0]}${answer.author.lastName[0]}`
                  : answer.author.email?.[0].toUpperCase() || 'A';

                return (
                  <div key={answer.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start space-x-4">
                      {/* Voting Buttons */}
                      <VotingButtons
                        itemType="answer"
                        itemId={answer.id}
                        votes={answer.votes || 0}
                        onVoteSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
                          queryClient.invalidateQueries({ queryKey: [`/api/questions/${question.id}`] });
                        }}
                      />

                      {/* Answer Content */}
                      <div className="flex-1">
                        <div 
                          className="prose max-w-none mb-4"
                          dangerouslySetInnerHTML={{ __html: answer.content }}
                        />

                        {/* Answer Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={answer.author.profileImageUrl} alt={answerAuthorName} />
                              <AvatarFallback className="text-xs">{answerAuthorInitials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm text-gray-700">{answerAuthorName}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{formatTimeAgo(answer.createdAt)}</span>
                          </div>
                          
                          {/* Accept Answer Button */}
                          {isQuestionAuthor && !answer.isAccepted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcceptAnswer(answer.id)}
                              disabled={acceptAnswerMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept Answer
                            </Button>
                          )}
                          
                          {/* Accepted Badge */}
                          {answer.isAccepted && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Accepted
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* No Answers Message */}
            {(!question.answers || question.answers.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No answers yet</p>
                <p>Be the first to answer this question!</p>
                {isAuthenticated && !showAnswerForm && (
                  <Button onClick={() => setShowAnswerForm(true)} className="mt-4">
                    Write the First Answer
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        </main>

        {/* AI Chatbot Sidebar */}
        {isAuthenticated && (
          <aside className="w-96 bg-white border-l border-gray-200 fixed right-0 top-16 bottom-0 overflow-hidden">
            <div className="h-full">
              <AIChatbot />
            </div>
          </aside>
        )}
      </div>

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
      />
    </div>
  );
}