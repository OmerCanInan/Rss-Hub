const { JSDOM } = require("jsdom");
const url = 'https://tass.com/rss/v2.xml';

async function testFetch() {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      }
    });

    const xmlText = await response.text();
    
    const dom = new JSDOM("");
    const parser = new dom.window.DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML parse hatası:', parseError.textContent);
      return;
    }
    
    const items = xmlDoc.querySelectorAll('item');
    const newsList = [];

    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent || 'Başlıksız';
      let description = item.querySelector('description')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '#';
      const pubDateStr = item.querySelector('pubDate')?.textContent || new Date().toISOString();
      const localDate = new Date(pubDateStr);
      let imageUrl = null;
      const mediaContent = item.getElementsByTagName('media:content')[0];
      const mediaThumbnail = item.getElementsByTagName('media:thumbnail')[0];
      const enclosure = item.querySelector('enclosure');
      const imageNode = item.querySelector('image');
      const imageNodeUrl = item.querySelector('image > url');
      const contentEncoded = item.getElementsByTagName('content:encoded')[0];
      
      if (mediaContent && mediaContent.getAttribute('url')) {
        imageUrl = mediaContent.getAttribute('url');
      } else if (mediaThumbnail && mediaThumbnail.getAttribute('url')) {
        imageUrl = mediaThumbnail.getAttribute('url');
      } else if (enclosure && enclosure.getAttribute('url')) {
        imageUrl = enclosure.getAttribute('url');
      } else if (imageNodeUrl && imageNodeUrl.textContent) {
        imageUrl = imageNodeUrl.textContent.trim();
      } else if (imageNode && imageNode.textContent && imageNode.textContent.startsWith('http')) {
        imageUrl = imageNode.textContent.trim();
      } else {
        let combinedText = description + (contentEncoded ? contentEncoded.textContent : '');
        const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/i;
        const match = imgRegex.exec(combinedText);
        if (match && match[1]) {
          imageUrl = match[1];
        }
      }

      // Instead of relying on DOM logic like document.createElement for HTML stripping in node.js jsdom
      const plainTextDescription = description;

      newsList.push({
        title, link, imageUrl
      });
    });
    
    console.log('Mapping completed without errors. Count:', newsList.length);
    console.log('First item:', newsList[0]);
  } catch (err) {
    console.error('Mapping error:', err);
  }
}

testFetch();
