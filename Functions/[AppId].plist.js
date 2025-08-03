export async function onRequest(context) {
    const { params } = context;
    const appId = params.appId;

    const sourceResponse = await fetch('https://' + context.request.url.split('/')[2] + '/source.json');
    if (!sourceResponse.ok) {
        return new Response('Error fetching source.json', { status: 500 });
    }
    const sourceData = await sourceResponse.json();

    const app = sourceData.apps.find(a => a.bundleIdentifier === appId);

    if (!app) {
        return new Response('App not found', { status: 404 });
    }

    const latestVersion = app.versions[0];
    if (!latestVersion) {
        return new Response('App version not found', { status: 404 });
    }

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
                    <string>${latestVersion.downloadURL}</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>${app.bundleIdentifier}</string>
                <key>bundle-version</key>
                <string>${latestVersion.version}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>${app.name}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;

    return new Response(plistContent, {
        headers: {
            'Content-Type': 'application/x-plist'
        }
    });
}
