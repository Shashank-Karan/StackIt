import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Users, BookOpen, Star, Sparkles, Code, Trophy, Zap } from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border/30 sticky top-0 z-50 shadow-lg shadow-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-primary transition-all">
                StackIt
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => setShowAuthModal(true)}
                className="border-primary/30 text-primary hover:bg-primary/10 transition-all"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transition-all shadow-lg hover:shadow-xl hover:scale-105 px-6"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background gradients and decorations */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-full blur-3xl animate-slow-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-indigo-600/20 rounded-full blur-3xl animate-slow-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-medium text-primary">Welcome to the Future of Q&A</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-slate-900 via-primary to-purple-600 bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-purple-400">
                Where Developers
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Ask & Answer
              </span>
            </h1>
            
            <p className="mt-6 max-w-3xl mx-auto text-xl text-muted-foreground leading-relaxed">
              Join our vibrant community of developers powered by AI. Share knowledge, solve complex problems, 
              and accelerate your learning with intelligent assistance and peer collaboration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                size="lg" 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all px-8 py-4 text-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Your Journey
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => setShowAuthModal(true)}
                className="border-2 border-primary/30 text-primary hover:bg-primary/5 px-8 py-4 text-lg backdrop-blur-sm"
              >
                <Code className="w-5 h-5 mr-2" />
                Explore Community
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex justify-center items-center space-x-8 pt-12 text-sm text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div>Questions Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">5K+</div>
                <div>Active Developers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">AI</div>
                <div>Powered Support</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative py-24 bg-gradient-to-b from-transparent to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Powered by Community & AI
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of developer collaboration with intelligent features designed for modern coding challenges.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-2xl group-hover:scale-110 transition-transform duration-300 mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">Ask Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Get instant help from AI and experienced developers with rich text editor, code syntax highlighting, and smart suggestions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-2xl group-hover:scale-110 transition-transform duration-300 mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">Share Knowledge</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Answer questions and build your reputation in the community. Earn badges and recognition for your contributions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-2xl group-hover:scale-110 transition-transform duration-300 mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Get intelligent code suggestions, debugging help, and explanations powered by advanced AI technology.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-2xl group-hover:scale-110 transition-transform duration-300 mb-4">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">Vote & Accept</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  Vote on the best answers and solutions. Community-driven quality ensures you get the most reliable help.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sample Questions Preview */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Trending Questions
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what the community is discussing right now
            </p>
          </div>
          
          <div className="space-y-6">
            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-0 bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-xl">
                      <div className="text-lg font-bold text-primary">5</div>
                      <div className="text-xs text-muted-foreground">votes</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl">
                      <div className="text-lg font-bold text-green-600">3</div>
                      <div className="text-xs text-muted-foreground">answers</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      How to handle async operations in React with TypeScript?
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      I'm building a React app with TypeScript and struggling with properly typing async operations. 
                      The AI assistant suggested using Promise generics, but I'm getting type errors...
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 rounded-full border border-blue-200/30">
                        React
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 text-yellow-600 rounded-full border border-yellow-200/30">
                        TypeScript
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500/10 to-purple-600/10 text-purple-600 rounded-full border border-purple-200/30">
                        Async
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Sparkles className="w-4 h-4 mr-1 text-primary" />
                    AI Assisted
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-0 bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-xl">
                      <div className="text-lg font-bold text-primary">12</div>
                      <div className="text-xs text-muted-foreground">votes</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl">
                      <div className="text-lg font-bold text-green-600">7</div>
                      <div className="text-xs text-muted-foreground">answers</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      PostgreSQL Performance: When to use indexes vs partitioning?
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Working on a large-scale application with millions of records. The AI chatbot explained indexing strategies, 
                      but I'm curious about real-world experiences with table partitioning...
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 rounded-full border border-blue-200/30">
                        PostgreSQL
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-600 rounded-full border border-green-200/30">
                        Performance
                      </span>
                      <span className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-600 rounded-full border border-orange-200/30">
                        Database
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Trophy className="w-4 h-4 mr-1 text-primary" />
                    Top Answer
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-blue-500/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Ready to Join the Revolution?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Start asking smarter questions, sharing expert knowledge, and building the future of developer collaboration. 
              Your next breakthrough is just one question away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                size="lg"
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all px-10 py-4 text-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Join StackIt Today
              </Button>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="mr-2">✨ Free forever</span>
                <span className="mr-2">🚀 AI-powered</span>
                <span>🏆 Community-driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                StackIt
              </h3>
            </div>
            <p className="text-slate-400">
              Empowering developers worldwide with AI-assisted knowledge sharing
            </p>
            <p className="text-sm text-slate-500">
              &copy; 2025 StackIt. Built with ❤️ for the developer community.
            </p>
          </div>
        </div>
      </footer>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
