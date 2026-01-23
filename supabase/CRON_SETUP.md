# Configuration des Cron Jobs pour la Synchronisation Automatique

## Problème Identifié

Les synchronisations automatiques ne fonctionnaient pas car :

1. ❌ **Manque de cron job pour les charts** - La fonction `auto-sync-chart` existait mais n'était jamais appelée automatiquement
2. ⚠️ **Configuration de la clé service_role_key** - Les cron jobs nécessitent une configuration spéciale

## Cron Jobs Configurés

### 1. Chart Sync (PopVortex)
- **Fréquence** : 2 fois par semaine (Lundi et Jeudi à 9h EST)
- **Fonction** : `auto-sync-chart`
- **Migration** : `20250906_create_chart_cron.sql`

### 2. Top30 Sync (Apify)
- **Fréquence** : 2 fois par semaine (Lundi et Jeudi à 9h EST)
- **Fonction** : `auto-sync-top30`
- **Migration** : `20250906_create_top30_cron.sql`

### 3. Country Videos Sync (YouTube)
- **Fréquence** : Quotidien à 6h EST
- **Fonction** : `auto-sync-country-videos`
- **Migration** : `20250906_create_country_videos_cron.sql`

## Configuration Requise

### Étape 1 : Appliquer les Migrations

```bash
# Depuis le dossier du projet
supabase db push
```

Ou appliquez manuellement les migrations dans l'ordre :
1. `20250906_setup_service_role_key.sql`
2. `20250906_create_chart_cron.sql`
3. `20250906_create_top30_cron.sql`
4. `20250906_create_country_videos_cron.sql`

### Étape 2 : Configurer la Clé Service Role

#### Option A : Via le Dashboard Supabase (Recommandé)

1. Allez dans **Supabase Dashboard** > **Settings** > **API**
2. Copiez votre **service_role key** (secret)
3. Allez dans **SQL Editor** et exécutez :

```sql
INSERT INTO private.service_keys (key_name, key_value) 
VALUES ('service_role_key', 'VOTRE_CLE_SERVICE_ROLE_ICI')
ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value;
```

#### Option B : Via Variables d'Environnement

Si vous utilisez Supabase CLI en local, ajoutez dans `.env.local` :

```env
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

### Étape 3 : Vérifier les Cron Jobs

Exécutez cette requête SQL pour vérifier que les cron jobs sont bien créés :

```sql
SELECT 
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname IN ('chart-sync', 'top30-sync', 'country-videos-sync')
ORDER BY jobname;
```

Vous devriez voir 3 jobs actifs.

## Tests Manuels

### Tester le Chart Sync

```sql
SELECT trigger_chart_sync();
```

### Tester le Top30 Sync

```sql
SELECT trigger_top30_sync();
```

### Tester le Country Videos Sync

```sql
SELECT trigger_country_videos_sync();
```

## Vérifier l'Historique des Synchronisations

```sql
SELECT 
  sync_type,
  last_sync_at,
  sync_count,
  status,
  details
FROM sync_history
ORDER BY last_sync_at DESC;
```

## Monitoring des Cron Jobs

### Voir les logs d'exécution

```sql
SELECT 
  jobid,
  jobname,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobname IN ('chart-sync', 'top30-sync', 'country-videos-sync')
ORDER BY start_time DESC
LIMIT 20;
```

### Désactiver temporairement un cron job

```sql
-- Désactiver
SELECT cron.unschedule('chart-sync');

-- Réactiver
SELECT cron.schedule(
  'chart-sync',
  '0 9 * * 1,4',
  $$
  SELECT net.http_post(
    url := 'https://lkrintwlenbmtohilmrs.supabase.co/functions/v1/auto-sync-chart',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{"automated": true}'::jsonb
  ) as request_id;
  $$
);
```

## Dépannage

### Les cron jobs ne s'exécutent pas

1. **Vérifier que pg_cron est activé** :
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

2. **Vérifier que la clé service_role_key est configurée** :
```sql
SELECT key_name FROM private.service_keys WHERE key_name = 'service_role_key';
```

3. **Vérifier les logs des Edge Functions** dans le Dashboard Supabase

### Les synchronisations échouent

1. Vérifiez les logs dans **Supabase Dashboard** > **Edge Functions** > **Logs**
2. Testez manuellement les fonctions trigger
3. Vérifiez que les clés API (YouTube, Apify) sont valides

## Calendrier de Synchronisation

| Type | Fréquence | Horaire (EST) | Jours |
|------|-----------|---------------|-------|
| Charts PopVortex | 2x/semaine | 9h00 | Lundi, Jeudi |
| Top30 Apify | 2x/semaine | 9h00 | Lundi, Jeudi |
| Vidéos Country | Quotidien | 6h00 | Tous les jours |

## Notes Importantes

- Les horaires sont en **EST** (Eastern Standard Time)
- Les cron jobs utilisent des expressions UTC en interne
- La synchronisation des vidéos évite les heures de pointe (6h-22h seulement)
- Les syncs Top30 et Charts sont limités à 2x/semaine pour économiser les coûts API
