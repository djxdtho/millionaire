-- Run this in your Supabase SQL Editor

-- Clear existing
DROP VIEW IF EXISTS leaderboard CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  level_reached INTEGER NOT NULL,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  won BOOLEAN NOT NULL DEFAULT FALSE,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);

-- User stats view (for /me endpoint)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  user_id,
  COUNT(*)::int as games_played,
  COALESCE(MAX(score), 0) as best_score,
  COALESCE(SUM(CASE WHEN won THEN 1 ELSE 0 END), 0)::int as games_won
FROM scores
GROUP BY user_id;

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  s.user_id,
  p.username,
  MAX(s.score) as score,
  MAX(s.level_reached) as level_reached,
  COUNT(s.id)::int as games_played,
  BOOL_OR(s.won) as won_million
FROM scores s
JOIN profiles p ON s.user_id = p.id
GROUP BY s.user_id, p.username;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Scores policies
CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores"
  ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant view access
GRANT SELECT ON user_stats TO anon, authenticated;
GRANT SELECT ON leaderboard TO anon, authenticated;
