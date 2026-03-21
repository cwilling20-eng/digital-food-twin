-- Social feed tables for NomMigo.
-- DO NOT RUN — Wayne will run this manually in the Supabase dashboard.

-- Posts: meal shares, achievements, restaurant discoveries, NomMigo recommendations
CREATE TABLE social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  post_type TEXT NOT NULL CHECK (post_type IN ('meal', 'achievement', 'discovery', 'recommendation')),
  content_json JSONB,
  image_url TEXT,
  restaurant_name TEXT,
  dish_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_posts_user ON social_posts(user_id);
CREATE INDEX idx_social_posts_created ON social_posts(created_at DESC);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read posts" ON social_posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON social_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON social_posts FOR DELETE USING (auth.uid() = user_id);

-- Stories: ephemeral photo/video shares that expire after 24h
CREATE TABLE social_stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  media_url TEXT,
  media_type TEXT DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  caption TEXT,
  restaurant_name TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_stories_user ON social_stories(user_id);
CREATE INDEX idx_social_stories_expires ON social_stories(expires_at);

ALTER TABLE social_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active stories" ON social_stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can create own stories" ON social_stories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reactions on posts (NomMigo smiley, etc.)
CREATE TABLE social_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reaction_type TEXT DEFAULT 'nom' CHECK (reaction_type IN ('nom', 'fire', 'drool', 'bookmark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX idx_social_reactions_post ON social_reactions(post_id);
ALTER TABLE social_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reactions" ON social_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react" ON social_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON social_reactions FOR DELETE USING (auth.uid() = user_id);

-- Dining signals: "I'm down to eat" toggle
CREATE TABLE dining_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '4 hours'),
  UNIQUE(user_id)
);

ALTER TABLE dining_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active signals" ON dining_signals FOR SELECT USING (is_active AND expires_at > NOW());
CREATE POLICY "Users can manage own signal" ON dining_signals FOR ALL USING (auth.uid() = user_id);
