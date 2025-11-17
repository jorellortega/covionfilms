'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import type { AISetting } from '@/types/ai';

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISetting[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Load settings when user is loaded and is admin
  useEffect(() => {
    if (!isLoading) {
      console.log('AI Settings - Auth check:', { user, role: user?.role, isLoading });
      if (!user) {
        console.log('AI Settings - No user found, redirecting');
        toast({
          title: "Access Denied",
          description: "You need to be logged in to access this page.",
          variant: "destructive",
        });
        setTimeout(() => router.push('/'), 100);
        return;
      }
      if (user.role !== 'admin') {
        console.log('AI Settings - User is not admin, role:', user.role);
        toast({
          title: "Access Denied",
          description: `You need admin permissions to access this page. Your role: ${user.role}`,
          variant: "destructive",
        });
        setTimeout(() => router.push('/'), 100);
        return;
      }
      // User is admin, load settings
      console.log('AI Settings - User is admin, loading settings');
      loadSettings();
    }
  }, [user, isLoading, toast, router]);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const { data, error } = await supabase
        .from('ai_settings')
        .select('setting_key, setting_value, description, updated_at')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load AI settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const updateValue = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.setting_key === key ? { ...setting, setting_value: value } : setting
      )
    );
  };

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isSensitiveKey = (key: string) => {
    return key.includes('api_key') || key.includes('secret');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update each setting
      for (const setting of settings) {
        const { error } = await supabase
          .from('ai_settings')
          .upsert({
            setting_key: setting.setting_key,
            setting_value: setting.setting_value,
            description: setting.description,
          }, {
            onConflict: 'setting_key',
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "AI settings saved successfully.",
      });

      // Reload to get updated timestamps
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while checking auth or loading settings
  if (isLoading || isLoadingSettings) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-white">{isLoading ? 'Checking permissions...' : 'Loading AI settings...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied only after auth has loaded and user is not admin
  if (!isLoading && (!user || user.role !== 'admin')) {
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
        <h1 className="text-3xl font-bold mb-2">AI Settings</h1>
        <p className="text-muted-foreground">Configure AI provider keys, models, and system prompts</p>
      </div>

      <div className="space-y-6">
        {settings.map((setting) => (
          <Card key={setting.setting_key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                  {setting.description && (
                    <CardDescription className="mt-1">{setting.description}</CardDescription>
                  )}
                </div>
                {isSensitiveKey(setting.setting_key) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleVisibility(setting.setting_key)}
                    className="h-8 w-8"
                  >
                    {visibleKeys.has(setting.setting_key) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {setting.setting_key === 'openai_model' ? (
                <Select
                  value={setting.setting_value || ''}
                  onValueChange={(value) => updateValue(setting.setting_key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              ) : setting.setting_key === 'anthropic_model' ? (
                <Select
                  value={setting.setting_value || ''}
                  onValueChange={(value) => updateValue(setting.setting_key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={setting.setting_key}>Value</Label>
                  <Input
                    id={setting.setting_key}
                    type={isSensitiveKey(setting.setting_key) && !visibleKeys.has(setting.setting_key) ? 'password' : 'text'}
                    value={setting.setting_value || ''}
                    onChange={(e) => updateValue(setting.setting_key, e.target.value)}
                    placeholder={`Enter ${setting.setting_key.replace(/_/g, ' ')}`}
                  />
                </div>
              )}
              {setting.updated_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(setting.updated_at).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isLoadingSettings || isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <Button variant="outline" onClick={loadSettings} disabled={isLoadingSettings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}

