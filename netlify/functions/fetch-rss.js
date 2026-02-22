const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'SearchBeam/1.0'
  }
});

// HTML escape helper
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { url } = event.queryStringParameters || {};
  
  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'RSS URL required' })
    };
  }

  try {
    const feed = await parser.parseURL(url);
    
    const items = feed.items.slice(0, 15).map(item => {
      const title = escapeXml(item.title || 'Untitled');
      const link = escapeXml(item.link || '');
      const pubDate = item.pubDate || item.isoDate || new Date().toISOString();
      const description = escapeXml((item.contentSnippet || item.content || item.summary || '').substring(0, 300));
      
      return `  <item>
    <title>${title}</title>
    <link>${link}</link>
    <pubDate>${pubDate}</pubDate>
    <description>${description}</description>
  </item>`;
    });
    
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
${items.join('\n')}
</channel>
</rss>`;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ contents: xmlResponse })
    };
  } catch (error) {
    console.error('RSS fetch error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        url: url 
      })
    };
  }
};
