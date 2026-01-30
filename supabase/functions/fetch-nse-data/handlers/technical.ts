
import { RAPIDAPI_HOST, RAPIDAPI_KEY, API_FUNCTIONS } from "../utils/config.ts";
import { corsHeaders } from "../utils/cors.ts";

export async function getTechnicalIndicator(req: Request, params: { 
  symbol: string;
  indicator: string;
  interval?: string;
  time_period?: number;
  series_type?: string;
}) {
  try {
    const { 
      symbol = 'MSFT', 
      indicator = 'SMA',
      interval = 'daily',
      time_period = 20,
      series_type = 'close'
    } = params;
    
    // Validate and get the correct indicator function
    const indicatorUpperCase = indicator.toUpperCase();
    const functionName = API_FUNCTIONS.TECHNICAL[indicatorUpperCase as keyof typeof API_FUNCTIONS.TECHNICAL];
    
    if (!functionName) {
      throw new Error(`Unsupported technical indicator: ${indicator}`);
    }
    
    console.log(`Fetching ${indicatorUpperCase} for ${symbol}, interval: ${interval}, period: ${time_period}`);
    
    const url = `https://${RAPIDAPI_HOST}/query?function=${functionName}&symbol=${symbol}&interval=${interval}&time_period=${time_period}&series_type=${series_type}`;
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });
    
    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`${indicatorUpperCase} response received`);
    
    // Extract metadata and indicator data
    const metaDataKey = Object.keys(data).find(key => key.includes('Meta Data'));
    const indicatorKey = Object.keys(data).find(key => key.includes('Technical Analysis'));
    
    if (!metaDataKey || !indicatorKey || !data[metaDataKey] || !data[indicatorKey]) {
      console.error('Invalid technical indicator data format received');
      throw new Error('Invalid technical indicator data format received');
    }
    
    const metaData = data[metaDataKey];
    const indicatorData = data[indicatorKey];
    
    // Convert indicator data to array format based on the type
    let seriesData;
    
    // Handle different indicator formats
    switch (indicatorUpperCase) {
      case 'MACD':
        seriesData = Object.entries(indicatorData).map(([date, values]) => {
          const entry = values as Record<string, string>;
          return {
            date,
            macd: parseFloat(entry.MACD || '0'),
            macdSignal: parseFloat(entry['MACD_Signal'] || '0'),
            macdHist: parseFloat(entry['MACD_Hist'] || '0')
          };
        });
        break;
      case 'BBANDS':
        seriesData = Object.entries(indicatorData).map(([date, values]) => {
          const entry = values as Record<string, string>;
          return {
            date,
            upperBand: parseFloat(entry['Real Upper Band'] || '0'),
            middleBand: parseFloat(entry['Real Middle Band'] || '0'),
            lowerBand: parseFloat(entry['Real Lower Band'] || '0')
          };
        });
        break;
      case 'STOCH':
        seriesData = Object.entries(indicatorData).map(([date, values]) => {
          const entry = values as Record<string, string>;
          return {
            date,
            slowK: parseFloat(entry['SlowK'] || '0'),
            slowD: parseFloat(entry['SlowD'] || '0')
          };
        });
        break;
      default:
        // Standard format for SMA, EMA, RSI, etc.
        seriesData = Object.entries(indicatorData).map(([date, values]) => {
          const entry = values as Record<string, string>;
          const indicatorValue = Object.values(entry)[0];
          return {
            date,
            value: parseFloat(indicatorValue || '0')
          };
        });
    }
    
    // Format the response
    const result = {
      metadata: {
        symbol: metaData['1: Symbol'] || symbol,
        indicator: metaData['2: Indicator'] || indicatorUpperCase,
        lastRefreshed: metaData['3: Last Refreshed'] || new Date().toISOString(),
        interval: metaData['4: Interval'] || interval,
        timePeriod: metaData['5: Time Period'] || time_period,
        seriesType: metaData['6: Series Type'] || series_type,
        timeZone: metaData['7: Time Zone'] || 'UTC'
      },
      indicatorData: seriesData,
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`Error fetching technical indicator:`, error);
    
    // Create mock data based on indicator type
    let mockData;
    switch (params.indicator?.toUpperCase()) {
      case 'MACD':
        mockData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            macd: Math.random() * 2 - 1,
            macdSignal: Math.random() * 1.5 - 0.75,
            macdHist: Math.random() * 0.5 - 0.25
          };
        });
        break;
      case 'BBANDS':
        mockData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const middle = 150 - i * 0.5 + Math.random() * 10 - 5;
          return {
            date: date.toISOString().split('T')[0],
            upperBand: middle + 10 + Math.random() * 5,
            middleBand: middle,
            lowerBand: middle - 10 - Math.random() * 5
          };
        });
        break;
      case 'STOCH':
        mockData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            slowK: 50 + Math.random() * 40 - 20,
            slowD: 50 + Math.random() * 30 - 15
          };
        });
        break;
      default:
        mockData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            value: 100 - i * 0.5 + Math.random() * 10 - 5
          };
        });
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: `Failed to fetch technical indicator: ${errorMessage}`,
        mockData: {
          metadata: {
            symbol: params.symbol || 'MSFT',
            indicator: params.indicator?.toUpperCase() || 'SMA',
            lastRefreshed: new Date().toISOString(),
            interval: params.interval || 'daily',
            timePeriod: params.time_period || 20,
            seriesType: params.series_type || 'close',
            timeZone: 'UTC'
          },
          indicatorData: mockData,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
}
