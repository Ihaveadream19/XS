// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process'); // FIX: execSync statt exec
const storage = require('node-persist');
const forge = require('node-forge');
const plist = require('plist');

const app = express();
const port = 3000;

const baseURL = "https://ihaveadream19.github.io/xalostore/";

const uploadsDir = path.join(__dirname, 'uploads');
const certsDir = path.join(__dirname, 'certs');
const signedDir = path.join(__dirname, 'signed');
const certsStoreDir = path.join(__dirname, 'certs_store');
const tempDir = path.join(__dirname, 'temp');

[uploadsDir, certsDir, signedDir, certsStoreDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

storage.init({ dir: certsStoreDir });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const upload = multer({ dest: tempDir });

// === Zertifikat-Upload & Prüfung ===
app.post('/upload-cert', upload.fields([
    { name: 'p12', maxCount: 1 },
    { name: 'mobileprovision', maxCount: 1 }
]), async (req, res) => {
    const { password, certName } = req.body;
    const p12File = req.files?.p12?.[0];
    const provFile = req.files?.mobileprovision?.[0];

    if (!p12File || !provFile || !password || !certName) {
        return res.status(400).json({ status: "error", message: 'Fehlende Daten (.p12, .mobileprovision, Passwort, Name)' });
    }

    try {
        // --- P12 einlesen & prüfen ---
        const p12Buffer = fs.readFileSync(p12File.path);
        const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'), false);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
        const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];
        const notAfter = certBag.cert.validity.notAfter;
        const now = new Date();

        if (now > notAfter) {
            return res.status(400).json({ status: "error", message: '❌ Zertifikat ist abgelaufen' });
        }

        // --- Mobileprovision einlesen ---
        const provData = fs.readFileSync(provFile.path, 'binary');
        const plistStart = provData.indexOf('<?xml');
        const plistEnd = provData.indexOf('</plist>') + 8;
        const plistContent = provData.substring(plistStart, plistEnd);
        const provObj = plist.parse(plistContent);

        // --- Team-ID prüfen ---
        const certTeamId = certBag.cert.subject.getField({ shortName: 'OU' })?.value 
                        || certBag.cert.subject.getField({ shortName: 'UID' })?.value 
                        || certBag.cert.subject.getField('O')?.value;
        const provTeamId = provObj.TeamIdentifier?.[0];

        if (!certTeamId || !provTeamId || certTeamId !== provTeamId) {
            return res.status(400).json({ status: "error", message: `❌ Team-ID stimmt nicht überein (Cert: ${certTeamId} / Prov: ${provTeamId})` });
        }

        // --- Speichern ---
        const certPath = path.join(certsDir, `${certName}.p12`);
        const provPath = path.join(certsDir, `${certName}.mobileprovision`);
        fs.renameSync(p12File.path, certPath);
        fs.renameSync(provFile.path, provPath);

        await storage.setItem(certName, {
            certPath,
            provPath,
            password,
            expires: notAfter.getTime(),
            bundleId: provObj.Entitlements['application-identifier'].split('.').slice(1).join('.')
        });

        res.json({ status: "success", message: `✅ Zertifikat gültig bis ${notAfter.toLocaleDateString()}` });

    } catch (err) {
        console.error('Fehler:', err);
        return res.status(500).json({ status: "error", message: 'Fehler: ' + err.message });
    }
});

app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});
