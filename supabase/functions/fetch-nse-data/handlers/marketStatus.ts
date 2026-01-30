
import { corsHeaders } from "../utils/cors.ts";

export async function getMarketStatus(req: Request) {
  try {
    // NSE trading hours are 9:15 AM - 3:30 PM IST
    // Converting to UTC (IST-5:30): 3:45 - 10:00 UTC
    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const day = now.getUTCDay();

    const isWeekend = day === 0 || day === 6; // Sunday or Saturday
    const isBeforeOpen = hour < 3 || (hour === 3 && minute < 45);
    const isAfterClose = hour > 10 || (hour === 10 && minute > 0);

    let status;
    let message;

    if (isWeekend) {
      status = 'closed';
      message = 'NSE is closed for the weekend';
    } else if (isBeforeOpen) {
      status = 'pre-open';
      message = 'NSE will open at 9:15 AM IST';
    } else if (isAfterClose) {
      status = 'post-close';
      message = 'NSE has closed for the day';
    } else {
      status = 'open';
      message = 'NSE is open for trading';
    }

    return new Response(
      JSON.stringify({
        status: status,
        marketState: status,
        marketStatus: message,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error('Error in getMarketStatus:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
}
