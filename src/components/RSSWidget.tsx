import { useEffect } from 'react';
import { Rss } from 'lucide-react';

// Déclaration TypeScript pour l'élément personnalisé RSS.app
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'rssapp-list': {
        id: string;
        children?: React.ReactNode;
      };
    }
  }
}

interface RSSWidgetProps {
  /** ID du widget RSS.app */
  widgetId: string;
  /** Titre du widget */
  title?: string;
  /** Description du widget */
  description?: string;
  /** Classe CSS personnalisée */
  className?: string;
  /** Afficher l'en-tête */
  showHeader?: boolean;
  /** Afficher le footer */
  showFooter?: boolean;
}

/**
 * Composant widget RSS réutilisable utilisant RSS.app
 * 
 * @param widgetId - ID du widget RSS.app (ex: "tXtJP37l6HNOcaq5")
 * @param title - Titre affiché au-dessus du widget
 * @param description - Description sous le titre
 * @param className - Classes CSS personnalisées
 * @param showHeader - Afficher l'en-tête avec titre/description
 * @param showFooter - Afficher le footer avec attribution RSS.app
 */
export function RSSWidget({ 
  widgetId, 
  title = "RSS Feed",
  description = "Latest updates",
  className = "",
  showHeader = true,
  showFooter = true
}: RSSWidgetProps) {
  
  useEffect(() => {
    // Charger le script RSS.app s'il n'est pas déjà présent
    if (!document.querySelector('script[src="https://widget.rss.app/v1/list.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://widget.rss.app/v1/list.js';
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      console.log('📡 Script RSS.app chargé pour le widget:', widgetId);
    }
  }, [widgetId]);

  return (
    <div className={`max-w-6xl mx-auto ${className}`} itemScope itemType="https://schema.org/NewsMediaOrganization">
      {/* En-tête optionnel */}
      {showHeader && (
        <header className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <Rss className="w-8 h-8 text-orange-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-800" itemProp="name">
              {title}
            </h2>
          </div>
          <p className="text-lg text-gray-600 mb-3" itemProp="description">
            {description}
          </p>
          <p className="text-sm text-gray-500">
            RSS feed automatically updated
          </p>
        </header>
      )}

      {/* Widget RSS.app */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4" role="main">
        <div id={`rss-widget-container-${widgetId}`}>
          <rssapp-list id={widgetId}></rssapp-list>
        </div>
      </section>

      {/* Footer optionnel */}
      {showFooter && (
        <footer className="mt-6 text-center text-sm text-gray-500">
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
        </footer>
      )}
    </div>
  );
}

/**
 * Widget RSS spécialisé pour les news avec votre ID
 */
export function NewsRSSWidget() {
  return (
    <RSSWidget
      widgetId="tXtJP37l6HNOcaq5"
      title="Country Music News"
      description="Latest news from the country music industry"
      className="p-6"
    />
  );
}
