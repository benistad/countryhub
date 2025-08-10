/*
  # Billboard Chart Sync Function

  1. Purpose
    - Scrapes Billboard charts (Hot 100, Country Songs, etc.)
    - Extracts chart data including position, title, artist
    - Stores data in billboard_chart table

  2. Features
    - Multiple chart support (Hot 100, Country, Rock, etc.)
    - Automatic duplicate detection
    - Chart history tracking
    - Position change tracking

  3. Usage
    - Called via cron job or manual trigger
    - Supports different chart types via parameters
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface BillboardEntry {
  position: number;
  title: string;
  artist: string;
  weeksOnChart?: number;
  peakPosition?: number;
  lastWeekPosition?: number;
}

const BILLBOARD_CHARTS = {
  'hot-100': 'https://www.billboard.com/charts/hot-100/',
  'country-songs': 'https://www.billboard.com/charts/country-songs/',
  'rock-songs': 'https://www.billboard.com/charts/rock-songs/',
  'pop-songs': 'https://www.billboard.com/charts/pop-songs/'
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const { load } = await import('npm:cheerio@1.0.0-rc.12');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get chart type from request body or default to hot-100
    const body = await req.json().catch(() => ({}));
    const chartType = body.chartType || 'hot-100';
    const chartUrl = BILLBOARD_CHARTS[chartType as keyof typeof BILLBOARD_CHARTS];

    if (!chartUrl) {
      throw new Error(`Chart type "${chartType}" not supported`);
    }

    console.log(`🎵 Scraping Billboard ${chartType} chart...`);

    // Fetch Billboard chart page
    const response = await fetch(chartUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching ${chartUrl}`);
    }

    const html = await response.text();
    const $ = load(html);

    console.log(`📄 HTML downloaded (${html.length} characters)`);

    // Parse chart entries
    const entries: BillboardEntry[] = [];
    
    // Billboard uses different selectors, try multiple patterns
    const selectors = [
      '.chart-results-list .chart-list-item',
      '.chart-list__element',
      '.chart-results-list li',
      '.o-chart-results-list__item'
    ];

    let chartItems: any = null;
    for (const selector of selectors) {
      chartItems = $(selector);
      if (chartItems.length > 0) {
        console.log(`✅ Found ${chartItems.length} items with selector: ${selector}`);
        break;
      }
    }

    if (!chartItems || chartItems.length === 0) {
      // Fallback: try to find any structured data
      console.log('⚠️ No chart items found with standard selectors, trying fallback...');
      
      // Look for JSON-LD structured data
      const jsonLdScript = $('script[type="application/ld+json"]').html();
      if (jsonLdScript) {
        try {
          const jsonData = JSON.parse(jsonLdScript);
          console.log('📊 Found JSON-LD data:', jsonData);
        } catch (e) {
          console.log('❌ Failed to parse JSON-LD data');
        }
      }

      throw new Error('No chart entries found on the page');
    }

    // Extract data from each chart item
    chartItems.each((index: number, element: any) => {
      try {
        const $item = $(element);
        
        // Try different patterns for position
        let position = index + 1; // fallback
        const positionSelectors = [
          '.chart-list-item__rank',
          '.chart-element__rank__number',
          '.chart-list__rank',
          '.o-chart-results-list__item__rank'
        ];
        
        for (const selector of positionSelectors) {
          const posText = $item.find(selector).text().trim();
          if (posText) {
            position = parseInt(posText) || position;
            break;
          }
        }

        // Try different patterns for title
        let title = '';
        const titleSelectors = [
          '.chart-list-item__title',
          '.chart-element__information__song',
          '.chart-list__title',
          '.o-chart-results-list__item__title'
        ];
        
        for (const selector of titleSelectors) {
          title = $item.find(selector).text().trim();
          if (title) break;
        }

        // Try different patterns for artist
        let artist = '';
        const artistSelectors = [
          '.chart-list-item__artist',
          '.chart-element__information__artist',
          '.chart-list__artist',
          '.o-chart-results-list__item__artist'
        ];
        
        for (const selector of artistSelectors) {
          artist = $item.find(selector).text().trim();
          if (artist) break;
        }

        // Extract additional data if available
        let weeksOnChart: number | undefined;
        let peakPosition: number | undefined;
        let lastWeekPosition: number | undefined;

        const weeksText = $item.find('.chart-element__weeks-on-chart, .chart-list__weeks').text().trim();
        if (weeksText) {
          weeksOnChart = parseInt(weeksText.replace(/\D/g, '')) || undefined;
        }

        const peakText = $item.find('.chart-element__peak-position, .chart-list__peak').text().trim();
        if (peakText) {
          peakPosition = parseInt(peakText.replace(/\D/g, '')) || undefined;
        }

        const lastWeekText = $item.find('.chart-element__last-week, .chart-list__last-week').text().trim();
        if (lastWeekText && lastWeekText !== '-') {
          lastWeekPosition = parseInt(lastWeekText.replace(/\D/g, '')) || undefined;
        }

        if (title && artist && position <= 100) {
          entries.push({
            position,
            title: cleanText(title),
            artist: cleanText(artist),
            weeksOnChart,
            peakPosition,
            lastWeekPosition
          });
        }
      } catch (error) {
        console.error(`Error parsing chart item ${index}:`, error);
      }
    });

    console.log(`🎯 Extracted ${entries.length} chart entries`);

    if (entries.length === 0) {
      throw new Error('No valid chart entries could be extracted');
    }

    // Save to database
    const today = new Date().toISOString().split('T')[0];
    
    // Delete existing entries for this chart and date
    const { error: deleteError } = await supabase
      .from('billboard_chart')
      .delete()
      .eq('chart_name', chartType)
      .eq('chart_date', today);

    if (deleteError) {
      console.warn('⚠️ Error deleting old entries:', deleteError);
    }

    // Insert new entries
    const dataToInsert = entries.map(entry => ({
      position: entry.position,
      title: entry.title,
      artist: entry.artist,
      chart_name: chartType,
      weeks_on_chart: entry.weeksOnChart,
      peak_position: entry.peakPosition,
      last_week_position: entry.lastWeekPosition,
      chart_date: today,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('billboard_chart')
      .insert(dataToInsert)
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Saved ${data?.length || 0} entries to database`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Billboard ${chartType} chart updated successfully`,
        chartType,
        entriesProcessed: entries.length,
        entriesSaved: data?.length || 0,
        timestamp: new Date().toISOString(),
        sampleEntries: entries.slice(0, 5) // Show first 5 entries as sample
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Billboard sync error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}