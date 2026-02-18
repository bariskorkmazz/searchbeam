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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(feed)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
