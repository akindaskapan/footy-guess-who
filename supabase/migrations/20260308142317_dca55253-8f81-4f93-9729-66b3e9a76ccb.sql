
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  coins INTEGER NOT NULL DEFAULT 100,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_played INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'Player'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Game results table (for leaderboard)
CREATE TABLE public.game_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'unlimited', 'hardcore')),
  guesses INTEGER NOT NULL,
  hints_used INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  won BOOLEAN NOT NULL DEFAULT false,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game results are viewable by everyone" ON public.game_results FOR SELECT USING (true);
CREATE POLICY "Users can insert their own results" ON public.game_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_game_results_user ON public.game_results(user_id);
CREATE INDEX idx_game_results_score ON public.game_results(score DESC);
CREATE INDEX idx_game_results_played_at ON public.game_results(played_at DESC);

-- Challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL,
  share_code TEXT NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  creator_guesses INTEGER,
  creator_score INTEGER,
  creator_won BOOLEAN,
  challenger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  challenger_guesses INTEGER,
  challenger_score INTEGER,
  challenger_won BOOLEAN,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by everyone" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Participants can update challenges" ON public.challenges FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = challenger_id);

CREATE INDEX idx_challenges_share_code ON public.challenges(share_code);
CREATE INDEX idx_challenges_creator ON public.challenges(creator_id);

-- Weekly leaderboard view
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
SELECT
  p.user_id,
  p.display_name,
  p.avatar_url,
  SUM(gr.score) as weekly_score,
  COUNT(CASE WHEN gr.won THEN 1 END) as weekly_wins,
  COUNT(*) as weekly_games
FROM public.profiles p
JOIN public.game_results gr ON gr.user_id = p.user_id
WHERE gr.played_at >= date_trunc('week', now())
GROUP BY p.user_id, p.display_name, p.avatar_url
ORDER BY weekly_score DESC
LIMIT 100;

-- All-time leaderboard view
CREATE OR REPLACE VIEW public.all_time_leaderboard AS
SELECT
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.total_score,
  p.total_correct,
  p.total_played,
  p.best_streak
FROM public.profiles p
WHERE p.total_played > 0
ORDER BY p.total_score DESC
LIMIT 100;
