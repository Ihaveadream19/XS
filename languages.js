const translations = {
  de: {
    // Header
    headerTitle: "Xalostore",
    headerSubtitle: "Sideload Apps. Einfach. Sicher.",
    
    // PWA Banner
    pwaBannerTip: "Tipp:",
    pwaBannerText: "Du kannst <strong>Xalostore</strong> wie eine echte App nutzen!<br>Tippe unten auf das <strong>Teilen-Symbol</strong> und wähle <em>\"Zum Home-Bildschirm hinzufügen\"</em>.",
    pwaBannerButton: "Nicht mehr anzeigen",

    // Search Bar
    searchPlaceholder: "App suchen...",
    toggleModeButtonLight: "🌙", // Mond für Dunkelmodus
    toggleModeButtonDark: "☀️", // Sonne für Hellmodus

    // App List / Search Results
    noAppsFound: "Keine Apps gefunden.",
    searchPrompt: "Beginne mit der Suche, um Apps zu finden.",
    appsLoadError: "Apps konnten nicht geladen werden. Bitte versuche es später noch einmal.",

    // App Card / Modal
    installButton: "Installieren",
    modalInstallButton: "Jetzt installieren",
    modalVersion: "Version:",
    modalSize: "Größe:",
    modalDefaultDescription: "Diese App ermöglicht dir großartige Dinge!",

    // Tabbar
    tabExplore: "Explore",
    tabSearch: "Search",
    tabProfile: "Profile",

    // Profile Tab
    profileWelcomeTitle: "Willkommen bei Xalostore!",
    profileWelcomeText1: "Dies ist dein einfacher und sicherer Ort, um Sideload-Apps zu finden und zu installieren.",
    profileWelcomeText2: "Wir arbeiten ständig daran, dir neue Funktionen und die besten Apps zur Verfügung zu stellen.",
    profileWelcomeText3: "Schau bald wieder vorbei für Updates und neue Inhalte!",
    
    // Language Selection (New)
    languageSettingsTitle: "Spracheinstellungen",
    selectLanguage: "Sprache wählen:"
  },
  en: {
    // Header
    headerTitle: "Xalostore",
    headerSubtitle: "Sideload Apps. Simple. Secure.",

    // PWA Banner
    pwaBannerTip: "Tip:",
    pwaBannerText: "You can use <strong>Xalostore</strong> like a real app!<br>Tap the <strong>Share icon</strong> below and select <em>\"Add to Home Screen\"</em>.",
    pwaBannerButton: "Don't show again",

    // Search Bar
    searchPlaceholder: "Search app...",
    toggleModeButtonLight: "🌙", // Moon for dark mode
    toggleModeButtonDark: "☀️", // Sun for light mode

    // App List / Search Results
    noAppsFound: "No apps found.",
    searchPrompt: "Start searching to find apps.",
    appsLoadError: "Could not load apps. Please try again later.",

    // App Card / Modal
    installButton: "Install",
    modalInstallButton: "Install Now",
    modalVersion: "Version:",
    modalSize: "Size:",
    modalDefaultDescription: "This app lets you do awesome things!",

    // Tabbar
    tabExplore: "Explore",
    tabSearch: "Search",
    tabProfile: "Profile",

    // Profile Tab
    profileWelcomeTitle: "Welcome to Xalostore!",
    profileWelcomeText1: "This is your simple and secure place to find and install sideload apps.",
    profileWelcomeText2: "We are constantly working to provide you with new features and the best apps.",
    profileWelcomeText3: "Check back soon for updates and new content!",

    // Language Selection (New)
    languageSettingsTitle: "Language Settings",
    selectLanguage: "Select Language:"
  }
};

// Standard-Sprache, wenn keine gespeichert ist oder erkannt wird
let currentLanguage = 'de'; 

// Funktion zum Laden der gespeicherten Sprache
function loadLanguagePreference() {
  const savedLang = localStorage.getItem('xalostore_language');
  if (savedLang && translations[savedLang]) {
    currentLanguage = savedLang;
  } else {
    // Erkennen der Browsersprache, falls keine gespeichert ist
    const browserLang = navigator.language.split('-')[0]; // z.B. "de" aus "de-DE"
    if (translations[browserLang]) {
      currentLanguage = browserLang;
    }
  }
}

