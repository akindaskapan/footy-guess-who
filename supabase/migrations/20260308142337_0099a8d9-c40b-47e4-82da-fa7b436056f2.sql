
-- Fix security definer views by recreating with security_invoker
DROP VIEW IF EXISTS public.weekly_leaderboard;
DROP VIEW IF EXISTS public.all_time_leaderboard;

CREATE OR REPLACE VIEW public.weekly_leaderboard
WITH (security_invoker=on) AS
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

CREATE OR REPLACE VIEW public.all_time_leaderboard
WITH (security_invoker=on) AS
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
