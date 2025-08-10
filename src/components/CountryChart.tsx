import React, { useState } from 'react';
import { Trophy, Music, User, Calendar, RefreshCw, TrendingUp, Award, Star, Bot } from 'lucide-react';
import { useCountryChart } from '../hooks/useCountryChart';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Composant pour afficher le classement country PopVortex parsé par GPT
 * 
 * Fonctionnalités:
 * - Affichage stylisé du classement (position en gras, titre souligné, artiste en italique)
 * - Mise en valeur du top 3 avec icônes spéciales
 * - Bouton de mise à jour avec parsing GPT en temps réel
 * - Design responsive et moderne
 * - Gestion des états de chargement et d'erreur
 */
export function CountryChart() {
  const { chart, loading, error, lastUpdate, updateChart } = useCountryChart();

  /**
   * Retourne l'icône appropriée selon la position dans le classement
   * @param {number} position - Position dans le classement
   * @returns {JSX.Element} Icône React
   */
  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Award className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Award className="w-6 h-6 text-amber-600" />;
    if (position <= 10) return <Star className="w-5 h-5 text-blue-500" />;
    return <TrendingUp className="w-5 h-5 text-gray-500" />;
  };

  /**
   * Retourne les classes CSS appropriées selon la position
   * @param {number} position - Position dans le classement
   * @returns {string} Classes CSS
   */
  const getPositionClass = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg';
    if (position === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-md';
    if (position === 3) return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 shadow-md';
    if (position <= 10) return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200';
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };

  /**
   * Retourne le badge de position coloré
   * @param {number} position - Position dans le classement
   * @returns {JSX.Element} Badge de position
   */
  const getPositionBadge = (position: number) => {
    let badgeClass = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium';
    
    if (position === 1) badgeClass += ' bg-yellow-100 text-yellow-800';
    else if (position === 2) badgeClass += ' bg-gray-100 text-gray-800';
    else if (position === 3) badgeClass += ' bg-amber-100 text-amber-800';
    else if (position <= 10) badgeClass += ' bg-blue-100 text-blue-800';
    else if (position <= 25) badgeClass += ' bg-green-100 text-green-800';
    else badgeClass += ' bg-purple-100 text-purple-800';

    return (
      <span className={badgeClass}>
        #{position}
      </span>
    );
  };

  // État de chargement
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LoadingSpinner />
        <p className="text-center text-gray-600 mt-4">Chargement du classement PopVortex...</p>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-red-500 text-sm">
            Chart will be updated automatically during the next scheduled sync
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête avec titre et informations */}
      <header className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Bot className="w-10 h-10 text-red-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800">Country Music Top 50 Chart</h1>
        </div>
        <p className="text-xl text-gray-600 mb-4">
          Official ranking of the best country songs, powered by AI
        </p>
        
        {/* Informations sur la dernière mise à jour */}
        {lastUpdate && (
          <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Last updated: {new Date(lastUpdate).toLocaleDateString('en-US')}</span>
          </div>
        )}

      </header>

      {/* Affichage du classement */}
      {chart.length === 0 ? (
        <section className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No chart data available
          </h3>
          <p className="text-gray-500 mb-6">
            Chart data will be updated automatically twice weekly
          </p>
        </section>
      ) : (
        <section className="space-y-3" itemScope itemType="https://schema.org/MusicPlaylist">
          <meta itemProp="name" content="Top 50 Country Songs" />
          <meta itemProp="description" content="Classement officiel des meilleures chansons country" />
          <meta itemProp="numTracks" content={chart.length.toString()} />
          {chart.map((entry) => (
            <article
              key={entry.id}
              className={`${getPositionClass(entry.position)} border rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
              itemScope 
              itemType="https://schema.org/MusicRecording"
            >
              <meta itemProp="position" content={entry.position.toString()} />
              <div className="flex items-center">
                {/* Position avec icône */}
                <div className="flex items-center justify-center w-16 h-16 mr-4">
                  <div className="text-center">
                    {getPositionIcon(entry.position)}
                    <div className="text-lg font-bold text-gray-700 mt-1">
                      #{entry.position}
                    </div>
                  </div>
                </div>

                {/* Informations de la chanson */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 truncate mb-1 underline decoration-2 decoration-red-500" itemProp="name">
                    {entry.title}
                  </h2>
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span className="italic truncate font-medium" itemProp="byArtist" itemScope itemType="https://schema.org/MusicGroup">
                      <span itemProp="name">{entry.artist}</span>
                    </span>
                  </div>
                </div>

                {/* Badge de position */}
                <div className="ml-4">
                  {getPositionBadge(entry.position)}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Footer avec informations sur la source */}
      <footer className="mt-12 text-center text-sm text-gray-500 border-t pt-6">
        <p>
          Data analyzed by AI from{' '}
          <a
            href="https://www.popvortex.com/music/charts/top-country-songs.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 underline font-medium"
          >
            official sources
          </a>
        </p>
        <p className="mt-2">
          {chart.length} songs • Intelligent AI analysis
        </p>
      </footer>
    </div>
  );
}