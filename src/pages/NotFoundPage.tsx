import { Link } from 'react-router-dom';
import { Home, Video, Trophy, Rss } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';

export default function NotFoundPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 text-center py-16">
      <SEOHead 
        title="Page Not Found | CountryMusic-Hub.com"
        description="The page you're looking for doesn't exist. Explore country music news, videos and charts on CountryMusic-Hub.com"
        canonical="/404"
        noindex={true}
      />

      <div className="mb-8">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-xl text-gray-600 max-w-lg mx-auto">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-8 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Explore CountryMusic-Hub.com</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/" 
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <Home className="w-8 h-8 text-red-600 mb-2" />
            <span className="font-medium text-gray-800">Home</span>
          </Link>
          
          <Link 
            to="/country-music-videos" 
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <Video className="w-8 h-8 text-red-600 mb-2" />
            <span className="font-medium text-gray-800">Videos</span>
          </Link>
          
          <Link 
            to="/country-music-news" 
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <Rss className="w-8 h-8 text-red-600 mb-2" />
            <span className="font-medium text-gray-800">News</span>
          </Link>
          
          <Link 
            to="/top-30-country-songs" 
            className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="font-medium text-gray-800">Top 30</span>
          </Link>
        </div>
      </div>

      <Link 
        to="/" 
        className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
      >
        <Home className="w-5 h-5 mr-2" />
        Back to Home
      </Link>
    </div>
  );
}
