import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import type { AISettingsMap } from '@/types/ai';

// Helper function to map settings array to object
function mapSettings(settingsData: any[] | null): AISettingsMap {
  if (!settingsData) return {};
  const map: AISettingsMap = {};
  for (const setting of settingsData) {
    map[setting.setting_key] = setting.setting_value;
  }
  return map;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check if Supabase server client is configured
    if (!supabaseServer) {
      console.error('Supabase server client not configured - missing environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Get AI settings from Supabase
    const { data: settingsData, error: settingsError } = await supabaseServer.rpc('get_ai_settings');

    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
      // Check if RPC function doesn't exist (migration not run)
      if (settingsError.message?.includes('function') || settingsError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'AI settings migration not run. Please run the migration first.' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Failed to load AI configuration: ${settingsError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    const settings = mapSettings(settingsData);
    const openaiKey = settings['openai_api_key']?.trim();

    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 400 }
      );
    }

    // Call OpenAI to enhance the prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: settings['openai_model']?.trim() || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing and improving AI system prompts. Your task is to enhance the given prompt to be more effective, clear, and comprehensive while maintaining its original intent and style.',
          },
          {
            role: 'user',
            content: `Please improve the following system prompt:\n\n${prompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate improved prompt' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const improvedPrompt = data?.choices?.[0]?.message?.content?.trim();

    if (!improvedPrompt) {
      return NextResponse.json(
        { error: 'No improved prompt generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt: improvedPrompt });
  } catch (error) {
    console.error('Error in generate AI prompt API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

