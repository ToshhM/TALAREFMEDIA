-- Schema PostgreSQL / Supabase pour Talaref Média — Spécification v3.0

-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  pseudonyme TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'membre' CHECK (role IN ('membre', 'redacteur', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table des articles
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  ref_number INT,
  titre TEXT NOT NULL CHECK (char_length(titre) >= 5 AND char_length(titre) <= 120),
  hero_title TEXT,
  chapo TEXT NOT NULL,
  image_de_une JSONB NOT NULL,
  univers TEXT NOT NULL CHECK (univers IN ('pop', 'arena', 'bpm', 'agora', 'objectif', 'nexus')),
  collection TEXT CHECK (collection IS NULL OR collection IN ('encre', 'arcade')),
  rubrique TEXT,
  format TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  auteurs JSONB NOT NULL DEFAULT '[]'::jsonb,
  video JSONB,
  corps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'review', 'scheduled', 'published', 'archived')),
  publie_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  mis_a_jour_le TIMESTAMPTZ,
  temps_de_lecture INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table des personnes (auteurs, relecteurs, invités)
CREATE TABLE IF NOT EXISTS public.personnes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  bio TEXT,
  photo JSONB,
  liens JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table des commentaires d'articles
CREATE TABLE IF NOT EXISTS public.commentaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_pseudonyme TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'membre' CHECK (user_role IN ('membre', 'redacteur', 'admin')),
  contenu TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_articles_univers ON public.articles(univers);
CREATE INDEX IF NOT EXISTS idx_articles_collection ON public.articles(collection);
CREATE INDEX IF NOT EXISTS idx_articles_publie_le ON public.articles(publie_le DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_commentaires_article ON public.commentaires(article_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Polices de sécurité Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commentaires ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Lecture publique des articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Lecture publique des personnes" ON public.personnes FOR SELECT USING (true);
CREATE POLICY "Lecture publique des profils" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Lecture publique des commentaires" ON public.commentaires FOR SELECT USING (true);

-- Écriture des commentaires pour les utilisateurs authentifiés
CREATE POLICY "Insertion commentaires membres" ON public.commentaires FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Suppression de ses commentaires" ON public.commentaires FOR DELETE USING (auth.uid() = user_id);
