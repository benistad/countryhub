# News+ SEO & Sitemap Configuration

## 🎯 Objectif
Référencer rapidement les articles News+ sur Google pour maximiser le trafic organique.

## 📋 Configuration complète

### 1. Google News Sitemap (Référencement rapide)

#### Déployer l'Edge Function
```bash
supabase functions deploy news-plus-sitemap
```

#### URL du sitemap
```
https://[votre-projet].supabase.co/functions/v1/news-plus-sitemap
```

**Caractéristiques :**
- Format Google News Sitemap (référencement prioritaire)
- Articles des dernières 48h uniquement
- Mise à jour automatique toutes les 2 heures
- Cache 1 heure

### 2. Configuration dans Vercel

Ajouter une redirection dans `vercel.json` :

```json
{
  "rewrites": [
    {
      "source": "/news-sitemap.xml",
      "destination": "https://[votre-projet].supabase.co/functions/v1/news-plus-sitemap"
    }
  ]
}
```

### 3. Ping automatique Google

Le système notifie automatiquement Google après chaque génération d'articles via :
```
https://www.google.com/ping?sitemap=https://www.countrymusic-hub.com/news-sitemap.xml
```

### 4. Configuration Google Search Console

1. **Ajouter le sitemap**
   - Aller sur [Google Search Console](https://search.google.com/search-console)
   - Sitemaps → Ajouter un sitemap
   - URL : `https://www.countrymusic-hub.com/news-sitemap.xml`

2. **Activer Google News**
   - Aller sur [Google Publisher Center](https://publishercenter.google.com/)
   - Ajouter votre site
   - Soumettre pour validation Google News

3. **Demander une indexation rapide**
   - API Indexing Google (optionnel)
   - Permet d'indexer en quelques minutes au lieu de quelques heures

### 5. robots.txt

Ajouter dans `public/robots.txt` :

```
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://www.countrymusic-hub.com/sitemap.xml
Sitemap: https://www.countrymusic-hub.com/news-sitemap.xml

# Google News Bot
User-agent: Googlebot-News
Allow: /news-plus/
```

## 🚀 Optimisations SEO supplémentaires

### Schema.org NewsArticle
✅ Déjà implémenté dans `NewsArticlePage.tsx`

### Meta tags Open Graph
✅ Déjà implémenté avec images featured

### URLs SEO-friendly
✅ Format : `/news-plus/taylor-swift-hall-fame-2026`

### Vitesse de chargement
- Images optimisées
- Lazy loading
- Cache Vercel

## 📊 Monitoring

### Vérifier l'indexation
```bash
# Vérifier si Google a indexé un article
site:countrymusic-hub.com/news-plus/[slug]
```

### Logs Supabase
- Edge Function `generate-news-plus` : logs de génération
- Edge Function `news-plus-sitemap` : logs de sitemap

### Google Search Console
- Couverture → Vérifier les pages indexées
- Performance → Suivre les impressions et clics

## ⚡ Délais d'indexation attendus

- **Sans optimisation** : 1-7 jours
- **Avec sitemap classique** : 1-3 jours
- **Avec Google News Sitemap** : 1-24 heures
- **Avec ping automatique** : 1-12 heures
- **Avec API Indexing** : 5-60 minutes

## 🔄 Maintenance

Le système est entièrement automatisé :
1. Génération d'articles toutes les 2 heures
2. Mise à jour automatique du sitemap
3. Ping automatique vers Google
4. Pas d'intervention manuelle nécessaire

## 📝 Checklist de déploiement

- [ ] Déployer `news-plus-sitemap` Edge Function
- [ ] Ajouter redirection dans `vercel.json`
- [ ] Mettre à jour `robots.txt`
- [ ] Ajouter sitemap dans Google Search Console
- [ ] Soumettre à Google News (optionnel)
- [ ] Tester l'URL du sitemap
- [ ] Vérifier les logs Supabase

## 🎯 Résultat attendu

Avec cette configuration, vos articles News+ seront :
- ✅ Indexés par Google en moins de 24h
- ✅ Visibles dans Google News
- ✅ Optimisés pour le référencement
- ✅ Mis à jour automatiquement
