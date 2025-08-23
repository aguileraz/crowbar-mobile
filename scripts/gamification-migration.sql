-- =====================================================
-- CROWBAR MOBILE - GAMIFICATION DATABASE MIGRATION
-- Version: 1.0.0
-- Date: 2025-08-12
-- Description: Complete gamification system tables
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER GAMIFICATION DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INT DEFAULT 1 CHECK (level >= 1),
  current_xp INT DEFAULT 0 CHECK (current_xp >= 0),
  total_xp INT DEFAULT 0 CHECK (total_xp >= 0),
  points INT DEFAULT 0 CHECK (points >= 0),
  coins INT DEFAULT 0 CHECK (coins >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_user_gamification_user ON user_gamification(user_id);
CREATE INDEX idx_user_gamification_level ON user_gamification(level DESC);
CREATE INDEX idx_user_gamification_points ON user_gamification(points DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_gamification_updated_at BEFORE UPDATE
  ON user_gamification FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. STREAK SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INT DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  freezes_available INT DEFAULT 3 CHECK (freezes_available >= 0),
  freezes_used INT DEFAULT 0 CHECK (freezes_used >= 0),
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_until DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_streaks_user ON streaks(user_id);
CREATE INDEX idx_streaks_current ON streaks(current_streak DESC);
CREATE INDEX idx_streaks_longest ON streaks(longest_streak DESC);

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE
  ON streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. CHALLENGES SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'open_boxes', 'share', 'review', 'spend', 'login', 'referral')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('daily', 'weekly', 'special', 'achievement')),
  target_value INT NOT NULL CHECK (target_value > 0),
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('xp', 'coins', 'discount', 'box', 'badge', 'freeze')),
  reward_value JSONB NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  max_completions INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_active ON challenges(is_active, end_date);
CREATE INDEX idx_challenges_category ON challenges(category);
CREATE INDEX idx_challenges_type ON challenges(type);

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE
  ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User challenge progress
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  current_progress INT DEFAULT 0 CHECK (current_progress >= 0),
  is_completed BOOLEAN DEFAULT FALSE,
  is_claimed BOOLEAN DEFAULT FALSE,
  completions_count INT DEFAULT 0,
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_progress ON user_challenges(user_id, is_completed, is_claimed);
CREATE INDEX idx_user_challenges_completed ON user_challenges(is_completed, is_claimed);

CREATE TRIGGER update_user_challenges_updated_at BEFORE UPDATE
  ON user_challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. LEADERBOARD SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('points', 'boxes', 'spent', 'streak', 'challenges')),
  timeframe VARCHAR(20) NOT NULL CHECK (timeframe IN ('daily', 'weekly', 'monthly', 'all_time')),
  score BIGINT NOT NULL DEFAULT 0,
  rank INT,
  previous_rank INT,
  best_rank INT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category, timeframe, period_start)
);

CREATE INDEX idx_leaderboard_ranking ON leaderboard(category, timeframe, period_start, score DESC);
CREATE INDEX idx_leaderboard_user ON leaderboard(user_id, timeframe);
CREATE INDEX idx_leaderboard_period ON leaderboard(period_start, period_end);

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE
  ON leaderboard FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. SPIN WHEEL SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS spin_wheel_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_id VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  color VARCHAR(7) NOT NULL,
  icon VARCHAR(50),
  probability DECIMAL(5,2) NOT NULL CHECK (probability >= 0 AND probability <= 100),
  tier VARCHAR(20) CHECK (tier IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT TRUE,
  min_level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spin_wheel_active ON spin_wheel_config(is_active);
CREATE INDEX idx_spin_wheel_probability ON spin_wheel_config(probability DESC);

CREATE TRIGGER update_spin_wheel_config_updated_at BEFORE UPDATE
  ON spin_wheel_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User spin history
CREATE TABLE IF NOT EXISTS user_spins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spin_date DATE NOT NULL,
  spins_used INT DEFAULT 0 CHECK (spins_used >= 0),
  max_spins INT DEFAULT 3 CHECK (max_spins > 0),
  rewards_won JSONB DEFAULT '[]'::jsonb,
  total_value_won DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, spin_date)
);

CREATE INDEX idx_user_spins_user_date ON user_spins(user_id, spin_date DESC);
CREATE INDEX idx_user_spins_date ON user_spins(spin_date DESC);

CREATE TRIGGER update_user_spins_updated_at BEFORE UPDATE
  ON user_spins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ACHIEVEMENTS SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  category VARCHAR(50),
  points INT DEFAULT 0 CHECK (points >= 0),
  tier VARCHAR(20) CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INT NOT NULL CHECK (requirement_value > 0),
  requirement_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievements_active ON achievements(is_active);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_tier ON achievements(tier);

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE
  ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INT DEFAULT 0 CHECK (progress >= 0),
  unlocked_at TIMESTAMP,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(user_id, unlocked_at DESC);

CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE
  ON user_achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. REWARDS SYSTEM
-- =====================================================
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('xp', 'coins', 'discount', 'box', 'badge', 'freeze', 'spin')),
  value JSONB NOT NULL,
  source VARCHAR(100),
  source_id UUID,
  is_claimed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_user ON rewards(user_id);
CREATE INDEX idx_rewards_pending ON rewards(user_id, is_claimed, expires_at);
CREATE INDEX idx_rewards_type ON rewards(type);

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE
  ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. GAMIFICATION EVENTS (for analytics)
-- =====================================================
CREATE TABLE IF NOT EXISTS gamification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50),
  event_data JSONB,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gamification_events_user ON gamification_events(user_id);
CREATE INDEX idx_gamification_events_type ON gamification_events(event_type);
CREATE INDEX idx_gamification_events_date ON gamification_events(created_at DESC);
CREATE INDEX idx_gamification_events_session ON gamification_events(session_id);

-- =====================================================
-- 9. LEVEL CONFIGURATION
-- =====================================================
CREATE TABLE IF NOT EXISTS level_config (
  level INT PRIMARY KEY CHECK (level >= 1),
  xp_required INT NOT NULL CHECK (xp_required >= 0),
  rewards JSONB,
  perks JSONB,
  badge_icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default level configuration
INSERT INTO level_config (level, xp_required, rewards, perks) VALUES
(1, 0, '{"coins": 0}', '{"daily_spins": 1}'),
(2, 100, '{"coins": 10}', '{"daily_spins": 1}'),
(3, 250, '{"coins": 20}', '{"daily_spins": 1}'),
(4, 500, '{"coins": 30}', '{"daily_spins": 2}'),
(5, 1000, '{"coins": 50, "discount": 5}', '{"daily_spins": 2}'),
(6, 1750, '{"coins": 75}', '{"daily_spins": 2}'),
(7, 2750, '{"coins": 100}', '{"daily_spins": 2}'),
(8, 4000, '{"coins": 150}', '{"daily_spins": 3}'),
(9, 5500, '{"coins": 200}', '{"daily_spins": 3}'),
(10, 7500, '{"coins": 300, "discount": 10}', '{"daily_spins": 3, "freeze_protection": 1}')
ON CONFLICT (level) DO NOTHING;

-- =====================================================
-- 10. MILESTONE REWARDS
-- =====================================================
CREATE TABLE IF NOT EXISTS milestone_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  milestone_value INT NOT NULL,
  rewards JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, milestone_value)
);

-- Insert default streak milestones
INSERT INTO milestone_config (type, milestone_value, rewards) VALUES
('streak', 3, '{"coins": 10, "xp": 50}'),
('streak', 7, '{"coins": 25, "xp": 100, "freeze": 1}'),
('streak', 14, '{"coins": 50, "xp": 200}'),
('streak', 30, '{"coins": 100, "xp": 500, "discount": 10}'),
('streak', 60, '{"coins": 200, "xp": 1000, "box": "bronze"}'),
('streak', 90, '{"coins": 300, "xp": 1500, "discount": 15}'),
('streak', 180, '{"coins": 500, "xp": 3000, "box": "silver"}'),
('streak', 365, '{"coins": 1000, "xp": 5000, "box": "gold", "badge": "year_streak"}')
ON CONFLICT (type, milestone_value) DO NOTHING;

-- =====================================================
-- FUNCTIONS AND PROCEDURES
-- =====================================================

-- Function to calculate user level based on XP
CREATE OR REPLACE FUNCTION calculate_user_level(total_xp INT)
RETURNS INT AS $$
DECLARE
  user_level INT;
BEGIN
  SELECT COALESCE(MAX(level), 1) INTO user_level
  FROM level_config
  WHERE xp_required <= total_xp;
  RETURN user_level;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INT;
  v_is_frozen BOOLEAN;
  v_frozen_until DATE;
