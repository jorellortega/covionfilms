import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import type { AIMessage, AISettingsMap } from '@/types/ai';

// Helper function to map settings array to object
function mapSettings(settingsData: any[] | null): AISettingsMap {
  if (!settingsData) return {};
  const map: AISettingsMap = {};
  for (const setting of settingsData) {
    map[setting.setting_key] = setting.setting_value;
  }
  return map;
}

// Call OpenAI API
async function callOpenAI(messages: AIMessage[], settings: AISettingsMap): Promise<{ message: string } | null> {
  const apiKey = settings['openai_api_key']?.trim();
  const model = settings['openai_model']?.trim() || 'gpt-4o-mini';

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content?.trim();

    if (!message) {
      return null;
    }

    return { message };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return null;
  }
}

// Call Anthropic API
async function callAnthropic(messages: AIMessage[], settings: AISettingsMap, systemPrompt?: string): Promise<{ message: string } | null> {
  const apiKey = settings['anthropic_api_key']?.trim();
  const model = settings['anthropic_model']?.trim() || 'claude-3-5-sonnet-20241022';

  if (!apiKey) {
    return null;
  }

  try {
    // Anthropic API requires system message to be separate
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemMessage?.content || systemPrompt || '',
        messages: conversationMessages.map(({ role, content }) => ({
          role: role === 'assistant' ? 'assistant' : 'user',
          content,
        })),
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return null;
    }

    const data = await response.json();
    const message = data?.content?.[0]?.text?.trim();

    if (!message) {
      return null;
    }

    return { message };
  } catch (error) {
    console.error('Error calling Anthropic:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Supabase server client is configured
    if (!supabaseServer) {
      console.error('Supabase server client not configured - missing environment variables');
      const missingVars = [];
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_SECRET) {
        missingVars.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_SECRET');
      }
      
      return NextResponse.json(
        { 
          error: `Missing required environment variables: ${missingVars.join(', ')}. Please add SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_SECRET) to your .env file and restart the server.` 
        },
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

    if (!settingsData || settingsData.length === 0) {
      console.error('No AI settings found in database');
      return NextResponse.json(
        { error: 'AI settings not configured. Please configure API keys in admin settings.' },
        { status: 500 }
      );
    }

    const settings = mapSettings(settingsData);
    const systemPrompt = settings['system_prompt']?.trim();

    // Build messages array
    const messages: AIMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push(...conversationHistory);
    messages.push({ role: 'user', content: message.trim() });

    // Try OpenAI first, then Anthropic as fallback
    let responsePayload = await callOpenAI(messages, settings);
    if (!responsePayload) {
      responsePayload = await callAnthropic(messages, settings, systemPrompt);
    }

    if (!responsePayload) {
      return NextResponse.json(
        { error: 'AI service is currently unavailable. Please check API keys in settings.' },
        { status: 503 }
      );
    }

    // Remove markdown bold formatting (**text** -> text)
    const cleanedMessage = responsePayload.message.replace(/\*\*(.*?)\*\*/g, '$1');

    return NextResponse.json({ message: cleanedMessage });
  } catch (error) {
    console.error('Error in AI chat API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

