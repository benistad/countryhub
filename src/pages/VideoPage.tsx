import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, ExternalLink } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { useCountryVideos } from '../hooks/useCountryVideos';
import { generateVideoSchema, generateArtistSlug } from '../utils/seo';

export default function VideoPage() {
  const { videoSlug } = useParams<{ videoSlug: string }>();
  const { videos, loading } = useCountryVideos();

  // Find video by slug (artist-title format)
  const video = videos.find(v => {
    const slug = `${v.artist}-${v.title}`
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 80);
    return slug === videoSlug || v.video_id === videoSlug;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <SEOHead 
          title="Loading Video... | CountryMusic-Hub.com"
          description="Loading country music video..."
          canonical={`/video/${videoSlug}`}
        />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <SEOHead 
          title="Video Not Found | CountryMusic-Hub.com"
          description="The requested video could not be found."
          canonical={`/video/${videoSlug}`}
          noindex={true}
        />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Video Not Found</h1>
          <p className="text-gray-600 mb-6">The video you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/country-music-videos" 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse All Videos
          </Link>
        </div>
      </div>
    );
  }

  // Generate video schema
  const videoSchema = generateVideoSchema({
    title: video.title,
    description: `${video.title} by ${video.artist} - Official country music video`,
    thumbnailUrl: video.thumbnail_url || undefined,
    uploadDate: video.published_at,
    artist: video.artist,
    videoId: video.video_id,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <SEOHead 
        title={`${video.title} - ${video.artist} | CountryMusic-Hub.com`}
        description={`Watch "${video.title}" by ${video.artist}. Official country music video. Published ${formatDate(video.published_at)}.`}
        canonical={`/video/${videoSlug}`}
        keywords={`${video.title}, ${video.artist}, country music video, official video, ${video.artist} music video`}
        ogImage={video.thumbnail_url || undefined}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Videos', url: '/country-music-videos' },
          { name: video.artist, url: `/artist/${generateArtistSlug(video.artist)}` },
          { name: video.title, url: `/video/${videoSlug}` }
        ]}
      />

      {/* Inject video schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />

      {/* Back Navigation */}
      <Link 
        to="/country-music-videos" 
        className="inline-flex items-center text-gray-600 hover:text-red-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Videos
      </Link>

      {/* Video Player */}
      <div className="bg-black rounded-xl overflow-hidden shadow-2xl mb-8">
        <div className="relative aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${video.video_id}?rel=0`}
            title={video.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4" itemProp="name">
          {video.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
          <Link 
            to={`/artist/${generateArtistSlug(video.artist)}`}
            className="flex items-center hover:text-red-600 transition-colors"
          >
            <User className="w-5 h-5 mr-2" />
            <span className="font-medium">{video.artist}</span>
          </Link>
          
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            <span>{formatDate(video.published_at)}</span>
          </div>
        </div>

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          Watch on YouTube
        </a>
      </div>

      {/* Artist Link */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">More from {video.artist}</h2>
        <Link 
          to={`/artist/${generateArtistSlug(video.artist)}`}
          className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
        >
          View all videos by {video.artist}
          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
