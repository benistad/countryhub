import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Tag, X, Star, Music, Trophy, Mic2, Newspaper, Filter } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { generateArtistSlug } from '../utils/seo';

interface NewsArticle {
  id: number;
  year: number;
  month: number;
  day: number;
  category: 'album' | 'tour' | 'award' | 'news';
  artist: string;
  title: string;
  excerpt: string;
  featured: boolean;
  tags: string[];
  slug: string;
}

const NEWS_DATA: NewsArticle[] = [
  { id: 1, year: 2026, month: 3, day: 11, category: "album", artist: "Zach Bryan", title: "Zach Bryan Announces His 5th Studio Album Coming This Summer", excerpt: "The Americana country phenomenon confirms a new project featuring unprecedented collaborations with Tyler Childers and Kacey Musgraves. The album is expected to showcase Bryan's signature raw storytelling while pushing creative boundaries.", featured: true, tags: ["album", "announcement"], slug: "zach-bryan-5th-album-summer-2026" },
  { id: 2, year: 2026, month: 3, day: 8, category: "award", artist: "Morgan Wallen", title: "Morgan Wallen Dominates Billboard Music Awards with 7 Nominations", excerpt: "The Nashville artist continues his chart dominance with an album that has remained in the top 10 for over 40 weeks. Wallen's unprecedented streaming numbers have redefined success metrics in country music.", featured: false, tags: ["award", "chart"], slug: "morgan-wallen-billboard-awards-2026" },
  { id: 3, year: 2026, month: 2, day: 22, category: "tour", artist: "Beyoncé", title: "Cowboy Carter Influence Continues: 3 New Tour Dates Added", excerpt: "Following the phenomenal success of her country pivot, Beyoncé adds dates in Nashville, Austin, and Raleigh this fall. The tour has broken records for country music crossover events.", featured: true, tags: ["tour", "crossover"], slug: "beyonce-cowboy-carter-tour-expansion" },
  { id: 4, year: 2026, month: 2, day: 15, category: "news", artist: "Chris Stapleton", title: "Chris Stapleton Reveals Battle with Vocal Injury", excerpt: "In a rare interview, the singer describes months of rehabilitation but confirms his return to touring in May. Stapleton's dedication to vocal health has become an inspiration for artists industry-wide.", featured: false, tags: ["health", "tour"], slug: "chris-stapleton-vocal-injury-recovery" },
  { id: 5, year: 2026, month: 1, day: 30, category: "album", artist: "Lainey Wilson", title: "Lainey Wilson: 'Bell Bottom Country' Makes Sales History", excerpt: "Certified triple platinum, the album redefines what mainstream country can embrace in terms of retro sound. Wilson's unique blend of classic country and modern production has created a new subgenre.", featured: false, tags: ["album", "platinum"], slug: "lainey-wilson-bell-bottom-country-triple-platinum" },
  { id: 6, year: 2026, month: 1, day: 12, category: "news", artist: "Luke Combs", title: "Luke Combs Signs Historic Deal with Universal Nashville", excerpt: "The contract, estimated at $60 million, is the largest ever signed in the label's history for a solo country artist. This deal reflects Combs' status as one of country music's most bankable stars.", featured: true, tags: ["business", "label"], slug: "luke-combs-universal-nashville-deal" },

  { id: 7, year: 2025, month: 12, day: 20, category: "award", artist: "Jelly Roll", title: "CMA Awards 2025: Jelly Roll Wins Artist of the Year", excerpt: "A meteoric rise in less than 3 years: the former rapper turned country icon takes home Nashville's highest honor. His authentic storytelling and powerful vocals have resonated with millions.", featured: true, tags: ["CMA", "award"], slug: "jelly-roll-cma-artist-of-the-year-2025" },
  { id: 8, year: 2025, month: 11, day: 14, category: "tour", artist: "Zach Bryan", title: "American Heartbreak Tour: 2 Million Tickets Sold in 48 Hours", excerpt: "An absolute record for an independent country artist. The 80-date North American tour has sparked unprecedented demand and secondary market prices.", featured: false, tags: ["tour", "record"], slug: "zach-bryan-american-heartbreak-tour-record" },
  { id: 9, year: 2025, month: 10, day: 5, category: "album", artist: "Kacey Musgraves", title: "'Deeper Well': Kacey Musgraves Redefines Genre Boundaries", excerpt: "The critically acclaimed album fuses country, folk, and new age influences, marking the artist as one of the most singular voices of her generation.", featured: false, tags: ["album", "review"], slug: "kacey-musgraves-deeper-well-review" },
  { id: 10, year: 2025, month: 9, day: 18, category: "news", artist: "Beyoncé", title: "'Cowboy Carter' Revolutionizes Country: A Cultural Phenomenon Decoded", excerpt: "Six months after its release, the album continues to spark debates and conversations about the identity of country music and its African-American roots.", featured: true, tags: ["crossover", "culture"], slug: "beyonce-cowboy-carter-cultural-impact" },
  { id: 11, year: 2025, month: 8, day: 3, category: "news", artist: "Taylor Swift", title: "The Eras Tour Nashville: Three Sold-Out Nights, Records Shattered", excerpt: "In her heart city, Taylor Swift unites 200,000 spectators over three nights and generates an estimated economic impact of $120 million for the Nashville area.", featured: false, tags: ["live", "record"], slug: "taylor-swift-eras-tour-nashville-2025" },
  { id: 12, year: 2025, month: 6, day: 29, category: "album", artist: "Post Malone", title: "Post Malone Surprises Nashville with 'F-1 Trillion' Country Album", excerpt: "Collaborations with Morgan Wallen, Blake Shelton, and Dolly Parton: the rapper delivers one of the most anticipated country crossover albums of the year.", featured: false, tags: ["album", "crossover"], slug: "post-malone-f1-trillion-country-album" },
  { id: 13, year: 2025, month: 4, day: 11, category: "award", artist: "Chris Stapleton", title: "Grammy 2025: Chris Stapleton Takes Home Three Awards", excerpt: "Best Country Album, Best Country Song, and Best Solo Vocal Performance for the Kentucky artist who confirms his status as a living legend.", featured: false, tags: ["Grammy", "award"], slug: "chris-stapleton-grammy-2025-triple-win" },

  { id: 14, year: 2024, month: 12, day: 15, category: "news", artist: "Oliver Anthony", title: "'Rich Men North of Richmond': The Viral Phenomenon Shaking Nashville", excerpt: "Recorded in a field, the song reaches #1 on all American charts without any major label support. Anthony's grassroots success has redefined artist discovery.", featured: true, tags: ["viral", "independent"], slug: "oliver-anthony-rich-men-north-richmond-viral" },
  { id: 15, year: 2024, month: 10, day: 22, category: "album", artist: "Lainey Wilson", title: "Lainey Wilson: 'Bell Bottom Country' Debuts at #1", excerpt: "The album debuts directly at the top of the Billboard 200, a first for a country album since Garth Brooks in 1990.", featured: false, tags: ["album", "chart"], slug: "lainey-wilson-bell-bottom-country-number-one" },
  { id: 16, year: 2024, month: 9, day: 8, category: "tour", artist: "Morgan Wallen", title: "One Thing at a Time Tour: The Most Lucrative Country Tour of 2024", excerpt: "With $180 million in revenue, Morgan Wallen shatters the record for the most profitable country tour in history.", featured: true, tags: ["tour", "record", "finance"], slug: "morgan-wallen-one-thing-at-a-time-tour-record" },
  { id: 17, year: 2024, month: 7, day: 4, category: "news", artist: "Jason Aldean", title: "'Try That in a Small Town': The Controversial Video Dividing America", excerpt: "The video, removed then restored on CMT, reignites debate about the values conveyed by mainstream country and its political positioning.", featured: false, tags: ["controversy", "politics"], slug: "jason-aldean-try-that-small-town-controversy" },
  { id: 18, year: 2024, month: 5, day: 20, category: "award", artist: "Lainey Wilson", title: "ACM Awards: Lainey Wilson Wins Female Artist of the Year", excerpt: "A crowning victory for the Louisiana native whose bell bottom aesthetic embodies a revival of classic country tinged with rock.", featured: false, tags: ["ACM", "award"], slug: "lainey-wilson-acm-female-artist-2024" },

  { id: 19, year: 2023, month: 11, day: 30, category: "album", artist: "Zach Bryan", title: "Zach Bryan: 'American Heartbreak' Breaks All Streaming Records", excerpt: "A triple-disc album of 34 tracks, it accumulates 1 billion streams in less than 6 months, an unprecedented feat for an independent country artist.", featured: true, tags: ["album", "streaming"], slug: "zach-bryan-american-heartbreak-streaming-record" },
  { id: 20, year: 2023, month: 10, day: 14, category: "news", artist: "Morgan Wallen", title: "Morgan Wallen's Triumphant Return After Suspension", excerpt: "One year after his suspension, the artist returns to the top of the charts and raises questions about artist accountability in country music.", featured: false, tags: ["comeback", "controversy"], slug: "morgan-wallen-comeback-2023" },
  { id: 21, year: 2023, month: 8, day: 7, category: "album", artist: "Chris Stapleton", title: "'Starting Over' Enters Top Country Albums of the Decade", excerpt: "Two years after its release, the album continues to break longevity records on streaming platforms, proof of enduring admiration.", featured: false, tags: ["album", "legacy"], slug: "chris-stapleton-starting-over-decade-best" },
  { id: 22, year: 2023, month: 4, day: 3, category: "award", artist: "Carly Pearce", title: "CMA 2023: Carly Pearce Wins Album of the Year", excerpt: "With '29: Written in Stone', the Kentucky artist delivers an autobiographical work about her divorce that touches millions of listeners.", featured: false, tags: ["CMA", "award"], slug: "carly-pearce-cma-album-of-the-year-2023" },

  { id: 23, year: 2022, month: 12, day: 10, category: "news", artist: "Dolly Parton", title: "Dolly Parton Declines Presidential Medal of Freedom and Explains Why", excerpt: "In a humble and rare gesture, the legendary singer refuses a presidential medal, feeling she hasn't 'earned it enough yet'.", featured: true, tags: ["Dolly", "culture"], slug: "dolly-parton-declines-medal-of-freedom" },
  { id: 24, year: 2022, month: 9, day: 25, category: "album", artist: "Kacey Musgraves", title: "'Star-Crossed': Kacey Musgraves Unveils Her Divorce Album Trilogy", excerpt: "Accompanied by a film on Paramount+, the concept album marks a break from traditional country and brings the artist closer to electronic pop.", featured: false, tags: ["album", "crossover"], slug: "kacey-musgraves-star-crossed-divorce-album" },
  { id: 25, year: 2022, month: 5, day: 18, category: "tour", artist: "Eric Church", title: "Eric Church Cancels Masters Night to Play for His Fans: The Viral Story", excerpt: "Refusing to share his night with a golf event, the artist honors his Columbia fans and becomes an icon of artistic integrity.", featured: false, tags: ["tour", "integrity"], slug: "eric-church-cancels-masters-for-fans" },

  { id: 26, year: 2021, month: 11, day: 18, category: "award", artist: "Miranda Lambert", title: "CMA 2021: Miranda Lambert Makes Awards History", excerpt: "With her 14th award in the female vocal category, Miranda Lambert surpasses Reba McEntire's historic record.", featured: true, tags: ["CMA", "record", "Miranda"], slug: "miranda-lambert-cma-record-2021" },
  { id: 27, year: 2021, month: 8, day: 24, category: "news", artist: "Industry", title: "Nashville Resists COVID: Recording Studios Adapt", excerpt: "Facing closures, Music Row producers develop temporary home studios, revolutionizing the creation process for country music.", featured: false, tags: ["COVID", "industry"], slug: "nashville-studios-covid-adaptation" },
  { id: 28, year: 2021, month: 3, day: 14, category: "album", artist: "Luke Bryan", title: "Luke Bryan Maintains Album Release Despite Global Pandemic", excerpt: "'Born Here Live Here Die Here' releases as planned in March 2021, with Luke Bryan opting for 100% digital promotion, first of many.", featured: false, tags: ["album", "COVID"], slug: "luke-bryan-born-here-pandemic-release" },
];