BEGIN
  SELECT last_activity_date, current_streak, is_frozen, frozen_until
  INTO v_last_activity, v_current_streak, v_is_frozen, v_frozen_until
  FROM streaks
  WHERE user_id = p_user_id;

  -- Check if streak should continue
  IF v_last_activity IS NULL OR 
     v_last_activity = CURRENT_DATE - INTERVAL '1 day' OR
     (v_is_frozen AND v_frozen_until >= CURRENT_DATE) THEN
    -- Continue or start streak
    UPDATE streaks
    SET current_streak = CASE 
          WHEN v_last_activity IS NULL THEN 1
          WHEN v_last_activity = CURRENT_DATE THEN current_streak
          ELSE current_streak + 1
        END,
        last_activity_date = CURRENT_DATE,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        is_frozen = FALSE,
        frozen_until = NULL
    WHERE user_id = p_user_id;
  ELSIF v_last_activity < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken
    UPDATE streaks
    SET current_streak = 1,
        last_activity_date = CURRENT_DATE,
        is_frozen = FALSE,
        frozen_until = NULL
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings(
  p_category VARCHAR(50),
  p_timeframe VARCHAR(20)
)
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT 
      user_id,
      score,
      ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
    FROM leaderboard
    WHERE category = p_category
      AND timeframe = p_timeframe
      AND period_start = CASE
        WHEN p_timeframe = 'daily' THEN CURRENT_DATE
        WHEN p_timeframe = 'weekly' THEN DATE_TRUNC('week', CURRENT_DATE)::DATE
        WHEN p_timeframe = 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE)::DATE
        ELSE DATE '2000-01-01'
      END
  )
  UPDATE leaderboard l
  SET 
    previous_rank = l.rank,
    rank = ru.new_rank,
    best_rank = LEAST(COALESCE(l.best_rank, ru.new_rank), ru.new_rank)
  FROM ranked_users ru
  WHERE l.user_id = ru.user_id
    AND l.category = p_category
    AND l.timeframe = p_timeframe;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_user_gamification_level_points ON user_gamification(level DESC, points DESC);
CREATE INDEX idx_challenges_active_dates ON challenges(is_active, start_date, end_date);
CREATE INDEX idx_user_challenges_user_status ON user_challenges(user_id, is_completed, is_claimed);
CREATE INDEX idx_rewards_user_pending ON rewards(user_id, is_claimed) WHERE is_claimed = FALSE;
CREATE INDEX idx_leaderboard_top_scores ON leaderboard(category, timeframe, score DESC) WHERE rank <= 100;

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Default spin wheel configuration
INSERT INTO spin_wheel_config (reward_id, label, value, color, icon, probability, tier) VALUES
('xp_100', '+100 XP', '{"type": "xp", "amount": 100}', '#4CAF50', '⭐', 30.00, 'common'),
('coins_50', '+50 Moedas', '{"type": "coins", "amount": 50}', '#2196F3', '🪙', 25.00, 'common'),
('discount_10', '10% Desconto', '{"type": "discount", "percentage": 10}', '#FF9800', '🎫', 20.00, 'rare'),
('discount_20', '20% Desconto', '{"type": "discount", "percentage": 20}', '#FF5722', '🎟️', 10.00, 'rare'),
('free_box', 'Caixa Grátis', '{"type": "box", "tier": "bronze"}', '#9C27B0', '🎁', 5.00, 'epic'),
('coins_200', '+200 Moedas', '{"type": "coins", "amount": 200}', '#00BCD4', '💰', 5.00, 'epic'),
('xp_500', '+500 XP', '{"type": "xp", "amount": 500}', '#8BC34A', '🌟', 3.00, 'legendary'),
('try_again', 'Tente Novamente', '{"type": "spin", "amount": 1}', '#9E9E9E', '🔄', 2.00, 'common')
ON CONFLICT (reward_id) DO NOTHING;

-- Default achievements
INSERT INTO achievements (code, name, description, category, points, tier, requirement_type, requirement_value) VALUES
('first_purchase', 'Primeira Compra', 'Complete sua primeira compra', 'purchase', 10, 'bronze', 'purchase_count', 1),
('box_collector_10', 'Colecionador Iniciante', 'Abra 10 caixas misteriosas', 'collection', 25, 'bronze', 'boxes_opened', 10),
('box_collector_50', 'Colecionador Experiente', 'Abra 50 caixas misteriosas', 'collection', 50, 'silver', 'boxes_opened', 50),
('box_collector_100', 'Colecionador Master', 'Abra 100 caixas misteriosas', 'collection', 100, 'gold', 'boxes_opened', 100),
('streak_week', 'Semana Perfeita', 'Mantenha uma sequência de 7 dias', 'streak', 30, 'bronze', 'streak_days', 7),
('streak_month', 'Mês Perfeito', 'Mantenha uma sequência de 30 dias', 'streak', 75, 'silver', 'streak_days', 30),
('big_spender_1000', 'Grande Gastador', 'Gaste R$ 1.000 no app', 'purchase', 50, 'silver', 'total_spent', 1000),
('social_butterfly', 'Social', 'Compartilhe 5 caixas com amigos', 'social', 20, 'bronze', 'shares', 5),
('reviewer', 'Crítico', 'Avalie 10 produtos', 'engagement', 15, 'bronze', 'reviews', 10),
('lucky_spinner', 'Sortudo', 'Ganhe um prêmio épico na roda', 'luck', 40, 'gold', 'epic_spin_win', 1)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- GRANTS (adjust according to your user setup)
-- =====================================================

-- GRANT ALL ON ALL TABLES IN SCHEMA public TO crowbar_api;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO crowbar_api;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO crowbar_api;

-- =====================================================
-- COMMIT
-- =====================================================
COMMIT;