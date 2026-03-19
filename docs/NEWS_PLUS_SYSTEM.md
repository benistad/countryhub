# News+ System - Documentation Technique

## Vue d'ensemble

Le système **News+** est un système automatisé de génération d'articles de presse utilisant l'IA pour compiler et réécrire les actualités country music provenant de Google News.

## Architecture

### 1. Flux de données

```
Google News API → country_news (table)
                      ↓
              Edge Function (toutes les heures)
                      ↓
                 Clustering IA
                      ↓
              Génération articles IA
                      ↓
           news_plus_articles (table)
                      ↓
                Interface utilisateur
```

### 2. Tables Supabase

#### `news_plus_articles`
Stocke les articles générés par l'IA.

**Colonnes principales:**
- `title`: Titre de l'article
- `slug`: URL-friendly identifier
- `content`: Contenu complet de l'article (400-600 mots)
- `excerpt`: Résumé court (160 chars max)
- `category`: album | tour | award | news
- `artist`: Artiste principal mentionné
- `tags`: Array de tags pour filtrage
- `featured_image_url`: URL de l'image principale
- `source_articles_count`: Nombre d'articles sources utilisés
- `source_articles_urls`: URLs des articles sources
- `published_at`: Date de publication
- `is_published`: Boolean pour contrôle de publication
- `featured`: Boolean pour articles mis en avant

#### `news_plus_clusters`
Tracking des clusters d'articles sources.

#### `news_plus_generation_history`
Historique des exécutions de génération.

### 3. Edge Function: `generate-news-plus`

**Déclenchement:** Toutes les heures via cron job

**Processus:**

1. **Récupération des sources** (dernières 24h)
   ```typescript
   SELECT * FROM country_news 
   WHERE pub_date >= NOW() - INTERVAL '24 hours'
   ORDER BY pub_date DESC
   ```

2. **Clustering par IA** (GPT-4o-mini)
   - Analyse les titres et descriptions
   - Groupe les articles par sujet similaire
   - Minimum 2 articles par cluster (sauf cas isolés)
   - Identifie l'artiste principal et la catégorie

3. **Génération d'articles** (GPT-4o-mini)
   - Pour chaque cluster, génère un article unique
   - 400-600 mots de contenu original
   - Ton professionnel et engageant
   - Combine les informations de toutes les sources
   - Génère titre, excerpt, tags, meta description

4. **Déduplication**
   - Vérifie qu'un article similaire n'existe pas déjà (24h)
   - Évite les doublons par titre

5. **Nettoyage**
   - Garde seulement les 100 articles les plus récents
   - Supprime automatiquement les anciens

### 4. Configuration IA

**Modèle:** OpenAI GPT-4o-mini
- **Clustering:** Temperature 0.3 (précision)
- **Génération:** Temperature 0.7 (créativité)
- **Format:** JSON structuré

**Variables d'environnement requises:**
```bash
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Déploiement

### 1. Migrations Supabase

```bash
# Créer les tables
supabase db push

