import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TiptapEditor } from '@/components/ui/tiptap-editor';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { insertAnswerSchema } from '@shared/schema';

const answerFormSchema = insertAnswerSchema.omit({ questionId: true, authorId: true });

type AnswerFormData = z.infer<typeof answerFormSchema>;

interface AnswerFormProps {
  questionId: number;
  onSuccess: () => void;
}

export function AnswerForm({ questionId, onSuccess }: AnswerFormProps) {
  const { toast } = useToast();

  const form = useForm<AnswerFormData>({
    resolver: zodResolver(answerFormSchema),
    defaultValues: {
      content: '',
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: async (data: AnswerFormData) => {
      await apiRequest('POST', `/api/questions/${questionId}/answers`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Answer posted successfully",
      });
      form.reset();
      onSuccess();
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
        description: "Failed to post answer",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AnswerFormData) => {
    createAnswerMutation.mutate(data);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Answer</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Answer Content</FormLabel>
                <FormControl>
                  <TiptapEditor
                    content={field.value}
                    onUpdate={field.onChange}
                    placeholder="Write your answer here..."
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end">
            <Button 
              type="submit" 
              disabled={createAnswerMutation.isPending}
            >
              {createAnswerMutation.isPending ? 'Posting...' : 'Post Answer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
