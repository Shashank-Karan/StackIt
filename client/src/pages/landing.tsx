import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Users, BookOpen, Star } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">StackIt</h1>
            </div>
            <Button onClick={() => window.location.href = '/api/login'}>
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Where developers
            <span className="text-primary"> ask & answer</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Join our community of developers to share knowledge, solve problems, and learn from each other.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => window.location.href = '/api/login'}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Ask Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get help from experienced developers by asking detailed questions with code examples.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Share Knowledge</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Answer questions and help other developers solve their programming challenges.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Learn Together</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Discover new solutions and best practices from the community's collective knowledge.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Vote & Accept</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Vote on answers to highlight the best solutions and accept answers that solve your problems.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sample Questions Preview */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Recent Questions
          </h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 text-center">
                    <div className="text-sm font-medium text-gray-900">5</div>
                    <div className="text-xs text-gray-500">votes</div>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className="text-sm font-medium text-gray-900">3</div>
                    <div className="text-xs text-gray-500">answers</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      How to handle async operations in React?
                    </h3>
                    <p className="text-gray-600 mb-3">
                      I'm having trouble understanding how to properly handle asynchronous operations in React components...
                    </p>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                        React
                      </span>
                      <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                        JavaScript
                      </span>
                      <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                        Async
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 text-center">
                    <div className="text-sm font-medium text-gray-900">12</div>
                    <div className="text-xs text-gray-500">votes</div>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className="text-sm font-medium text-gray-900">7</div>
                    <div className="text-xs text-gray-500">answers</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      SQL JOIN vs UNION: When to use which?
                    </h3>
                    <p className="text-gray-600 mb-3">
                      I'm confused about when to use JOIN vs UNION in SQL queries. Can someone explain the difference...
                    </p>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                        SQL
                      </span>
                      <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                        Database
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to join the community?
          </h2>
          <p className="text-gray-600 mb-8">
            Start asking questions, sharing answers, and learning from fellow developers.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Join StackIt Today
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm">
              &copy; 2024 StackIt. Built with ❤️ for developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