const CATEGORIES = [
  { id: "all", label: "All News", icon: Filter },
  { id: "album", label: "Albums", icon: Music },
  { id: "tour", label: "Tours", icon: Mic2 },
  { id: "award", label: "Awards", icon: Trophy },
  { id: "news", label: "Headlines", icon: Newspaper },
];

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021];

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  album: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  tour: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  award: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  news: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
};

function CategoryBadge({ category }: { category: string }) {
  const colors = CAT_COLORS[category] || CAT_COLORS.news;
  const cat = CATEGORIES.find(c => c.id === category);
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${colors.bg} ${colors.text} ${colors.border} border`}>
      {cat?.label || category}
    </span>
  );
}

function FeaturedCard({ article, onClick }: { article: NewsArticle; onClick: () => void }) {
  return (
    <article 
      onClick={onClick}
      className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-2xl p-8 cursor-pointer mb-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded">
          Featured
        </span>
        <CategoryBadge category={article.category} />
        <span className="text-sm text-gray-500 flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {MONTHS_EN[article.month - 1]} {article.day}, {article.year}
        </span>
      </div>
      
      <Link 
        to={`/artist/${generateArtistSlug(article.artist)}`}
        onClick={(e) => e.stopPropagation()}
        className="text-sm font-bold text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors"
      >
        {article.artist}
      </Link>
      
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2 mb-4 leading-tight">
        {article.title}
      </h2>
      
      <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
        {article.excerpt}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {article.tags.map(tag => (
          <span key={tag} className="text-sm text-gray-500 border border-gray-300 rounded px-2 py-1">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function NewsCard({ article, onClick }: { article: NewsArticle; onClick: () => void }) {
  return (
    <article 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:border-red-300 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={article.category} />
          <span className="text-xs text-gray-400">
            {MONTHS_EN[article.month - 1]} {article.day}
          </span>
        </div>
      </div>
      
      <Link 
        to={`/artist/${generateArtistSlug(article.artist)}`}
        onClick={(e) => e.stopPropagation()}
        className="text-xs font-bold text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors"
      >
        {article.artist}
      </Link>
      
      <h3 className="text-lg font-semibold text-gray-800 mt-1 mb-2 leading-snug line-clamp-2">
        {article.title}
      </h3>
      
      <p className="text-sm text-gray-500 line-clamp-3 mb-3">
        {article.excerpt}
      </p>
      
      <div className="flex flex-wrap gap-1">
        {article.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-xs text-gray-400">#{tag}</span>
        ))}
      </div>
    </article>
  );
}

function ArticleModal({ article, onClose }: { article: NewsArticle | null; onClose: () => void }) {
  if (!article) return null;
  
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <CategoryBadge category={article.category} />
          <span className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {MONTHS_EN[article.month - 1]} {article.day}, {article.year}
          </span>
        </div>
        
        <Link 
          to={`/artist/${generateArtistSlug(article.artist)}`}
          className="text-sm font-bold text-red-600 uppercase tracking-wider hover:text-red-700 transition-colors"
        >
          {article.artist}
        </Link>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3 mb-6 leading-tight">
          {article.title}
        </h2>
        
        <p className="text-gray-600 leading-relaxed mb-6 text-lg">
          {article.excerpt}
        </p>
        
        <p className="text-gray-500 leading-relaxed mb-8">
          This article is part of the CountryMusic-Hub.com archive. Explore more content about {article.artist} by visiting their dedicated artist page.
        </p>
        
        <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-200">
          {article.tags.map(tag => (
            <span key={tag} className="text-sm text-gray-500 border border-gray-300 rounded px-3 py-1">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="mt-8">
          <Link 
            to={`/artist/${generateArtistSlug(article.artist)}`}
            className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Music className="w-5 h-5 mr-2" />
            View {article.artist}'s Videos
          </Link>
        </div>
      </div>
    </div>
  );
}

function YearTimeline({ selectedYear, onSelect, counts }: { 
  selectedYear: number | null; 
  onSelect: (year: number | null) => void;
  counts: Record<number, number>;
}) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
      {YEARS.map((year, i) => {
        const active = selectedYear === year;
        return (
          <button 
            key={year} 
            onClick={() => onSelect(year === selectedYear ? null : year)}
            className={`flex-1 py-3 px-2 text-center transition-colors ${
              i > 0 ? 'border-l border-gray-200' : ''
            } ${
              active 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-500 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <div className="text-sm font-bold">{year}</div>
            <div className="text-xs opacity-70">{counts[year] || 0} news</div>
          </button>
        );
      })}
    </div>
  );
}