// Funktion zum Übersetzen der UI-Elemente
function translateUI() {
  const langData = translations[currentLanguage];

  // Header
  document.querySelector('h1').textContent = langData.headerTitle;
  document.querySelector('h2').textContent = langData.headerSubtitle;

  // PWA Banner
  document.querySelector('#pwaBanner strong').textContent = langData.pwaBannerTip;
  // Der Text im PWA-Banner enthält HTML, daher innerHTML verwenden
  document.querySelector('#pwaBanner').childNodes[2].nodeValue = langData.pwaBannerText.split('<br>')[0]; // Erster Teil vor <br>
  document.querySelector('#pwaBanner').childNodes[4].nodeValue = langData.pwaBannerText.split('<br>')[1]; // Zweiter Teil nach <br>
  document.querySelector('#pwaBanner button').textContent = langData.pwaBannerButton;


  // Search Bar
  document.getElementById('search').placeholder = langData.searchPlaceholder;
  // Toggle Button Text / Icon (abhängig vom Modus, wird in toggleMode() gesetzt)
  // Das erledigt toggleMode() automatisch, wenn es aufgerufen wird.

  // App List / Search Results (Meldungen für leere Listen)
  // Diese werden dynamisch in renderApps() und searchInput.addEventListener gesetzt.
  // Hier setzen wir die Initialtexte für den Search-Prompt
  if(document.querySelector('#appListSearch .no-apps-message')) {
    document.querySelector('#appListSearch .no-apps-message').textContent = langData.searchPrompt;
  }
  
  // Tabbar
  document.getElementById('tabExplore').querySelector('.tab-text').textContent = langData.tabExplore;
  document.getElementById('tabSearch').querySelector('.tab-text').textContent = langData.tabSearch;
  document.getElementById('tabProfile').querySelector('.tab-text').textContent = langData.tabProfile;

  // Profile Tab
  document.querySelector('#profileTab h3').textContent = langData.profileWelcomeTitle;
  // Hier verwenden wir querySelectorAll, um alle Paragraphen im Profil-Tab zu aktualisieren
  const profileParagraphs = document.querySelectorAll('#profileTab p');
  if (profileParagraphs.length >= 3) { // Sicherstellen, dass die Paragraphen existieren
    profileParagraphs[0].textContent = langData.profileWelcomeText1;
    profileParagraphs[1].textContent = langData.profileWelcomeText2;
    profileParagraphs[2].textContent = langData.profileWelcomeText3;
  }

  // Für App-Karten und Modals: Diese werden bei der Erstellung bzw. Öffnung übersetzt,
  // daher müssen wir hier keine vorhandenen übersetzen, nur sicherstellen, dass
  // createCard() und die Modal-Generierung die korrekten Texte verwenden.
  // Wir müssen die 'apps' bei Bedarf neu rendern, damit die "Installieren" Buttons aktualisiert werden.
  if (document.getElementById('exploreTab').classList.contains('active')) {
      renderApps(apps, appList);
  } else if (document.getElementById('searchTab').classList.contains('active')) {
      const q = searchInput.value.toLowerCase();
      const filtered = apps.filter(app => 
          app.name.toLowerCase().includes(q) || 
          app.subtitle.toLowerCase().includes(q) ||
          (app.localizedDescription && app.localizedDescription.toLowerCase().includes(q))
      );
      renderApps(filtered, appListSearch);
  }

  // Aktualisiere den Text für den "Apps konnten nicht geladen werden"-Fehler, falls vorhanden
  const errorMessageElement = document.querySelector('.no-apps-message');
  if (errorMessageElement && errorMessageElement.textContent === translations['de'].appsLoadError || errorMessageElement.textContent === translations['en'].appsLoadError) {
      errorMessageElement.textContent = langData.appsLoadError;
  }
}

// Funktion zum Wechseln der Sprache
function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('xalostore_language', lang); // Sprache im Local Storage speichern
    translateUI(); // UI neu übersetzen
    goTab(document.querySelector('.tab-content.active').id.replace('Tab', '')); // Aktuellen Tab neu laden, um dynamische Inhalte (z.B. App-Karten) zu aktualisieren
    toggleMode(); // Sicherstellen, dass das Toggle-Icon korrekt ist
  }
}

// Helper, um Texte aus dem Translation-Objekt abzurufen
function getTranslation(key) {
    return translations[currentLanguage][key] || key; // Fallback zu Schlüssel, falls Übersetzung fehlt
}

// Vor dem Laden der Seite die gespeicherte Sprache laden
loadLanguagePreference();
