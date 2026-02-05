import { SEOHead } from '../components/SEOHead';
import { GoogleNewsRSS } from '../components/GoogleNewsRSS';

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <SEOHead 
        title="Country Music News - Latest Updates | CountryMusic-Hub.com"
        description="Stay updated with the latest country music news, artist updates, album releases and industry insights. Fresh content updated hourly from Nashville and beyond."
        canonical="/country-music-news"
        keywords="country music news, Nashville news, country music industry, country artists news, country music updates"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Country Music News', url: '/country-music-news' }
        ]}
      />
      <GoogleNewsRSS />
    </div>
  );
}
