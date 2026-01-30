
import { RAPIDAPI_HOST, RAPIDAPI_KEY, ALPHA_VANTAGE_API_KEY, API_FUNCTIONS } from "../utils/config.ts";
import { corsHeaders } from "../utils/cors.ts";

export async function getCryptoRate(req: Request, params: any) {
  try {
    console.log(`Fetching crypto rate data for params:`, params);
    
    const { from_currency = 'BTC', to_currency = 'USD' } = params;
    
    // First try CoinGecko API for more reliable data
    const geckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${from_currency.toLowerCase()}&vs_currencies=${to_currency.toLowerCase()}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    console.log(`Requesting from CoinGecko: ${geckoUrl}`);
    
    try {
      const geckoResponse = await fetch(geckoUrl);
      
      if (geckoResponse.ok) {
        const geckoData = await geckoResponse.json();
        console.log('CoinGecko response:', JSON.stringify(geckoData));
        
        if (geckoData && Object.keys(geckoData).length > 0 && geckoData[from_currency.toLowerCase()]) {
          const coinData = geckoData[from_currency.toLowerCase()];
          const result = {
            fromCurrency: from_currency.toUpperCase(),
            toCurrency: to_currency.toUpperCase(),
            exchangeRate: coinData[to_currency.toLowerCase()] || 0,
            lastRefreshed: new Date().toISOString(),
            timeZone: 'UTC',
            bidPrice: 0,
            askPrice: 0,
            marketCap: coinData[`${to_currency.toLowerCase()}_market_cap`] || 0,
            volume24h: coinData[`${to_currency.toLowerCase()}_24h_vol`] || 0,
            change24h: coinData[`${to_currency.toLowerCase()}_24h_change`] || 0,
            source: 'CoinGecko'
          };
          
          console.log('Returning CoinGecko data:', result);
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (geckoError) {
      console.error('CoinGecko API error:', geckoError);
    }
    
    // If CoinGecko fails, try Alpha Vantage
    console.log('CoinGecko failed, trying Alpha Vantage API');
    
    if (!ALPHA_VANTAGE_API_KEY) {
      console.error('ALPHA_VANTAGE_API_KEY is not configured');
      return createFallbackCryptoResponse(from_currency, to_currency);
    }
    
    // Alpha Vantage API call
    const directUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from_currency}&to_currency=${to_currency}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(`Requesting from Alpha Vantage API (masked key): ${directUrl.replace(ALPHA_VANTAGE_API_KEY, '***')}`);
    
    const directResponse = await fetch(directUrl);
    
    if (!directResponse.ok) {
      console.error(`Alpha Vantage API responded with status: ${directResponse.status}`);
      return createFallbackCryptoResponse(from_currency, to_currency);
    }

    const directData = await directResponse.json();
    console.log('Raw Alpha Vantage response:', JSON.stringify(directData));

    // Check for API rate limiting or other errors
    if (directData.Note || directData.Information || !directData['Realtime Currency Exchange Rate']) {
      console.log('Alpha Vantage API returned error or no data, falling back to RapidAPI');
      
      // Try RapidAPI as last resort
      if (!RAPIDAPI_KEY) {
        console.error('RAPIDAPI_KEY is not configured');
        return createFallbackCryptoResponse(from_currency, to_currency);
      }
      
      const rapidApiUrl = `https://alpha-vantage.p.rapidapi.com/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from_currency}&to_currency=${to_currency}`;
      console.log('Attempting RapidAPI fallback');
      
      const rapidApiResponse = await fetch(rapidApiUrl, {
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      });

      if (!rapidApiResponse.ok) {
        console.error(`RapidAPI responded with status: ${rapidApiResponse.status}`);
        return createFallbackCryptoResponse(from_currency, to_currency);
      }

      const rapidApiData = await rapidApiResponse.json();
      console.log('RapidAPI response:', JSON.stringify(rapidApiData));
      
      if (!rapidApiData['Realtime Currency Exchange Rate']) {
        console.log('No valid data from any API, using fallback');
        return createFallbackCryptoResponse(from_currency, to_currency);
      }
      
      return formatCryptoResponse(rapidApiData);
    }
    
    return formatCryptoResponse(directData);
    
  } catch (error) {
    console.error(`Error in getCryptoRate:`, error);
    return createFallbackCryptoResponse(params.from_currency || 'BTC', params.to_currency || 'USD');
  }
}

export async function getCryptoTimeSeries(req: Request, params: any) {
  try {
    console.log(`Fetching crypto time series data for params:`, params);
    
    const { symbol = 'BTC', market = 'USD', function: func = 'DIGITAL_CURRENCY_DAILY' } = params;
    
    // Try CoinGecko first for time series data
    const geckoUrl = `https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}/market_chart?vs_currency=${market.toLowerCase()}&days=7&interval=daily`;
    console.log('Attempting CoinGecko for time series');
    
    try {
      const geckoResponse = await fetch(geckoUrl);
      
      if (geckoResponse.ok) {
        const geckoData = await geckoResponse.json();
        console.log('CoinGecko time series response:', JSON.stringify(geckoData));
        
        if (geckoData.prices && Array.isArray(geckoData.prices)) {
          return new Response(
            JSON.stringify({
              symbol,
              market,
          prices: geckoData.prices.map(([timestamp, price]: [number, number]) => ({
            timestamp: new Date(timestamp).toISOString(),
            price
          })),
              metadata: {
                information: "Data from CoinGecko API",
                symbol,
                refreshed: new Date().toISOString()
              },
              source: 'CoinGecko'
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (geckoError) {
      console.error('CoinGecko time series API error:', geckoError);
    }
    
    // Fallback to Alpha Vantage if CoinGecko fails
    console.log('CoinGecko failed, trying Alpha Vantage API for time series');
    
    if (!ALPHA_VANTAGE_API_KEY) {
      console.error('ALPHA_VANTAGE_API_KEY is not configured for time series');
      return createFallbackTimeSeriesResponse(symbol, market);
    }
    
    // Alpha Vantage API call
    const directUrl = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&market=${market}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(`Requesting time series from Alpha Vantage API (masked key): ${directUrl.replace(ALPHA_VANTAGE_API_KEY, '***')}`);
    
    const directResponse = await fetch(directUrl);
    
    if (!directResponse.ok) {
      console.error(`Alpha Vantage API responded with status: ${directResponse.status}`);
      return createFallbackTimeSeriesResponse(symbol, market);
    }

    const directData = await directResponse.json();
    console.log('Raw time series response:', JSON.stringify(directData));

    if (Object.keys(directData).length === 0 || directData.Note || directData.Information) {
      console.log('No valid time series data from Alpha Vantage, using fallback');
      return createFallbackTimeSeriesResponse(symbol, market);
    }
    
    return formatTimeSeriesResponse(directData, symbol, market);
    
  } catch (error) {
    console.error(`Error in getCryptoTimeSeries:`, error);
    return createFallbackTimeSeriesResponse(params.symbol || 'BTC', params.market || 'USD');
  }
}

// Helper function to format crypto exchange rate response
function formatCryptoResponse(data: any) {
  try {
    const exchangeData = data['Realtime Currency Exchange Rate'];
    
    if (!exchangeData) {
      throw new Error('Missing exchange rate data');
    }
    
    const result = {
      fromCurrency: exchangeData['1. From_Currency Code'],
      toCurrency: exchangeData['3. To_Currency Code'],
      exchangeRate: parseFloat(exchangeData['5. Exchange Rate']),
      lastRefreshed: exchangeData['6. Last Refreshed'],
      timeZone: exchangeData['7. Time Zone'],
      bidPrice: parseFloat(exchangeData['8. Bid Price'] || '0'),
      askPrice: parseFloat(exchangeData['9. Ask Price'] || '0'),
      source: 'AlphaVantage'
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error formatting crypto response:', error);
    return createFallbackCryptoResponse();
  }
}

// Helper function to format time series response
function formatTimeSeriesResponse(data: any, symbol: string, market: string) {
  try {
    let timeSeriesKey = '';
    // Find the time series key in the response
    for (const key in data) {
      if (key.includes('Time Series') || key.includes('Digital Currency')) {
        timeSeriesKey = key;
        break;
      }
    }
    
    if (!timeSeriesKey || !data[timeSeriesKey]) {
      throw new Error('Missing time series data');
    }
    
    const timeSeries = data[timeSeriesKey];
    const timestamps = Object.keys(timeSeries).sort();
    
    const prices = timestamps.map((timestamp) => {
      // Different APIs might have different key structures
      const entry = timeSeries[timestamp];
      const closePrice = entry['4a. close (USD)'] || entry['4. close'] || entry['4b. close (USD)'] || '0';
      
      return {
        timestamp,
        price: parseFloat(closePrice)
      };
    });
    
    const result = {
      symbol,
      market,
      prices,
      metadata: data['Meta Data'] || {},
      source: 'AlphaVantage'
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error formatting time series response:', error);
    return createFallbackTimeSeriesResponse(symbol, market);
  }
}

// Helper function to generate fallback crypto exchange rate data
function createFallbackCryptoResponse(fromCurrency = 'BTC', toCurrency = 'USD') {
  const baseRate = fromCurrency === 'BTC' ? 67000 : 
                  fromCurrency === 'ETH' ? 3500 : 
                  fromCurrency === 'USDT' ? 1 : 
                  fromCurrency === 'BNB' ? 600 : 
                  Math.random() * 1000;
  
  // Add small random variation
  const exchangeRate = baseRate * (1 + (Math.random() * 0.02 - 0.01));
  
  const fallbackData = {
    fromCurrency,
    toCurrency,
    exchangeRate,
    lastRefreshed: new Date().toISOString(),
    timeZone: 'UTC',
    bidPrice: exchangeRate * 0.995,
    askPrice: exchangeRate * 1.005,
    marketCap: fromCurrency === 'BTC' ? 1300000000000 : 
              fromCurrency === 'ETH' ? 420000000000 : 
              fromCurrency === 'BNB' ? 93000000000 : 
              Math.random() * 100000000000,
    volume24h: fromCurrency === 'BTC' ? 25000000000 : 
              fromCurrency === 'ETH' ? 15000000000 : 
              fromCurrency === 'BNB' ? 2000000000 : 
              Math.random() * 5000000000,
    change24h: (Math.random() * 6) - 3,
    isFallback: true,
    source: 'Fallback'
  };
  
  console.log('Returning fallback crypto exchange rate data:', fallbackData);
  
  return new Response(
    JSON.stringify(fallbackData),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Helper function to generate fallback time series data
function createFallbackTimeSeriesResponse(symbol = 'BTC', market = 'USD') {
  const basePrice = symbol === 'BTC' ? 67000 : 
                   symbol === 'ETH' ? 3500 : 
                   symbol === 'USDT' ? 1 : 
                   symbol === 'BNB' ? 600 : 
                   Math.random() * 1000;
  
  const prices = [];
  const now = new Date();
  
  // Generate 30 days of data
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random price with a trend
    const randomFactor = 1 + ((Math.random() * 0.1) - 0.05);
    // Slightly decreasing trend for older dates
    const trendFactor = 1 - (i * 0.001);
    
    prices.push({
      timestamp: date.toISOString().split('T')[0],
      price: basePrice * randomFactor * trendFactor
    });
  }
  
  const fallbackData = {
    symbol,
    market,
    prices,
    metadata: {
      information: "Fallback data generated due to API limitations",
      symbol,
      refreshed: now.toISOString()
    },
    isFallback: true,
    source: 'Fallback'
  };
  
  console.log('Returning fallback time series data');
  
  return new Response(
    JSON.stringify(fallbackData),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
