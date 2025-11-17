'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Sparkles, RefreshCw } from 'lucide-react';
import type { AISetting } from '@/types/ai';

interface PromptSection {
  id: string;
  title: string;
  content: string;
}

// Parse prompt into sections (sections are separated by ### headers)
function parsePromptIntoSections(prompt: string | null | undefined): PromptSection[] {
  if (!prompt) {
    return [
      {
        id: '1',
        title: 'Role',
        content: '',
      },
    ];
  }

  const sections: PromptSection[] = [];
  const lines = prompt.split('\n');
  let currentSection: PromptSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('### ')) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }
      // Start new section
      const title = line.replace('### ', '').trim();
      currentSection = {
        id: Date.now().toString() + Math.random(),
        title,
        content: '',
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  }

  // If no sections found, treat entire prompt as one section
  if (sections.length === 0) {
    return [
      {
        id: '1',
        title: 'System Prompt',
        content: prompt.trim(),
      },
    ];
  }

  return sections;
}

// Combine sections back into full prompt
function combineSectionsIntoPrompt(sections: PromptSection[]): string {
  return sections
    .map((section) => {
      const header = `### ${section.title}`;
      const content = section.content.trim();
      return content ? `${header}\n${content}` : header;
    })
    .join('\n\n');
}

export default function AIInfoPage() {
  const [sections, setSections] = useState<PromptSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Load prompt when user is loaded and is admin
  useEffect(() => {
    if (!authLoading) {
      console.log('AI Info - Auth check:', { user, role: user?.role, authLoading });
      if (!user) {
        console.log('AI Info - No user found, redirecting');
        toast({
          title: "Access Denied",
          description: "You need to be logged in to access this page.",
          variant: "destructive",
        });
        setTimeout(() => router.push('/'), 100);
        return;
      }
      if (user.role !== 'admin') {
        console.log('AI Info - User is not admin, role:', user.role);
        toast({
          title: "Access Denied",
          description: `You need admin permissions to access this page. Your role: ${user.role}`,
          variant: "destructive",
        });
        setTimeout(() => router.push('/'), 100);
        return;
      }
      // User is admin, load prompt
      console.log('AI Info - User is admin, loading prompt');
      loadPrompt();
    }
  }, [user, authLoading, toast, router]);

  const loadPrompt = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'system_prompt')
        .maybeSingle();

      if (error) throw error;

      const prompt = (data as AISetting | null)?.setting_value || '';
      setSections(parsePromptIntoSections(prompt));
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast({
        title: "Error",
        description: "Failed to load system prompt.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        title: 'New Section',
        content: '',
      },
    ]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const fullPrompt = combineSectionsIntoPrompt(sections);

      const { error } = await supabase
        .from('ai_settings')
        .upsert({
          setting_key: 'system_prompt',
          setting_value: fullPrompt,
          description: 'The system prompt that defines how Covion Intelligence behaves.',
        }, {
          onConflict: 'setting_key',
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "System prompt saved successfully.",
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save system prompt.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const fullPrompt = combineSectionsIntoPrompt(sections);

      const response = await fetch('/api/generate-ai-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate improved prompt');
      }

      const { prompt: improvedPrompt } = await response.json();
      setSections(parsePromptIntoSections(improvedPrompt));

      toast({
        title: "Success",
        description: "System prompt enhanced successfully.",
      });
    } catch (error: any) {
      console.error('Error generating prompt:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate improved prompt.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Show loading state while checking auth or loading prompt
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-white">{authLoading ? 'Checking permissions...' : 'Loading system prompt...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied only after auth has loaded and user is not admin
  if (!authLoading && (!user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You need admin permissions to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI System Prompt</h1>
        <p className="text-muted-foreground">Build and customize the system prompt for Covion Intelligence</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                    className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 -ml-2 w-full"
                    placeholder="Section Title"
                  />
                </div>
                {sections.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(section.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={section.content}
                onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                placeholder={`Enter content for ${section.title}...`}
                className="min-h-[150px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button onClick={addSection} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Prompt
              </>
            )}
          </Button>
          <Button onClick={handleGenerate} variant="outline" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Enhance with AI
              </>
            )}
          </Button>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
            <CardDescription>How the prompt will appear to the AI</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-background p-4 rounded border overflow-auto max-h-[300px] whitespace-pre-wrap">
              {combineSectionsIntoPrompt(sections) || '(Empty prompt)'}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}

