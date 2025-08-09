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
// Zusätzliche Module
const forge = require('node-forge');
const plist = require('plist');

// Upload-Handler für Zertifikat + Provision
const certAndProvUpload = multer({ dest: certsDir });
app.post('/upload-cert', certAndProvUpload.fields([
    { name: 'cert', maxCount: 1 },
    { name: 'prov', maxCount: 1 }
]), async (req, res) => {
    const { password, certName } = req.body;

    if (!req.files.cert || !req.files.prov || !password || !certName) {
        return res.status(400).json({ error: 'Fehlende Daten (.p12, .mobileprovision, Passwort, Name)' });
    }

    try {
        // Zertifikat laden
        const p12Buffer = fs.readFileSync(req.files.cert[0].path);
        const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'), false);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

        // Ablaufdatum prüfen
        const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];
        const notAfter = certBag.cert.validity.notAfter;
        const now = new Date();
        if (now > notAfter) {
            fs.unlinkSync(req.files.cert[0].path);
            fs.unlinkSync(req.files.prov[0].path);
            return res.status(400).json({ error: 'Zertifikat ist abgelaufen' });
        }

        // Mobileprovision prüfen
        const provData = fs.readFileSync(req.files.prov[0].path, 'utf8');
        const plistStart = provData.indexOf('<?xml');
        const plistEnd = provData.indexOf('</plist>') + 8;
        const plistContent = provData.substring(plistStart, plistEnd);
        const provObj = plist.parse(plistContent);

        const certTeamId = certBag.cert.subject.getField('O').value; // Team-ID aus Zertifikat
        const provTeamId = provObj.TeamIdentifier[0];

        if (certTeamId !== provTeamId) {
            fs.unlinkSync(req.files.cert[0].path);
            fs.unlinkSync(req.files.prov[0].path);
            return res.status(400).json({ error: 'Zertifikat und Provision passen nicht zusammen' });
        }

        // Speichern
        const certPath = path.join(certsDir, certName + '.p12');
        const provPath = path.join(certsDir, certName + '.mobileprovision');
        fs.renameSync(req.files.cert[0].path, certPath);
        fs.renameSync(req.files.prov[0].path, provPath);

        await storage.setItem(certName, {
            certPath,
            provPath,
            password,
            uploaded: Date.now(),
            expires: notAfter
        });

        res.json({ message: '✅ Zertifikat gültig und gespeichert', expires: notAfter });

    } catch (err) {
        console.error(err);
        fs.unlinkSync(req.files.cert[0].path);
        fs.unlinkSync(req.files.prov[0].path);
        return res.status(500).json({ error: 'Fehler beim Verarbeiten' });
    }
});
