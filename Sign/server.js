// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const storage = require('node-persist');
const forge = require('node-forge');
const plist = require('plist');

const app = express();
const port = 3000;

// Basis-URL für Links (anpassen)
const baseURL = "https://ihaveadream19.github.io/xalostore/";

// Ordnerpfade
const uploadsDir = path.join(__dirname, 'uploads');
const certsDir = path.join(__dirname, 'certs');
const signedDir = path.join(__dirname, 'signed');
const certsStoreDir = path.join(__dirname, 'certs_store');
const tempDir = path.join(__dirname, 'temp');

// Upload-Ordner sicherstellen
[uploadsDir, certsDir, signedDir, certsStoreDir, tempDir].forEach(dir => {
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

// Multer für Uploads (temporär)
const upload = multer({ dest: tempDir });

// Zertifikat und Provision hochladen und validieren
app.post('/upload-cert', upload.fields([
    { name: 'p12', maxCount: 1 },
    { name: 'mobileprovision', maxCount: 1 }
]), async (req, res) => {
    const { password, certName } = req.body;
    const p12File = req.files['p12'] ? req.files['p12'][0] : null;
    const provFile = req.files['mobileprovision'] ? req.files['mobileprovision'][0] : null;

    if (!p12File || !provFile || !password || !certName) {
        return res.status(400).json({ error: 'Fehlende Daten (.p12, .mobileprovision, Passwort, Name)' });
    }

    try {
        // P12-Zertifikat verarbeiten
        const p12Buffer = fs.readFileSync(p12File.path);
        const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'), false);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
        const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];

        // Gültigkeitsprüfung des Zertifikats
        const notAfter = certBag.cert.validity.notAfter;
        const now = new Date();
        if (now > notAfter) {
            return res.status(400).json({ error: 'Zertifikat ist abgelaufen' });
        }

        // Mobileprovision-Datei verarbeiten
        const provData = fs.readFileSync(provFile.path, 'utf8');
        const plistStart = provData.indexOf('<?xml');
        const plistEnd = provData.indexOf('</plist>') + 8;
        const plistContent = provData.substring(plistStart, plistEnd);
        const provObj = plist.parse(plistContent);
        
        // Team-ID prüfen (Beispiel)
        const certTeamId = certBag.cert.subject.getField('O').value;
        const provTeamId = provObj.TeamIdentifier[0];
        if (certTeamId !== provTeamId) {
            return res.status(400).json({ error: 'Zertifikat und Provision passen nicht zusammen' });
        }

        // Dateien dauerhaft speichern
        const certPath = path.join(certsDir, `${certName}.p12`);
        const provPath = path.join(certsDir, `${certName}.mobileprovision`);
        fs.renameSync(p12File.path, certPath);
        fs.renameSync(provFile.path, provPath);

        // Metadaten speichern
        await storage.setItem(certName, {
            certPath,
            provPath,
            password,
            expires: notAfter.getTime(),
            bundleId: provObj.Entitlements['application-identifier'].split('.').slice(1).join('.')
        });

        res.json({ message: '✅ Zertifikat gültig und gespeichert', expires: notAfter });

    } catch (err) {
        console.error('Fehler beim Hochladen oder Verarbeiten:', err);
        return res.status(500).json({ error: 'Fehler beim Verarbeiten: ' + err.message });
    }
});

// IPA signieren
app.post('/sign-ipa', upload.single('ipa'), async (req, res) => {
    const { certName } = req.body;
    const ipaFile = req.file;
    const certData = await storage.getItem(certName);

    if (!ipaFile || !certData) {
        return res.status(400).json({ error: 'Fehlende IPA oder Zertifikat' });
    }

    // Pfade festlegen
    const ipaPath = ipaFile.path;
    const signedFileName = `${path.parse(ipaFile.originalname).name}-signed`;
    const signedIPAPath = path.join(signedDir, `${signedFileName}.ipa`);
    const plistPath = path.join(signedDir, `${signedFileName}.plist`);
    const tempExtractDir = path.join(tempDir, signedFileName);

    try {
        // IPA entpacken
        execSync(`unzip -o "${ipaPath}" -d "${tempExtractDir}"`);
        const appDir = path.join(tempExtractDir, 'Payload', `${path.parse(ipaFile.originalname).name}.app`);

        // Provisioning Profile und Entitlements ersetzen
        fs.copyFileSync(certData.provPath, path.join(appDir, 'embedded.mobileprovision'));

        // Signieren mit `codesign`
        // HINWEIS: Dieser Befehl erfordert ein macOS-System und ein installiertes Zertifikat.
        execSync(`codesign --force --sign "${certName}" "${appDir}"`);

        // Neue IPA packen
        execSync(`cd "${tempExtractDir}" && zip -r --symlinks "${signedIPAPath}" Payload`);

        // PLIST-Datei erstellen
        const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
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
        <string>${certData.bundleId}</string>
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

    } catch (err) {
        console.error('Fehler beim Signieren:', err);
        return res.status(500).json({ error: 'Fehler beim Signieren: ' + err.message });
    } finally {
        fs.rmSync(ipaFile.path); // Temporäre IPA-Datei löschen
        fs.rmSync(tempExtractDir, { recursive: true, force: true }); // Extrahierte Dateien löschen
    }
});

app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});
