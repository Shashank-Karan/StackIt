import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { TiptapEditor } from '@/components/ui/tiptap-editor';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { X, HelpCircle, Lightbulb, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { insertQuestionSchema } from '@shared/schema';

const askQuestionSchema = insertQuestionSchema.extend({
  tagsInput: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
}).omit({
  authorId: true, // This will be added by the backend
}).refine((data) => {
  return data.title.length >= 10;
}, {
  message: "Title must be at least 10 characters long",
  path: ["title"],
}).refine((data) => {
  return data.description.length >= 20;
}, {
  message: "Description must be at least 20 characters long",
  path: ["description"],
});

type AskQuestionFormData = z.infer<typeof askQuestionSchema>;

const POPULAR_TAGS = [
  'javascript', 'python', 'react', 'nodejs', 'css', 'html', 'typescript', 
  'sql', 'java', 'git', 'api', 'database', 'debugging', 'performance',
  'security', 'testing', 'mobile', 'web', 'backend', 'frontend'
];

const QUESTION_CATEGORIES = [
  { value: 'general', label: 'General Programming' },
  { value: 'debugging', label: 'Debugging Help' },
  { value: 'best-practices', label: 'Best Practices' },
  { value: 'architecture', label: 'Architecture & Design' },
  { value: 'performance', label: 'Performance Optimization' },
  { value: 'tutorial', label: 'Tutorial Request' },
  { value: 'tool-recommendation', label: 'Tool Recommendation' },
  { value: 'career', label: 'Career Advice' },
];

const QUESTION_TIPS = [
  "Be specific about what you're trying to accomplish",
  "Include relevant code snippets or error messages",
  "Mention what you've already tried",
  "Add context about your environment (OS, language version, etc.)",
  "Use clear, descriptive titles that others can find easily",
];

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AskQuestionModal({ isOpen, onClose }: AskQuestionModalProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [similarQuestions, setSimilarQuestions] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AskQuestionFormData>({
    resolver: zodResolver(askQuestionSchema),
    defaultValues: {
      title: '',
      description: '',
      tags: [],
      tagsInput: '',
      category: '',
      difficulty: 'beginner',
      urgency: 'medium',
    },
  });

  // Watch title changes to suggest similar questions
  const titleValue = form.watch('title');
  
  useEffect(() => {
    if (titleValue && titleValue.length > 10) {
      // Simulate API call for similar questions
      const timer = setTimeout(() => {
        // This would be replaced with actual API call
        setSimilarQuestions([]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [titleValue]);

  // Calculate completion percentage
  const formValues = form.watch();
  const completionPercentage = Math.round(
    ((formValues.title ? 25 : 0) + 
     (formValues.description ? 35 : 0) + 
     (tags.length > 0 ? 25 : 0) + 
     (formValues.category ? 15 : 0)) 
  );

  const createQuestionMutation = useMutation({
    mutationFn: async (data: AskQuestionFormData) => {
      const questionData = {
        title: data.title,
        description: data.description,
        tags: tags,
      };
      console.log('Submitting question:', questionData);
      const response = await apiRequest('POST', '/api/questions', questionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({
        title: "Success",
        description: "Question posted successfully",
      });
      form.reset();
      setTags([]);
      setTagInput('');
      onClose();
    },
    onError: (error) => {
      console.error('Error creating question:', error);
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
        description: "Failed to post question",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AskQuestionFormData) => {
    console.log('Form data:', data);
    console.log('Form errors:', form.formState.errors);
    createQuestionMutation.mutate(data);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || tagInput).trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleClose = () => {
    form.reset();
    setTags([]);
    setTagInput('');
    setSimilarQuestions([]);
    setShowPreview(false);
    setShowTips(true);
    onClose();
  };

  const getFormValidationIcon = () => {
    if (completionPercentage < 50) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (completionPercentage < 80) return <HelpCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-card via-card to-muted/30 border-0 shadow-2xl">
        <DialogHeader className="border-b border-border/30 pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Ask a Question
            </DialogTitle>
            <div className="flex items-center space-x-3">
              {getFormValidationIcon()}
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  {completionPercentage}% Complete
                </div>
                <div className="text-xs text-muted-foreground">
                  {completionPercentage < 60 ? 'Keep going!' : 'Almost ready!'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={completionPercentage} className="h-3 bg-muted/50" />
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                {/* Question Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg font-semibold flex items-center justify-between">
                        <span className="flex items-center">
                          Title <span className="text-destructive ml-1">*</span>
                        </span>
                        <span className="text-sm font-normal text-muted-foreground">
                          {field.value?.length || 0}/200
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="What's your programming question? Be specific and descriptive."
                          {...field}
                          maxLength={200}
                          className="text-lg h-12 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all rounded-lg"
                        />
                      </FormControl>
                      <FormDescription className="text-sm text-muted-foreground">
                        Write a clear, concise title that summarizes your question
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category and Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-medium">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all rounded-lg">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {QUESTION_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base font-medium">Difficulty Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all rounded-lg">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Beginner
                              </div>
                            </SelectItem>
                            <SelectItem value="intermediate">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                Intermediate
                              </div>
                            </SelectItem>
                            <SelectItem value="advanced">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                Advanced
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Question Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-lg font-semibold flex items-center">
                          Description <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="border-border/50 hover:bg-muted/50 transition-all"
                          >
                            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                            {showPreview ? 'Edit' : 'Preview'}
                          </Button>
                        </div>
                      </div>
                      <FormControl>
                        {showPreview ? (
                          <Card className="min-h-[200px] p-6 bg-background/50 border-border/50 rounded-lg">
                            <div 
                              className="prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{ __html: field.value || '<p class="text-muted-foreground italic">No content to preview</p>' }}
                            />
                          </Card>
                        ) : (
                          <div className="border border-border/50 rounded-lg bg-background/50 focus-within:border-primary/50 transition-all">
                            <TiptapEditor
                              content={field.value}
                              onUpdate={field.onChange}
                              placeholder="Describe your question in detail. Include any relevant code, error messages, or examples. Use the formatting tools to make your question clear and easy to read."
                            />
                          </div>
                        )}
                      </FormControl>
                      <FormDescription className="text-sm text-muted-foreground">
                        Provide as much detail as possible. Include code snippets, error messages, and what you've already tried.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">
                      Tags ({tags.length}/5)
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      Help others find your question
                    </span>
                  </div>
                  
                  {/* Selected Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} className="px-3 py-1.5 text-sm bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-primary/70 hover:text-primary transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Tag Input */}
                  <div>
                    <Input
                      placeholder="Add tags (e.g., javascript, react, node.js) - Press Enter to add"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      onBlur={() => addTag()}
                      disabled={tags.length >= 5}
                      className="h-11 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all rounded-lg"
                    />
                  </div>

                  {/* Popular Tags */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Popular tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_TAGS.filter(tag => !tags.includes(tag)).slice(0, 12).map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTag(tag)}
                          disabled={tags.length >= 5}
                          className="text-xs h-8 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <Separator className="my-8" />
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleClose}
                      className="px-6 border-border/50 hover:bg-muted/50 transition-all"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createQuestionMutation.isPending || completionPercentage < 60}
                      className="px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                      {createQuestionMutation.isPending ? 'Posting...' : 'Post Question'}
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <div className="font-medium">
                      {completionPercentage < 60 ? 'Complete more fields to post' : 'Ready to post!'}
                    </div>
                    <div className="text-xs">
                      {completionPercentage < 60 ? `${60 - completionPercentage}% more needed` : '✨ All set!'}
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Writing Tips */}
            <Card className="bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center text-foreground">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                    Writing Tips
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTips(!showTips)}
                    className="h-8 w-8 p-0 hover:bg-muted/50"
                  >
                    {showTips ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {showTips && (
                  <ul className="text-sm text-muted-foreground space-y-3">
                    {QUESTION_TIPS.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Question Quality */}
            <Card className="bg-gradient-to-br from-background to-muted/20 border-border/50 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Question Quality
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">Title</span>
                    <div className={`flex items-center ${titleValue?.length >= 10 ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="text-xs mr-1">
                        {titleValue?.length >= 10 ? 'Good' : 'Too short'}
                      </span>
                      {titleValue?.length >= 10 ? '✓' : '✗'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">Description</span>
                    <div className={`flex items-center ${form.watch('description')?.length >= 20 ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="text-xs mr-1">
                        {form.watch('description')?.length >= 20 ? 'Detailed' : 'Add more'}
                      </span>
                      {form.watch('description')?.length >= 20 ? '✓' : '✗'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">Tags</span>
                    <div className={`flex items-center ${tags.length > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      <span className="text-xs mr-1">
                        {tags.length > 0 ? `${tags.length} tag${tags.length > 1 ? 's' : ''}` : 'Add tags'}
                      </span>
                      {tags.length > 0 ? '✓' : '✗'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                    <span className="text-sm font-medium">Category</span>
                    <div className={`flex items-center ${form.watch('category') ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <span className="text-xs mr-1">
                        {form.watch('category') ? 'Selected' : 'Optional'}
                      </span>
                      {form.watch('category') ? '✓' : '○'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/30">
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      {completionPercentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Complete
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
