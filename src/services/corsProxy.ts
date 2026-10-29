// Alternative CORS proxy service for when direct API access fails
export class CORSProxyService {
  private static readonly PROXY_URLS = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
  ];

  static async fetchWithProxy(url: string, options?: RequestInit): Promise<Response> {
    // Try direct request first
    try {
      return await fetch(url, {
        ...options,
        mode: 'cors',
      });
    } catch (error) {
      console.warn('Direct request failed, trying CORS proxy:', error);
    }

    // Try CORS proxy services
    for (const proxyUrl of this.PROXY_URLS) {
      try {
        console.log(`Trying proxy: ${proxyUrl}`);
        const response = await fetch(`${proxyUrl}${encodeURIComponent(url)}`, {
          ...options,
          mode: 'cors',
        });
        
        if (response.ok) {
          console.log(`Success with proxy: ${proxyUrl}`);
          return response;
        }
      } catch (error) {
        console.warn(`Proxy ${proxyUrl} failed:`, error);
        continue;
      }
    }

    throw new Error('All CORS proxy attempts failed');
  }
}
