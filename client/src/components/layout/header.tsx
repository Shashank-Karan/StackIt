import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from './notification-dropdown';
import { Search, Plus, Bot } from 'lucide-react';

interface HeaderProps {
  onAskQuestion: () => void;
  onOpenChatbot?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({ onAskQuestion, onOpenChatbot, searchQuery, onSearchChange }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'Anonymous';

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0].toUpperCase() || 'A';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 hover:text-primary cursor-pointer">
                StackIt
              </h1>
            </Link>
            
            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === '/' ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  Questions
                </Link>
                <Link 
                  href="/community" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === '/community' ? 'text-primary' : 'text-gray-600'
                  }`}
                >
                  Community
                </Link>
              </nav>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8 hidden md:block">
            <div className="relative">
              <Input
                type="text"
                placeholder={location === '/community' ? "Search posts..." : "Search questions..."}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* AI Chatbot Button */}
                {onOpenChatbot && (
                  <Button 
                    onClick={onOpenChatbot} 
                    variant="outline" 
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI Assistant
                  </Button>
                )}

                {/* Ask Question Button */}
                <Button onClick={onAskQuestion} className="hidden sm:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>

                {/* Notification Bell */}
                <NotificationDropdown />

                {/* User Profile */}
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {displayName}
                  </span>
                </div>
              </>
            ) : (
              <Button onClick={() => window.location.href = '/api/login'}>
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Input
              type="text"
              placeholder={location === '/community' ? "Search posts..." : "Search questions..."}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
