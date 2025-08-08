const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const storage = require("node-persist");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });

// Verzeichnisse anlegen
["certs", "uploads", "signed"].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Speicher für Zertifikate initialisieren
storage.init({ dir: "certs_store" });

// Upload-API für IPA + User-ID
app.post("/api/sign", upload.single("ipa"), async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "User-ID fehlt" });

        // Zertifikat prüfen
        const certData = await storage.getItem(userId);
        if (!certData) {
            return res.status(400).json({ error: "Kein Zertifikat hinterlegt. Bitte zuerst hochladen." });
        }

        const ipaPath = req.file.path;
        const signedIpaName = `${uuidv4()}.ipa`;
        const signedIpaPath = path.join("signed", signedIpaName);

        // 🔹 Hier wird signiert (Beispiel mit ios-deploy/ldid oder Xcode)
        // execSync(`sign-tool --cert ${certData.certPath} --ipa ${ipaPath} --output ${signedIpaPath}`);

        fs.copyFileSync(ipaPath, signedIpaPath); // Platzhalter: nur Kopie, kein echtes Signieren

        // Installations-PLIST erstellen
        const plistName = `${uuidv4()}.plist`;
        const plistPath = path.join("signed", plistName);
        const plistContent = `
        <?xml version="1.0" encoding="UTF-8"?>
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
                    <string>https://DEIN-DOMAIN-NAME/signed/${signedIpaName}</string>
                  </dict>
                </array>
                <key>metadata</key>
                <dict>
                  <key>bundle-identifier</key>
                  <string>com.dein.app</string>
                  <key>bundle-version</key>
                  <string>1.0</string>
                  <key>kind</key>
                  <string>software</string>
                  <key>title</key>
                  <string>Deine App</string>
                </dict>
              </dict>
            </array>
          </dict>
        </plist>
        `;
        fs.writeFileSync(plistPath, plistContent);

        // Installations-URL
        const installUrl = `itms-services://?action=download-manifest&url=https://DEIN-DOMAIN-NAME/signed/${plistName}`;
        res.json({ installUrl });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Signierung fehlgeschlagen" });
    }
});

// API zum Zertifikat hochladen
app.post("/api/upload-cert", upload.single("cert"), async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "User-ID fehlt" });

        const certPath = path.join("certs", `${userId}.p12`);
        fs.renameSync(req.file.path, certPath);

        await storage.setItem(userId, { certPath, created: Date.now() });

        res.json({ success: true, message: "Zertifikat gespeichert" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload fehlgeschlagen" });
    }
});

app.use("/signed", express.static("signed"));

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
