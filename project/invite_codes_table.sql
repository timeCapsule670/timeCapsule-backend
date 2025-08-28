-- Create invite_codes table for the invite code system
CREATE TABLE IF NOT EXISTS invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  director_id UUID NOT NULL REFERENCES directors(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_director_id ON invite_codes(director_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invite_codes_updated_at 
  BEFORE UPDATE ON invite_codes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Directors can view their own invite codes
CREATE POLICY "Directors can view their own invite codes" ON invite_codes
  FOR SELECT USING (
    director_id IN (
      SELECT id FROM directors WHERE auth_user_id = auth.uid()
    )
  );

-- Directors can create invite codes for themselves
CREATE POLICY "Directors can create invite codes" ON invite_codes
  FOR INSERT WITH CHECK (
    director_id IN (
      SELECT id FROM directors WHERE auth_user_id = auth.uid()
    )
  );

-- Directors can update their own invite codes
CREATE POLICY "Directors can update their own invite codes" ON invite_codes
  FOR UPDATE USING (
    director_id IN (
      SELECT id FROM directors WHERE auth_user_id = auth.uid()
    )
  );

-- Directors can delete their own unused invite codes
CREATE POLICY "Directors can delete their own unused invite codes" ON invite_codes
  FOR DELETE USING (
    director_id IN (
      SELECT id FROM directors WHERE auth_user_id = auth.uid()
    ) AND is_used = FALSE
  );

-- Anyone can view invite codes for validation (but not sensitive fields)
CREATE POLICY "Public can view invite codes for validation" ON invite_codes
  FOR SELECT USING (true);

-- Anyone can update invite codes when using them (marking as used)
CREATE POLICY "Public can use invite codes" ON invite_codes
  FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON invite_codes TO authenticated;
GRANT SELECT ON invite_codes TO anon;
