// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const storage = require('node-persist');

const app = express();
const port = 3000;

// Basis-URL für Links
const baseURL = "https://ihaveadream19.github.io/xalostore/";

// Ordnerpfade
const uploadsDir = path.join(__dirname, 'uploads');
const certsDir = path.join(__dirname, 'certs');
const signedDir = path.join(__dirname, 'signed');
const certsStoreDir = path.join(__dirname, 'certs_store');

// Upload-Ordner sicherstellen
[uploadsDir, certsDir, signedDir, certsStoreDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

// node-persist initialisieren
storage.init({ dir: certsStoreDir });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Multer für IPA-Uploads
const ipaUpload = multer({ dest: uploadsDir });
const certUpload = multer({ dest: certsDir });

// Zertifikat hochladen
app.post('/upload-cert', certUpload.single('cert'), async (req, res) => {
    const { password, certName } = req.body;

    if (!req.file || !password || !certName) {
        return res.status(400).json({ error: 'Fehlende Daten' });
    }

    const certPath = path.join(certsDir, req.file.originalname);
    fs.renameSync(req.file.path, certPath);

    // Metadaten speichern
    await storage.setItem(certName, {
        path: certPath,
        password,
        uploaded: Date.now()
    });

    res.json({ message: 'Zertifikat erfolgreich hochgeladen' });
});

// IPA signieren
app.post('/sign-ipa', ipaUpload.single('ipa'), async (req, res) => {
    const { certName } = req.body;
    const certData = await storage.getItem(certName);

    if (!req.file || !certData) {
        return res.status(400).json({ error: 'Fehlende IPA oder Zertifikat' });
    }

    const ipaPath = path.join(uploadsDir, req.file.originalname);
    fs.renameSync(req.file.path, ipaPath);

    const signedFileName = `${path.parse(req.file.originalname).name}-signed`;
    const signedIPAPath = path.join(signedDir, `${signedFileName}.ipa`);
    const plistPath = path.join(signedDir, `${signedFileName}.plist`);

    // Hier würdest du das echte Signier-Kommando einfügen
    exec(`cp "${ipaPath}" "${signedIPAPath}"`, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Fehler beim Signieren' });
        }

        // PLIST-Datei erstellen
        const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key>
          <string>software-package</string>
          <key>url</key>
          <string>${baseURL}signed/${signedFileName}.ipa</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key>
        <string>com.example.app</string>
        <key>bundle-version</key>
        <string>1.0</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>${signedFileName}</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>`;

        fs.writeFileSync(plistPath, plistContent);

        res.json({
            message: 'IPA signiert',
            installLink: `itms-services://?action=download-manifest&url=${baseURL}signed/${signedFileName}.plist`
        });
    });
});

app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});
