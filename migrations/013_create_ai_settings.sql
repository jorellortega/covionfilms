-- Migration 013: Create AI Settings System
-- This migration creates the ai_settings table, RLS policies, and helper functions
-- for managing AI provider keys, model choices, and system prompts

-- Create ai_settings table
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on ai_settings
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.ai_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policy: Only admins can read ai_settings
CREATE POLICY "Admins can read ai_settings" ON public.ai_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can insert ai_settings
CREATE POLICY "Admins can insert ai_settings" ON public.ai_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can update ai_settings
CREATE POLICY "Admins can update ai_settings" ON public.ai_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policy: Only admins can delete ai_settings
CREATE POLICY "Admins can delete ai_settings" ON public.ai_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create helper function to get all AI settings (for server-side use)
CREATE OR REPLACE FUNCTION public.get_ai_settings()
RETURNS TABLE (
  setting_key TEXT,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai_settings.setting_key,
    ai_settings.setting_value,
    ai_settings.description,
    ai_settings.updated_at
  FROM public.ai_settings
  ORDER BY ai_settings.setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_ai_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_settings() TO service_role;

-- Insert default AI settings
INSERT INTO public.ai_settings (setting_key, setting_value, description)
VALUES
  ('openai_api_key', '', 'OpenAI API key used for the Covion AI assistant.'),
  ('openai_model', 'gpt-4o-mini', 'Default OpenAI model for the Covion AI assistant.'),
  ('anthropic_api_key', '', 'Anthropic API key for optional fallback use.'),
  ('anthropic_model', 'claude-3-5-sonnet-20241022', 'Default Anthropic model when configured.'),
  ('system_prompt', $$### Role
You are Covion Intelligence, the AI assistant for COVION FILMS. You help users discover movies, answer questions about the platform, and provide personalized recommendations.

### Capabilities
- Movie and content recommendations
- Platform feature explanations
- Subscription and pricing information
- Creator program details
- General assistance with COVION FILMS

### Guidelines
- Be friendly, helpful, and professional
- Provide accurate information about the platform
- If you don't know something, admit it and suggest contacting support
- Keep responses concise but informative
- Use the platform's branding and tone$$, 'The system prompt that defines how Covion Intelligence behaves.')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_settings_setting_key ON public.ai_settings(setting_key);

-- Add comments
COMMENT ON TABLE public.ai_settings IS 'Stores AI provider configuration, API keys, and system prompts';
COMMENT ON FUNCTION public.get_ai_settings() IS 'Helper function to retrieve all AI settings (server-side only)';

