// Script pour tester le dataset Apify et diagnostiquer le problème de scraping Top 30
// Usage: node scripts/test-apify-dataset.js

const APIFY_DATASET_ID = 'x3o7mqIkieI0o9Kay';

async function testApifyDataset() {
  try {
    console.log('🔍 Test du dataset Apify pour le Top 30 Country...');
    console.log(`📊 Dataset ID: ${APIFY_DATASET_ID}`);
    
    // Test sans token d'abord
    const apiUrl = `https://api.apify.com/v2/datasets/${APIFY_DATASET_ID}/items?format=json`;
    console.log(`🌐 URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📥 Données reçues:');
    console.log('- Type:', typeof data);
    console.log('- Est un tableau:', Array.isArray(data));
    console.log('- Longueur:', data.length);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n📋 Premier objet:');
      console.log(JSON.stringify(data[0], null, 2));
      
      const firstObject = data[0];
      if (firstObject && firstObject.items) {
        console.log('\n🎵 Éléments du Top 30:');
        console.log('- Nombre d\'items:', firstObject.items.length);
        
        if (firstObject.items.length > 0) {
          console.log('- Premier item:', JSON.stringify(firstObject.items[0], null, 2));
          console.log('- Dernier item:', JSON.stringify(firstObject.items[firstObject.items.length - 1], null, 2));
        }
      } else {
        console.log('❌ Propriété "items" manquante dans le premier objet');
      }
    } else {
      console.log('❌ Données vides ou format invalide');
    }
    
    // Vérifier la date des données
    if (data[0] && data[0].timestamp) {
      const dataDate = new Date(data[0].timestamp);
      const now = new Date();
      const diffDays = Math.floor((now - dataDate) / (1000 * 60 * 60 * 24));
      console.log(`\n📅 Date des données: ${dataDate.toISOString()}`);
      console.log(`⏰ Âge des données: ${diffDays} jours`);
      
      if (diffDays > 7) {
        console.log('⚠️ ATTENTION: Les données semblent obsolètes (plus de 7 jours)');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    // Suggestions de diagnostic
    console.log('\n🔧 Suggestions de diagnostic:');
    console.log('1. Vérifier si le dataset Apify existe toujours');
    console.log('2. Vérifier si le scraper Apify fonctionne encore');
    console.log('3. Vérifier si la structure des données a changé');
    console.log('4. Considérer un scraping direct de la source');
  }
}

// Exécuter le test
testApifyDataset();
