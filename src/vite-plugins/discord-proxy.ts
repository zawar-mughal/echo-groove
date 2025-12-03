import type { Plugin } from 'vite';

export function discordProxyPlugin(): Plugin {
  return {
    name: 'discord-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/.proxy/api/proxy')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const targetUrl = url.searchParams.get('url');
        const originalParams = url.searchParams.get('originalParams');
        const decodeParams = url.searchParams.get('decodeParams') === 'true';

        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'URL parameter is required' }));
          return;
        }

        try {
          // Construct the final URL with any original params
          let finalUrl = decodeURIComponent(targetUrl);
          if (originalParams) {
            if (decodeParams) {
              finalUrl +=
                (finalUrl.includes('?') ? '&' : '?') +
                decodeURIComponent(originalParams);
            } else {
              finalUrl += (finalUrl.includes('?') ? '&' : '?') + originalParams;
            }
          }

          // Get cookies from incoming request
          const cookieHeader = req.headers.cookie;

          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          // Add cookie if present
          if (cookieHeader) {
            headers['cookie'] = cookieHeader;
          }

          const options: RequestInit = {
            method: req.method || 'GET',
            headers,
          };

          // Add body for non-GET methods
          if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const body = Buffer.concat(chunks).toString();
            if (body) {
              options.body = body;
            }
          }

          const response = await fetch(finalUrl, options);

          // Check if the response is successful
          if (!response.ok) {
            res.statusCode = response.status;
            res.end(
              JSON.stringify({ error: `Failed with status: ${response.status}` })
            );
            return;
          }

          // Get the content type from the response
          const contentType = response.headers.get('content-type');

          // Handle different content types
          if (contentType) {
            // For images or binary data
            if (
              contentType.includes('image/') ||
              contentType.includes('application/octet-stream') ||
              contentType.includes('binary/')
            ) {
              const arrayBuffer = await response.arrayBuffer();
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=300');
              res.statusCode = response.status;
              res.end(Buffer.from(arrayBuffer));
              return;
            }

            // For JSON responses
            if (contentType.includes('application/json')) {
              const data = await response.json();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = response.status;
              res.end(JSON.stringify(data));
              return;
            }
          }

          // Default fallback to text for other content types
          const text = await response.text();
          res.setHeader('Content-Type', contentType || 'text/plain');
          res.statusCode = response.status;
          res.end(text);
        } catch (error) {
          console.error('Proxy error:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to fetch data' }));
        }
      });
    },
  };
}
