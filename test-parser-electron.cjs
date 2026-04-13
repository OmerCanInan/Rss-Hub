const { app, BrowserWindow } = require('electron');
const fs = require('fs');
app.whenReady().then(() => {
  const win = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true, contextIsolation: false } });
  const xml = fs.readFileSync('bht_feed.xml', 'utf8');
  win.webContents.executeJavaScript(`
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(\`${xml.replace(/`/g, '\\`')}\`, 'text/xml');
    const items = xmlDoc.querySelectorAll('item');
    let results = [];
    items.forEach(item => {
       const img = item.querySelector('image');
       results.push({
          hasImg: !!img,
          text: img ? img.textContent : null,
          innerHTML: img ? img.innerHTML : null
       });
    });
    results.slice(0,3);
  `).then(res => {
    console.log("Parsed in Chromium:", res);
    app.quit();
  }).catch(err => {
    console.error(err);
    app.quit();
  });
});
