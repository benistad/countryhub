import { SEOHead } from '../components/SEOHead';
import VideosCountry from '../components/VideosCountry';

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <SEOHead 
        title="Official Country Music Videos | CountryMusic-Hub.com"
        description="Watch the latest official country music videos from top artists. Morgan Wallen, Luke Combs, Chris Stapleton, Zach Bryan and more. Updated daily from YouTube."
        canonical="/country-music-videos"
        keywords="country music videos, official music videos, country videos YouTube, country music clips, Nashville videos"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Country Music Videos', url: '/country-music-videos' }
        ]}
      />
      <VideosCountry />
    </div>
  );
}
