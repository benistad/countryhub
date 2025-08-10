import React, { useState, useEffect } from 'react';
import { Music, ExternalLink, Trophy, Calendar, Loader, RefreshCw, Database } from 'lucide-react';
import { SEOHead } from './SEOHead';
import { useTop30 } from '../hooks/useTop30';

/**
 * Page Top 30 Country - Affiche les données depuis Supabase (synchronisées depuis Apify)
 * 
 * Fonctionnalités:
 * - Affichage des données depuis Supabase
 * - Synchronisation manuelle depuis Apify
 * - Affichage en tableau avec rang, titre, artiste et lien Apple Music
 * - Gestion des états de chargement et d'erreur
 * - Design responsive avec Tailwind CSS
 * - Économie de coûts Apify (sync 2x/semaine seulement)
 */
export function Top30Page() {
  const { items, loading, error, lastUpdate, refetch, getStats } = useTop30();
  
  const stats = getStats();

  /**
   * Formate la date de dernière mise à jour
   */
  const formatLastUpdate = (): string => {
    if (!lastUpdate) return '';
    
    try {
      const date = new Date(lastUpdate);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <SEOHead 
          title="Top 30 Country - Chargement..."
          description="Chargement du classement Top 30 des meilleures chansons country."
          canonical="/top30"
        />
        
        <div className="text-center py-12">
          <Loader className="w-12 h-12 text-red-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Chargement...</h1>
          <p className="text-gray-600">Récupération des données depuis Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <SEOHead 
          title="Top 30 Country - Erreur"
          description="Erreur lors du chargement du classement Top 30 Country."
          canonical="/top30"
        />
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Top 30 Country</h1>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6" itemScope itemType="https://schema.org/MusicPlaylist">
      <SEOHead 
        title="Top 30 Country - Classement des Meilleures Chansons Country"
        description="Découvrez le Top 30 des meilleures chansons country du moment. Classement mis à jour régulièrement avec liens Apple Music."
        canonical="/top30"
      />

      {/* En-tête */}
      <header className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="w-10 h-10 text-yellow-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800" itemProp="name">Top 30 Country</h1>
        </div>
        <p className="text-xl text-gray-600 mb-4" itemProp="description">
          Le classement des 30 meilleures chansons country du moment
        </p>
        
        {lastUpdate && (
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Dernière synchronisation: {formatLastUpdate()}</span>
          </div>
        )}
        
      </header>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Chansons</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
            <Music className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avec Apple Music</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.withAppleMusic}
              </p>
            </div>
            <ExternalLink className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Artistes Uniques</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.uniqueArtists}
              </p>
            </div>
            <Trophy className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Tableau du Top 30 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Classement Top 30 Country
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artiste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apple Music
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr 
                  key={`${item.rank}-${index}`} 
                  className="hover:bg-gray-50 transition-colors duration-150"
                  itemScope 
                  itemType="https://schema.org/MusicRecording"
                >
                  {/* Rang */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                        item.rank === 1 ? 'bg-yellow-500' :
                        item.rank === 2 ? 'bg-gray-400' :
                        item.rank === 3 ? 'bg-amber-600' :
                        item.rank <= 10 ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}>
                        {item.rank}
                      </div>
                    </div>
                  </td>
                  
                  {/* Titre */}
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900" itemProp="name">
                      {item.title}
                    </div>
                  </td>
                  
                  {/* Artiste */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900" itemProp="byArtist" itemScope itemType="https://schema.org/MusicGroup">
                      <span itemProp="name">{item.artist}</span>
                    </div>
                  </td>
                  
                  {/* Apple Music */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.apple_music_url ? (
                      <a
                        href={item.apple_music_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors duration-200"
                        aria-label={`Écouter ${item.title} sur Apple Music`}
                      >
                        <Music className="w-3 h-3 mr-1" />
                        Écouter
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer avec informations */}
      <footer className="mt-8 text-center text-sm text-gray-500 border-t pt-6">
        <p>
          <Database className="w-4 h-4 inline mr-1" />
          Données stockées dans Supabase • Synchronisées depuis Apify 2x/semaine
        </p>
        <p className="mt-2">
          {items.length} chansons • Prochaine sync: Lundi ou Jeudi à 9h EST
        </p>
        <p className="mt-1 text-xs">
          💰 Économie de coûts Apify grâce à la synchronisation limitée
        </p>
      </footer>
    </div>
  );
}