# Ou manuellement
psql -h db.xxx.supabase.co -U postgres -d postgres -f supabase/migrations/20260319_create_news_plus_tables.sql
```

### 2. Déployer l'Edge Function

```bash
supabase functions deploy generate-news-plus
```

### 3. Configurer le Cron Job

Dans le dashboard Supabase → Database → Cron Jobs:

```sql
-- Exécuter toutes les heures
SELECT cron.schedule(
  'generate-news-plus-hourly',
  '0 * * * *',  -- Toutes les heures à minute 0
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/generate-news-plus',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

**Alternative:** Utiliser GitHub Actions ou un service externe (Vercel Cron, etc.)

### 4. Variables d'environnement

Dans Supabase Dashboard → Settings → Edge Functions:

```
OPENAI_API_KEY=sk-proj-...
```

## Interface utilisateur

### Page News+ (`/news-plus`)

**Composant:** `NewsPlusPageDynamic.tsx`

**Fonctionnalités:**
- Affichage des articles générés
- Filtres par catégorie (album, tour, award, news)
- Recherche par artiste/tag
- Articles "Featured" mis en avant
- Modal de lecture complète
- Bouton refresh manuel pour déclencher génération

**Hook:** `useNewsPlusArticles.ts`
```typescript
const { articles, loading, error, refetch, triggerGeneration } = useNewsPlusArticles({ 
  limit: 100,
  category: 'album', // optionnel
  featured: true // optionnel
});
```

## Monitoring

### Vérifier l'historique de génération

```sql
SELECT 
  generated_at,
  articles_analyzed,
  clusters_created,
  articles_generated,
  execution_time_ms,
  status
FROM news_plus_generation_history
ORDER BY generated_at DESC
LIMIT 10;
```

### Statistiques globales

```sql
SELECT * FROM get_news_plus_stats();
```

### Articles récents

```sql
SELECT 
  title,
  category,
  artist,
  source_articles_count,
  published_at
FROM news_plus_articles
WHERE is_published = true
ORDER BY published_at DESC
LIMIT 20;
```

## Optimisations SEO

### 1. Meta tags dynamiques
Chaque article génère automatiquement:
- `meta_description` (155 chars max)
- `meta_keywords` (5-8 keywords)
- Slug SEO-friendly

### 2. Schema.org
- CollectionPage pour la liste
- NewsArticle pour chaque article (à implémenter)

### 3. Internal linking
- Liens vers pages artistes
- Liens vers catégories
- Tags cliquables

## Coûts estimés

### OpenAI API (GPT-4o-mini)

**Par exécution (moyenne):**
- Clustering: ~1,000 tokens input + 500 output = $0.0002
- Génération (5 articles): ~15,000 tokens input + 3,000 output = $0.003
- **Total par exécution: ~$0.004**

**Par mois (24 exécutions/jour):**
- 24 × 30 × $0.004 = **~$2.88/mois**

### Supabase
- Inclus dans le plan gratuit (jusqu'à 500MB DB)
- Edge Functions: 500K invocations/mois gratuites

## Maintenance

### Tâches régulières

1. **Hebdomadaire:**
   - Vérifier les logs de génération
   - Contrôler la qualité des articles générés
   - Ajuster les prompts si nécessaire

2. **Mensuel:**
   - Analyser les statistiques de génération
   - Optimiser les coûts OpenAI
   - Nettoyer les anciens clusters

3. **Trimestriel:**
   - Évaluer la pertinence du clustering
   - Tester de nouveaux modèles IA
   - Améliorer les prompts

## Troubleshooting

### Problème: Aucun article généré

**Causes possibles:**
1. Pas de nouveaux articles Google News (dernières 24h)
2. Erreur API OpenAI (quota dépassé)
3. Erreur Supabase (permissions)

**Solution:**
```bash
# Vérifier les logs
supabase functions logs generate-news-plus

# Tester manuellement
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/generate-news-plus \
  -H "Authorization: Bearer YOUR_KEY"
```

### Problème: Articles de mauvaise qualité

**Solutions:**
1. Ajuster la température du modèle
2. Améliorer les prompts
3. Augmenter le nombre minimum d'articles par cluster
4. Tester GPT-4 au lieu de GPT-4o-mini

### Problème: Doublons

**Solutions:**
1. Améliorer la logique de déduplication
2. Augmenter la fenêtre de détection (24h → 48h)
3. Comparer les slugs en plus des titres

## Évolutions futures

### Court terme
- [ ] Page article individuelle (`/news-plus/:slug`)
- [ ] Partage social (Open Graph)
- [ ] Newsletter automatique

### Moyen terme
- [ ] Génération d'images avec DALL-E
- [ ] Résumés audio (TTS)
- [ ] Traduction multilingue

### Long terme
- [ ] Analyse de sentiment
- [ ] Prédictions de tendances
- [ ] Recommandations personnalisées
