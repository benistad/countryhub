import React from 'react';
import { ExternalLink, Clock, Image as ImageIcon } from 'lucide-react';
import { useCountryNews } from '../hooks/useCountryNews';

export function NewsPreview() {
  const { news, loading, error } = useCountryNews();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-orange-800 mb-2">Unable to load news</h3>
        <p className="text-orange-600">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.slice(0, 3).map((item) => (
        <article 
          key={item.id} 
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
        >
          {/* Image */}
          <div className="aspect-video bg-gray-100 relative overflow-hidden">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            
            {/* Fallback si pas d'image */}
            <div 
              className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100 ${item.image_url ? 'hidden' : 'flex'}`}
            >
              <ImageIcon className="w-12 h-12 text-orange-400" />
            </div>
          </div>

          {/* Contenu */}
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-orange-600 transition-colors">
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {item.title}
              </a>
            </h3>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {item.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatDate(item.pub_date)}</span>
              </div>
              
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-orange-600 hover:text-orange-700 font-medium"
              >
                Read more
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/**
 * Formate la date de publication
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch {
    return 'Recently';
  }
}