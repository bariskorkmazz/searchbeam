const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'SearchBeam/1.0'
  }
});

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'RSS URL required' });
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
    
    return res.status(200).json({ contents: xmlResponse });
  } catch (error) {
    console.error('RSS fetch error:', error);
    return res.status(500).json({ 
      error: error.message,
      url: url 
    });
  }
}
