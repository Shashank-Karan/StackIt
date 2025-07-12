import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationDropdown } from './notification-dropdown';
import { Search, Plus, Bot, LogOut, User, Settings, ChevronDown } from 'lucide-react';

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
    <header className="bg-card/80 backdrop-blur-lg border-b border-border/30 sticky top-0 z-50 shadow-lg shadow-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-2 group cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-primary transition-all">
                  StackIt
                </h1>
              </div>
            </Link>
            
            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center space-x-1">
                <Link href="/">
                  <Button 
                    variant={location === '/' ? 'default' : 'ghost'}
                    size="sm"
                    className={`font-medium transition-all ${
                      location === '/' 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    Questions
                  </Button>
                </Link>
                <Link href="/community">
                  <Button 
                    variant={location === '/community' ? 'default' : 'ghost'}
                    size="sm"
                    className={`font-medium transition-all ${
                      location === '/community' 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    Community
                  </Button>
                </Link>
              </nav>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <div className="relative">
              <Input
                type="text"
                placeholder={location === '/community' ? "Search posts..." : "Search questions..."}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 bg-muted/30 border-border/30 focus:bg-background/80 focus:border-primary/50 transition-all rounded-xl shadow-sm focus:shadow-md backdrop-blur-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* AI Chatbot Button */}
                {onOpenChatbot && (
                  <Button 
                    onClick={onOpenChatbot} 
                    variant="outline" 
                    size="sm"
                    className="hidden sm:flex bg-gradient-to-r from-primary/5 to-purple-600/5 border-primary/20 hover:from-primary/10 hover:to-purple-600/10 transition-all shadow-sm hover:shadow-md"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    AI Assistant
                  </Button>
                )}

                {/* Ask Question Button */}
                <Button 
                  onClick={onAskQuestion} 
                  className="hidden sm:flex bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ask Question
                </Button>

                {/* Notification Bell */}
                <NotificationDropdown />

                {/* User Profile Dropdown */}
                <div className="pl-3 border-l border-border/50">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-3 p-2 hover:bg-muted/50 transition-all rounded-xl">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                          <AvatarImage src={user?.profileImageUrl} alt={displayName} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:block text-left">
                          <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium text-foreground">{displayName}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50" />
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => window.location.href = '/api/logout'}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/api/login'}
                  className="border-primary/30 text-primary hover:bg-primary/10 transition-all"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transition-all shadow-lg hover:shadow-xl hover:scale-105 px-6"
                >
                  Get Started
                </Button>
              </div>
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
              className="pl-10 pr-4 bg-muted/30 border-border/30 focus:bg-background focus:border-primary/50 transition-all rounded-xl shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          </div>
          
          {/* Mobile Action Buttons */}
          {isAuthenticated && (
            <div className="flex gap-2 mt-3">
              {onOpenChatbot && (
                <Button 
                  onClick={onOpenChatbot} 
                  variant="outline" 
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-primary/5 to-purple-600/5 border-primary/20 hover:from-primary/10 hover:to-purple-600/10"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  AI Assistant
                </Button>
              )}
              <Button 
                onClick={onAskQuestion} 
                size="sm"
                className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ask Question
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
