const url = 'https://www.aa.com.tr/tr/rss/default?cat=guncel&t=' + new Date().getTime();

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

    console.log('Status:', response.status);
    console.log('Headers:', response.headers);

    if (!response.ok) {
        console.error('Response not ok');
        return;
    }
    const text = await response.text();
    console.log('Text length:', text.length);
    console.log('First 100 chars:', text.substring(0, 100));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFetch();
