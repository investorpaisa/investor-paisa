
import { RAPIDAPI_HOST, RAPIDAPI_KEY, API_FUNCTIONS } from "../utils/config.ts";
import { corsHeaders } from "../utils/cors.ts";

export async function getForexRate(req: Request, params: { from_currency: string; to_currency: string }) {
  try {
    const { from_currency = 'USD', to_currency = 'INR' } = params;
    
    console.log(`Fetching forex rate for ${from_currency} to ${to_currency}`);
    
    const url = `https://${RAPIDAPI_HOST}/query?function=${API_FUNCTIONS.FOREX.RATE}&from_currency=${from_currency}&to_currency=${to_currency}`;
    
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
    console.log('Forex rate response:', JSON.stringify(data));
    
    if (!data || !data['Realtime Currency Exchange Rate']) {
      console.error('Invalid forex data format received');
      throw new Error('Invalid forex data format received');
    }
    
    const rateData = data['Realtime Currency Exchange Rate'];
    
    // Format the response
    const result = {
      fromCurrency: rateData['1. From_Currency Code'] || from_currency,
      toCurrency: rateData['3. To_Currency Code'] || to_currency,
      exchangeRate: parseFloat(rateData['5. Exchange Rate']) || 0,
      lastRefreshed: rateData['6. Last Refreshed'] || new Date().toISOString(),
      timeZone: rateData['7. Time Zone'] || 'UTC',
      bidPrice: parseFloat(rateData['8. Bid Price'] || '0'),
      askPrice: parseFloat(rateData['9. Ask Price'] || '0'),
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error(`Error fetching forex rate:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: `Failed to fetch forex rate: ${errorMessage}`,
        mockData: {
          fromCurrency: params.from_currency || 'USD',
          toCurrency: params.to_currency || 'INR',
          exchangeRate: 82.5, // Mock exchange rate for USD to INR
          lastRefreshed: new Date().toISOString(),
          timeZone: 'UTC',
          bidPrice: 82.45,
          askPrice: 82.55,
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

export async function getForexTimeSeries(req: Request, params: { 
  from_currency: string; 
  to_currency: string;
  interval?: string;
  period?: string;
}) {
  try {
    const { 
      from_currency = 'USD', 
      to_currency = 'INR',
      interval = '1day',
      period = 'daily'
    } = params;
    
    console.log(`Fetching forex time series for ${from_currency} to ${to_currency}, period: ${period}, interval: ${interval}`);
    
    // Determine which API function to use based on period
    let function_name;
    switch (period.toLowerCase()) {
      case 'intraday':
        function_name = API_FUNCTIONS.FOREX.INTRADAY;
        break;
      case 'weekly':
        function_name = API_FUNCTIONS.FOREX.WEEKLY;
        break;
      case 'monthly':
        function_name = API_FUNCTIONS.FOREX.MONTHLY;
        break;
      case 'daily':
      default:
        function_name = API_FUNCTIONS.FOREX.DAILY;
    }
    
    // Construct URL depending on whether it's intraday or not
    let url;
    if (period.toLowerCase() === 'intraday') {
      url = `https://${RAPIDAPI_HOST}/query?function=${function_name}&from_symbol=${from_currency}&to_symbol=${to_currency}&interval=${interval}&outputsize=compact`;
    } else {
      url = `https://${RAPIDAPI_HOST}/query?function=${function_name}&from_symbol=${from_currency}&to_symbol=${to_currency}&outputsize=compact`;
    }
    
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
    console.log('Forex time series response received');
    
    // Extract metadata and time series data
    const metaDataKey = Object.keys(data).find(key => key.includes('Meta Data'));
    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    
    if (!metaDataKey || !timeSeriesKey || !data[metaDataKey] || !data[timeSeriesKey]) {
      console.error('Invalid forex time series data format received');
      throw new Error('Invalid forex time series data format received');
    }
    
    const metaData = data[metaDataKey];
    const timeSeries = data[timeSeriesKey];
    
    // Convert time series data to array format
    const seriesData = Object.entries(timeSeries).map(([date, values]) => {
      const entry = values as Record<string, string>;
      return {
        date,
        open: parseFloat(entry['1. open'] || '0'),
        high: parseFloat(entry['2. high'] || '0'),
        low: parseFloat(entry['3. low'] || '0'),
        close: parseFloat(entry['4. close'] || '0')
      };
    });
    
    // Format the response
    const result = {
      metadata: {
        information: metaData['1. Information'] || 'Forex Time Series',
        fromCurrency: metaData['2. From Symbol'] || from_currency,
        toCurrency: metaData['3. To Symbol'] || to_currency,
        lastRefreshed: metaData['4. Last Refreshed'] || new Date().toISOString(),
        interval: metaData['5. Interval'] || interval,
        outputSize: metaData['6. Output Size'] || 'Compact',
        timeZone: metaData['7. Time Zone'] || 'UTC'
      },
      timeSeries: seriesData,
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error(`Error fetching forex time series:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: `Failed to fetch forex time series: ${errorMessage}`,
        mockData: {
          metadata: {
            information: 'Mock Forex Time Series',
            fromCurrency: params.from_currency || 'USD',
            toCurrency: params.to_currency || 'INR',
            lastRefreshed: new Date().toISOString(),
            interval: params.interval || '1day',
            outputSize: 'Compact',
            timeZone: 'UTC'
          },
          timeSeries: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
              date: date.toISOString().split('T')[0],
              open: 82.5 + (Math.random() * 2 - 1),
              high: 83 + (Math.random() * 2 - 1),
              low: 82 + (Math.random() * 2 - 1),
              close: 82.7 + (Math.random() * 2 - 1)
            };
          }),
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
