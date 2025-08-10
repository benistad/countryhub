import React, { useEffect } from 'react';
import { Rss } from 'lucide-react';

/**
 * Composant pour afficher les actualités country avec le widget RSS.app
 * 
 * Fonctionnalités:
 * - Iframe RSS.app intégré directement
 * - Design moderne et responsive
 */
export function CountryNews() {
  useEffect(() => {
    // Charger le script RSS.app s'il n'est pas déjà présent
    if (!document.querySelector('script[src="https://widget.rss.app/v1/list.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://widget.rss.app/v1/list.js';
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6" itemScope itemType="https://schema.org/NewsMediaOrganization">
      {/* En-tête avec titre */}
      <header className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Rss className="w-10 h-10 text-orange-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-800" itemProp="name">Country Music News</h1>
        </div>
        <p className="text-xl text-gray-600 mb-4" itemProp="description">
          Latest news from the country music industry
        </p>
        <p className="text-sm text-gray-500">
          RSS feed automatically updated
        </p>
      </header>

      {/* Iframe RSS.app */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" role="main">
        <div id="rss-widget-container">
          <rssapp-list id="t688IImTmg3OsguX"></rssapp-list>
        </div>
      </section>

      {/* Footer avec informations */}
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>
          Widget powered by{' '}
          <a
            href="https://rss.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 underline font-medium"
          >
            RSS.app
          </a>
        </p>
        <p className="mt-2">
          Country music news updated automatically 24/7
        </p>
      </footer>
    </div>
  );
}