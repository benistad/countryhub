import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NewsPlusArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: 'album' | 'tour' | 'award' | 'news';
  artist?: string;
  tags: string[];
  featured_image_url?: string;
  meta_description: string;
  published_at: string;
  is_published: boolean;
  featured: boolean;
  source_articles_count: number;
  created_at: string;
}

interface UseNewsPlusArticlesOptions {
  limit?: number;
  category?: string;
  featured?: boolean;
}

export function useNewsPlusArticles(options: UseNewsPlusArticlesOptions = {}) {
  const [articles, setArticles] = useState<NewsPlusArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [options.limit, options.category, options.featured]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('news_plus_articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.featured !== undefined) {
        query = query.eq('featured', options.featured);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Erreur Supabase: ${fetchError.message}`);
      }

      setArticles(data || []);
    } catch (err) {
      console.error('Erreur récupération News+:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const triggerGeneration = async (): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🚀 Déclenchement génération News+...');
      
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-news-plus`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('✅ Génération terminée:', result);

      if (result.success) {
        await fetchArticles();
      }

      return {
        success: result.success,
        message: result.message || 'Génération terminée'
      };
      
    } catch (error) {
      console.error('❌ Erreur génération:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur génération'
      };
    }
  };

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles,
    triggerGeneration
  };
}

export function useNewsPlusArticle(slug: string) {
  const [article, setArticle] = useState<NewsPlusArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('news_plus_articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (fetchError) {
        throw new Error(`Article non trouvé: ${fetchError.message}`);
      }

      setArticle(data);
    } catch (err) {
      console.error('Erreur récupération article:', err);
      setError(err instanceof Error ? err.message : 'Article non trouvé');
    } finally {
      setLoading(false);
    }
  };

  return {
    article,
    loading,
    error,
    refetch: fetchArticle
  };
}
