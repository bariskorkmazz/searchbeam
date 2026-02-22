const Parser = require('rss-parser');
const parser = new Parser();

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
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
    
    // Wrap response in same format as allorigins
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        contents: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
${feed.items.map(item => `
  <item>
    <title>${item.title || ''}</title>
    <link>${item.link || ''}</link>
    <pubDate>${item.pubDate || ''}</pubDate>
    <description>${(item.contentSnippet || item.content || '').substring(0, 200)}</description>
  </item>
`).join('')}
</channel>
</rss>`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
