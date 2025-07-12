import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { QuestionCard } from '@/components/questions/question-card';
import { AskQuestionModal } from '@/components/questions/ask-question-modal';
import { AIChatbot } from '@/components/ai/ai-chatbot';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { ChevronDown, Plus, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { QuestionWithAuthor } from '@shared/schema';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [filter, setFilter] = useState<'newest' | 'unanswered' | ''>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const itemsPerPage = 10;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch questions
  const { 
    data: questions = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/questions', {
      search: debouncedSearch || undefined,
      filter: filter || undefined,
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
    }],
    retry: false,
  });



  // Handle errors
  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  const handleQuestionClick = (question: QuestionWithAuthor) => {
    navigate(`/questions/${question.id}`);
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

  const handleFilterChange = (newFilter: 'newest' | 'unanswered' | '') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(questions.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onAskQuestion={handleAskQuestion}
        onOpenChatbot={() => setIsChatbotOpen(!isChatbotOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${isAuthenticated && isChatbotOpen ? 'md:mr-96' : 'max-w-7xl mx-auto'}`}>
        <div className="space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button onClick={handleAskQuestion} className="sm:hidden">
                <Plus className="h-4 w-4 mr-2" />
                Ask Question
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Button
                variant={filter === 'newest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('newest')}
              >
                Newest
              </Button>
              <Button
                variant={filter === 'unanswered' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('unanswered')}
              >
                Unanswered
              </Button>
              <Button
                variant={filter === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('')}
              >
                All
              </Button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 space-y-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {debouncedSearch ? (
                    <p>No questions found matching "{debouncedSearch}"</p>
                  ) : filter === 'unanswered' ? (
                    <p>No unanswered questions found</p>
                  ) : (
                    <p>No questions yet. Be the first to ask!</p>
                  )}
                </div>
                {isAuthenticated && (
                  <Button onClick={handleAskQuestion} className="mt-4">
                    Ask the First Question
                  </Button>
                )}
              </div>
            ) : (
              questions.map((question: QuestionWithAuthor) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onClick={() => handleQuestionClick(question)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {questions.length > 0 && totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
                  className="h-8 w-8 p-0"
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

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
      />
    </div>
  );
}
