import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Settings, Trophy, Rss, Video, Home } from 'lucide-react';
import { UpdateNotification } from './UpdateNotification';

export default function Layout() {
  const location = useLocation();
  const [showAdmin, setShowAdmin] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'loading';
  }>({ show: false, message: '', type: 'info' });

  // Check for admin access
  useEffect(() => {
    const isAdminPath = location.pathname === '/admin' || 
                        location.search.includes('admin=true');
    setShowAdmin(isAdminPath);
  }, [location]);

  // Admin keyboard shortcut (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setShowAdmin(true);
        setNotification({
          show: true,
          message: 'Admin panel activated',
          type: 'info'
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path: string) => 
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-red-100 text-red-700'
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-red-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <nav className="bg-white shadow-md sticky top-0 z-40" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center" aria-label="CountryMusic-Hub.com Home">
                <img 
                  src="/Canva 8 png.png" 
                  alt="" 
                  className="w-12 h-12 mr-2 object-contain"
                  loading="eager"
                />
                <div className="flex items-center">
                  <span className="text-xl font-bold text-gray-800">CountryMusic-Hub.com</span>
                  <span className="ml-2 px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full uppercase tracking-wide shadow-sm">
                    Beta
                  </span>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-1 md:space-x-4">
              <Link to="/" className={navLinkClass('/')} aria-label="Home">
                <Home className="w-4 h-4 inline mr-1" />
                <span className="hidden sm:inline">Home</span>
              </Link>

              <Link to="/country-music-videos" className={navLinkClass('/country-music-videos')} aria-label="Country Videos">
                <Video className="w-4 h-4 inline mr-1" />
                <span className="hidden sm:inline">Videos</span>
              </Link>

              <Link to="/country-music-news" className={navLinkClass('/country-music-news')} aria-label="Country News">
                <Rss className="w-4 h-4 inline mr-1" />
                <span className="hidden sm:inline">News</span>
              </Link>

              <Link to="/top-30-country-songs" className={navLinkClass('/top-30-country-songs')} aria-label="Top 30 Chart">
                <Trophy className="w-4 h-4 inline mr-1" />
                <span className="hidden sm:inline">Top 30</span>
              </Link>

              {showAdmin && (
                <Link to="/admin" className={navLinkClass('/admin')} aria-label="Admin Panel">
                  <Settings className="w-4 h-4 inline mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" role="main">
        <Outlet />
      </main>
      
      <footer className="bg-gray-800 text-white py-12 mt-16" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">CountryMusic-Hub.com</h3>
              <p className="text-gray-300 text-sm">
                Your #1 destination for country music news, official music videos and Billboard charts.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Sections</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/country-music-videos" className="hover:text-white transition-colors">Country Videos</Link></li>
                <li><Link to="/top-30-country-songs" className="hover:text-white transition-colors">Top 30 Chart</Link></li>
                <li><Link to="/country-music-news" className="hover:text-white transition-colors">Country News</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Popular Artists</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><Link to="/artist/morgan-wallen" className="hover:text-white transition-colors">Morgan Wallen</Link></li>
                <li><Link to="/artist/luke-combs" className="hover:text-white transition-colors">Luke Combs</Link></li>
                <li><Link to="/artist/chris-stapleton" className="hover:text-white transition-colors">Chris Stapleton</Link></li>
                <li><Link to="/artist/zach-bryan" className="hover:text-white transition-colors">Zach Bryan</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">About</h4>
              <p className="text-gray-300 text-sm">
                Content updated automatically 24/7. Data from official sources and analyzed by AI.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} CountryMusic-Hub.com. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      <UpdateNotification
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