export default function NewsPlusPage() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const yearCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    NEWS_DATA.forEach(n => { counts[n.year] = (counts[n.year] || 0) + 1; });
    return counts;
  }, []);

  const filtered = useMemo(() => {
    return NEWS_DATA.filter(n => {
      if (selectedYear && n.year !== selectedYear) return false;
      if (selectedCat !== "all" && n.category !== selectedCat) return false;
      if (search) {
        const s = search.toLowerCase();
        return n.title.toLowerCase().includes(s) || 
               n.artist.toLowerCase().includes(s) || 
               n.tags.some(t => t.toLowerCase().includes(s));
      }
      return true;
    }).sort((a, b) => b.year - a.year || b.month - a.month || b.day - a.day);
  }, [selectedYear, selectedCat, search]);

  const featured = filtered.filter(n => n.featured && !selectedYear && selectedCat === "all" && !search).slice(0, 1);
  const regular = filtered.filter(n => !featured.includes(n));

  // Generate schema for SEO
  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Country Music News+ Archive",
    "description": "Curated country music news, album releases, tour announcements, and award coverage from Nashville and beyond.",
    "url": "https://countrymusic-hub.com/news-plus",
    "numberOfItems": NEWS_DATA.length,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <SEOHead 
        title="News+ - Country Music News Archive | CountryMusic-Hub.com"
        description={`Explore ${NEWS_DATA.length} curated country music articles. Album releases, tour announcements, awards coverage and industry news from Morgan Wallen, Zach Bryan, Luke Combs and more Nashville stars.`}
        canonical="/news-plus"
        keywords="country music news, Nashville news, country music articles, country album news, country tour news, country awards"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'News+', url: '/news-plus' }
        ]}
      />

      {/* Inject schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsSchema) }} />

      {/* Header */}
      {!selectedYear && selectedCat === "all" && !search && (
        <header className="text-center mb-10">
          <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4 mr-2" />
            CURATED CONTENT
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Country Music News+
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            In-depth coverage of Nashville and beyond. Albums, tours, awards, and industry insights.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            {NEWS_DATA.length} articles • 2021–2026
          </p>
        </header>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search artist, news, tag..."
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all bg-white"
        />
      </div>

      {/* Year Timeline */}
      <YearTimeline selectedYear={selectedYear} onSelect={setSelectedYear} counts={yearCounts} />

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => {
          const active = selectedCat === cat.id;
          const Icon = cat.icon;
          return (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                active 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
        {(selectedYear || selectedCat !== "all" || search) && (
          <button 
            onClick={() => { setSelectedYear(null); setSelectedCat("all"); setSearch(""); }}
            className="px-4 py-2 rounded-lg font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors ml-auto flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear filters
          </button>
        )}
      </div>

      {/* Results info */}
      {(selectedYear || selectedCat !== "all" || search) && (
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
          <div className="h-px flex-1 bg-gray-200" />
          <span>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {selectedYear ? ` in ${selectedYear}` : ''}
            {selectedCat !== "all" ? ` • ${CATEGORIES.find(c => c.id === selectedCat)?.label}` : ''}
            {search ? ` • "${search}"` : ''}
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {/* Featured */}
      {featured.length > 0 && (
        <FeaturedCard article={featured[0]} onClick={() => setSelectedArticle(featured[0])} />
      )}

      {/* Grid */}
      {regular.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regular.map(article => (
            <NewsCard key={article.id} article={article} onClick={() => setSelectedArticle(article)} />
          ))}
        </div>
      ) : filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No news found for these criteria.</p>
        </div>
      )}

      {/* SEO Content */}
      <section className="bg-gray-50 rounded-xl p-8 mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">About Country Music News+</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">
            News+ is our curated archive of country music journalism. We cover album releases, 
            tour announcements, award shows, and industry developments from Nashville's biggest 
            stars including Morgan Wallen, Zach Bryan, Luke Combs, Chris Stapleton, and Lainey Wilson.
          </p>
          <p className="text-gray-600">
            Each article is carefully written to provide context and insight beyond the headlines. 
            Use the filters above to explore by year, category, or search for specific artists and topics.
          </p>
        </div>
      </section>

      {/* Related Links */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Explore More</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/country-music-news" className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-blue-800">Live News Feed</span>
          </Link>
          <Link to="/country-music-videos" className="bg-red-50 hover:bg-red-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-red-800">Music Videos</span>
          </Link>
          <Link to="/top-30-country-songs" className="bg-yellow-50 hover:bg-yellow-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-yellow-800">Top 30 Chart</span>
          </Link>
          <Link to="/artists" className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 text-center transition-colors">
            <span className="font-medium text-purple-800">All Artists</span>
          </Link>
        </div>
      </section>

      {/* Modal */}
      <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </div>
  );
}
