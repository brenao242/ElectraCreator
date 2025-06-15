const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function getDomainName(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/\./g, '_');
  } catch (err) {
    return "ElectraApp";
  }
}

function createAppFromUrl(url, sendStatus) {
  const domainName = getDomainName(url);
  const appName = `${domainName}_${Date.now()}`;
  const dir = path.join(__dirname, appName);

  try {
    fs.mkdirSync(dir);
    sendStatus(`📁 Created folder: ${appName}`);
  } catch (err) {
    sendStatus(`❌ Error creating folder: ${err.message}`);
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${domainName}</title></head>
<body style="margin:0;padding:0;overflow:hidden">
  <webview src="${url}" style="width:100vw; height:100vh;" allowpopups></webview>
</body>
</html>`;

  const main = `
const { app, BrowserWindow, session } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      webviewTag: true
    }
  });

  win.loadFile('index.html');

  session.defaultSession.cookies.get({})
    .then(cookies => {
      console.log('🍪 Cookies:', cookies);
    });
}

app.whenReady().then(createWindow);
`;

  const pkg = {
    name: domainName,
    version: "1.0.0",
    main: "main.js",
    scripts: {
      start: "electron ."
    },
    dependencies: {}
  };

  try {
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    fs.writeFileSync(path.join(dir, 'main.js'), main);
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
    sendStatus("✅ Files written successfully");
  } catch (err) {
    sendStatus(`❌ File writing failed: ${err.message}`);
    return;
  }

  sendStatus("⚙️ Packaging to EXE...");

  exec(`npx electron-packager "${dir}" "${domainName}" --platform=win32 --arch=x64 --overwrite --out="${__dirname}/output"`, (err, stdout, stderr) => {
    if (err) {
      sendStatus(`❌ EXE build error: ${err.message}`);
    } else {
      sendStatus(`✅ EXE created in /output`);
    }
  });
}

module.exports = { createAppFromUrl };