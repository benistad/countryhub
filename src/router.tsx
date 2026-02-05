import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy load pages for better performance
const Layout = lazy(() => import('./components/Layout'));
const HomePage = lazy(() => import('./pages/HomePage'));
const Top30Page = lazy(() => import('./pages/Top30Page'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const VideosPage = lazy(() => import('./pages/VideosPage'));
const ArtistPage = lazy(() => import('./pages/ArtistPage'));
const VideoPage = lazy(() => import('./pages/VideoPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
// Long-tail SEO pages
const NewReleasesPage = lazy(() => import('./pages/NewReleasesPage'));
const BestOf2025Page = lazy(() => import('./pages/BestOf2025Page'));
const CountryLyricsPage = lazy(() => import('./pages/CountryLyricsPage'));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner />
    </div>
  );
}

// Router configuration with SEO-friendly URLs
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <Layout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'top-30-country-songs',
        element: (
          <Suspense fallback={<PageLoader />}>
            <Top30Page />
          </Suspense>
        ),
      },
      {
        path: 'country-music-news',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NewsPage />
          </Suspense>
        ),
      },
      {
        path: 'country-music-videos',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VideosPage />
          </Suspense>
        ),
      },
      // Programmatic SEO: Dynamic artist pages
      {
        path: 'artist/:artistSlug',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ArtistPage />
          </Suspense>
        ),
      },
      // Programmatic SEO: Dynamic video pages
      {
        path: 'video/:videoSlug',
        element: (
          <Suspense fallback={<PageLoader />}>
            <VideoPage />
          </Suspense>
        ),
      },
      // Long-tail SEO pages
      {
        path: 'new-country-music-releases',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NewReleasesPage />
          </Suspense>
        ),
      },
      {
        path: 'best-country-songs-2025',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BestOf2025Page />
          </Suspense>
        ),
      },
      {
        path: 'country-lyrics-videos',
        element: (
          <Suspense fallback={<PageLoader />}>
            <CountryLyricsPage />
          </Suspense>
        ),
      },
      // Admin (hidden)
      {
        path: 'admin',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminPage />
          </Suspense>
        ),
      },
      // 404 page
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
