import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Music, Video, Trophy, Rss } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { generateFAQSchema } from '../utils/seo';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // General
  {
    category: 'General',
    question: 'What is CountryMusic-Hub.com?',
    answer: 'CountryMusic-Hub.com is your #1 destination for country music content. We feature the latest official music videos from top artists, Billboard Top 30 country charts, breaking news from Nashville, and comprehensive artist profiles. Our content is automatically updated 24/7 using AI-powered curation to ensure you always have access to the freshest country music content.'
  },
  {
    category: 'General',
    question: 'Is CountryMusic-Hub.com free to use?',
    answer: 'Yes! CountryMusic-Hub.com is completely free to use. You can watch unlimited official music videos, check chart rankings, read news, and explore artist profiles without any subscription or payment required.'
  },
  {
    category: 'General',
    question: 'How often is the content updated?',
    answer: 'Our content is updated automatically throughout the day. Music videos are synced daily from official YouTube channels, the Top 30 chart is updated weekly following Billboard releases, and news is refreshed every few hours. This ensures you always have access to the latest country music content.'
  },
  // Videos
  {
    category: 'Videos',
    question: 'Where do the music videos come from?',
    answer: 'All music videos on CountryMusic-Hub.com are sourced directly from official artist YouTube channels. We only feature legitimate, official content including music videos, lyric videos, and live performances. This ensures high quality and supports the artists you love.'
  },
  {
    category: 'Videos',
    question: 'Can I watch videos directly on the site?',
    answer: 'Yes! You can watch any video directly on CountryMusic-Hub.com using our built-in YouTube player. Simply click the play button on any video thumbnail to start watching immediately without leaving the site.'
  },
  {
    category: 'Videos',
    question: 'How do I find videos from a specific artist?',
    answer: 'You can find videos from a specific artist by visiting their artist page. Use the search function on our Videos page, browse the All Artists directory, or click on any artist name throughout the site to see all their available content.'
  },
  // Charts
  {
    category: 'Charts',
    question: 'How is the Top 30 chart calculated?',
    answer: 'Our Top 30 Country Songs chart is based on official Billboard Hot Country Songs data. The chart combines streaming activity, radio airplay, and sales data to determine the ranking of the hottest country songs each week.'
  },
  {
    category: 'Charts',
    question: 'When is the chart updated?',
    answer: 'The Top 30 chart is updated weekly, typically on Tuesdays, following the official Billboard chart release. Check back every week to see the latest rankings and discover new chart-topping hits.'
  },
  {
    category: 'Charts',
    question: 'Can I listen to songs from the chart?',
    answer: 'Yes! Many songs on our chart include direct links to Apple Music where you can listen to the full track. Look for the "Listen" button next to each song to access the streaming link.'
  },
  // Artists
  {
    category: 'Artists',
    question: 'Which artists are featured on CountryMusic-Hub.com?',
    answer: 'We feature a wide range of country music artists from chart-topping superstars like Morgan Wallen, Luke Combs, and Zach Bryan to rising stars and legendary performers. Our artist directory includes everyone with official music videos or chart positions in our database.'
  },
  {
    category: 'Artists',
    question: 'How can I discover new artists?',
    answer: 'There are several ways to discover new artists: browse our All Artists directory, check the Top 30 chart for trending names, explore the "Similar Artists" sections on artist pages, or browse our New Releases page to find fresh content from both established and emerging artists.'
  },
  // Technical
  {
    category: 'Technical',
    question: 'Do I need to create an account?',
    answer: 'No account is required to use CountryMusic-Hub.com. All features including watching videos, checking charts, and reading news are available without registration.'
  },
  {
    category: 'Technical',
    question: 'Is the site mobile-friendly?',
    answer: 'Yes! CountryMusic-Hub.com is fully responsive and optimized for all devices including smartphones, tablets, and desktop computers. Enjoy the same great experience whether you\'re at home or on the go.'
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0]));
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];
  
  const filteredFaqs = activeCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Generate FAQ schema for SEO
  const faqSchema = generateFAQSchema(faqs.map(f => ({
    question: f.question,
    answer: f.answer
  })));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <SEOHead 
        title="FAQ - Frequently Asked Questions | CountryMusic-Hub.com"
        description="Find answers to common questions about CountryMusic-Hub.com. Learn about our music videos, Billboard charts, artist profiles, and how to get the most out of your country music experience."
        canonical="/faq"
        keywords="country music FAQ, CountryMusic-Hub help, country music questions, how to use CountryMusic-Hub"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'FAQ', url: '/faq' }
        ]}
      />

      {/* Inject FAQ schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <HelpCircle className="w-4 h-4 mr-2" />
          HELP CENTER
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions about CountryMusic-Hub.com and how to get the most out of your country music experience.
        </p>
      </header>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-4 mb-12" itemScope itemType="https://schema.org/FAQPage">
        {filteredFaqs.map((faq, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            itemScope
            itemType="https://schema.org/Question"
            itemProp="mainEntity"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              aria-expanded={openItems.has(index)}
            >
              <span className="font-semibold text-gray-800 pr-4" itemProp="name">
                {faq.question}
              </span>
              {openItems.has(index) ? (
                <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
              )}
            </button>
            {openItems.has(index) && (
              <div 
                className="px-6 pb-4"
                itemScope
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <p className="text-gray-600" itemProp="text">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <section className="bg-gray-50 rounded-xl p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/country-music-videos" className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <Video className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <span className="font-medium text-gray-800">Watch Videos</span>
          </Link>
          <Link to="/top-30-country-songs" className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <span className="font-medium text-gray-800">View Charts</span>
          </Link>
          <Link to="/country-music-news" className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <Rss className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <span className="font-medium text-gray-800">Read News</span>
          </Link>
          <Link to="/artists" className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
            <Music className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <span className="font-medium text-gray-800">Browse Artists</span>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Still Have Questions?</h2>
        <p className="text-gray-600 mb-4">
          Can't find what you're looking for? We're here to help!
        </p>
        <p className="text-gray-500 text-sm">
          CountryMusic-Hub.com is constantly improving. Check back regularly for new features and content.
        </p>
      </section>
    </div>
  );
}
