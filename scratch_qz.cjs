const https = require('https');
https.get('https://qz.com/feed/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const pubDates = data.match(/<pubDate>(.*?)<\/pubDate>/g);
    if(pubDates) {
      console.log(pubDates.slice(0, 5));
    } else {
        console.log("no pub dates found");
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
