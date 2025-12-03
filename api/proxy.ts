import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url: targetUrl, originalParams, decodeParams } = req.query;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Construct the final URL with any original params
    let finalUrl = decodeURIComponent(targetUrl);
    if (originalParams && typeof originalParams === 'string') {
      if (decodeParams === 'true') {
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
      if (req.body) {
        options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const response = await fetch(finalUrl, options);

    // Check if the response is successful
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed with status: ${response.status}`,
      });
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
        return res.status(response.status).send(Buffer.from(arrayBuffer));
      }

      // For JSON responses
      if (contentType.includes('application/json')) {
        const data = await response.json();
        return res.status(response.status).json(data);
      }
    }

    // Default fallback to text for other content types
    const text = await response.text();
    res.setHeader('Content-Type', contentType || 'text/plain');
    return res.status(response.status).send(text);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}
