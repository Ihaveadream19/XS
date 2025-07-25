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
    
    // Language Settings (New)
    settingsTitle: "Einstellungen", // General settings title
    languageSettingLabel: "Sprache", // Label for the language setting button
    languageSelectionTitle: "Sprache wählen", // Title for the language modal
    languageGerman: "Deutsch",
    languageEnglish: "English",
    darkModeSettingLabel: "Dark Mode", // Label for the dark mode setting
    darkModeOn: "An",
    darkModeOff: "Aus"
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

    // Language Settings (New)
    settingsTitle: "Settings", // General settings title
    languageSettingLabel: "Language", // Label for the language setting button
    languageSelectionTitle: "Select Language", // Title for the language modal
    languageGerman: "German",
    languageEnglish: "English",
    darkModeSettingLabel: "Dark Mode", // Label for the dark mode setting
    darkModeOn: "On",
    darkModeOff: "Off"
  }
};

let currentLanguage = 'de'; 
let currentDarkModeState = true; // true = dark, false = light

// Funktion zum Laden der gespeicherten Sprache und des Dark Mode Zustands
function loadPreferences() {
  const savedLang = localStorage.getItem('xalostore_language');
  if (savedLang && translations[savedLang]) {
    currentLanguage = savedLang;
  } else {
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      currentLanguage = browserLang;
    }
  }

  const savedDarkMode = localStorage.getItem('xalostore_dark_mode');
  if (savedDarkMode !== null) {
    currentDarkModeState = (savedDarkMode === 'true'); // String zu Boolean konvertieren
  }
}

// Funktion zum Übersetzen der UI-Elemente
function translateUI() {
  const langData = translations[currentLanguage];

  // Header
  document.getElementById('header-title').textContent = langData.headerTitle;
  document.getElementById('header-subtitle').textContent = langData.headerSubtitle;

  // PWA Banner
  document.getElementById('pwa-banner-tip').textContent = langData.pwaBannerTip;
  // Den innerHTML direkt setzen, da es HTML-Tags enthält
  document.getElementById('pwa-banner-text').innerHTML = langData.pwaBannerText;
  document.getElementById('pwa-banner-button').textContent = langData.pwaBannerButton;

  // Search Bar
  document.getElementById('search').placeholder = langData.searchPlaceholder;
  // Toggle Button Text / Icon wird von toggleMode() gehandhabt

  // Tabbar
  document.getElementById('tab-explore-text').textContent = langData.tabExplore;
  document.getElementById('tab-search-text').textContent = langData.tabSearch;
  document.getElementById('tab-profile-text').textContent = langData.tabProfile;

  // Profile Tab Welcome
  document.getElementById('profile-welcome-title').textContent = langData.profileWelcomeTitle;
  document.getElementById('profile-text-1').textContent = langData.profileWelcomeText1;
  document.getElementById('profile-text-2').textContent = langData.profileWelcomeText2;
  document.getElementById('profile-text-3').textContent = langData.profileWelcomeText3;

  // Profile Settings
  document.getElementById('settings-title').textContent = langData.settingsTitle;
  document.getElementById('language-setting-label').textContent = langData.languageSettingLabel;
  document.getElementById('dark-mode-setting-label').textContent = langData.darkModeSettingLabel;

  // Update Dark Mode Button text
  updateDarkModeButtonText();

  // Update language labels in the modal (if open) or main profile
  const languageOptionGerman = document.querySelector('#lang-de span');
  const languageOptionEnglish = document.querySelector('#lang-en span');
  if (languageOptionGerman) languageOptionGerman.textContent = langData.languageGerman;
  if (languageOptionEnglish) languageOptionEnglish.textContent = langData.languageEnglish;

  // Special handling for search messages
  if (document.getElementById('searchTab').classList.contains('active')) {
      const q = searchInput.value;
      if (q.length === 0) {
          appListSearch.innerHTML = `<p class="no-apps-message">${langData.searchPrompt}</p>`;
      } else {
          // Re-render apps to update "No apps found" message if applicable
          const filtered = apps.filter(app => 
              app.name.toLowerCase().includes(q.toLowerCase()) || 
              app.subtitle.toLowerCase().includes(q.toLowerCase()) ||
              (app.localizedDescription && app.localizedDescription.toLowerCase().includes(q.toLowerCase()))
          );
          renderApps(filtered, appListSearch);
      }
  } else if (document.getElementById('exploreTab').classList.contains('active')) {
      renderApps(apps, appList); // Re-render apps in explore to update install buttons
  }

  // Update "Apps konnten nicht geladen werden" message if it's currently displayed
  const errorMessageElement = document.querySelector('.no-apps-message');
  if (errorMessageElement && errorMessageElement.dataset.type === 'loadError') {
      errorMessageElement.textContent = langData.appsLoadError;
  }
}

// Funktion zum Wechseln der Sprache
function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('xalostore_language', lang); // Sprache im Local Storage speichern
    translateUI(); // UI neu übersetzen
    updateLanguageButtonsState(); // Aktiven Button hervorheben

    // Re-render current tab content to update dynamic elements like "Install" buttons
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
      const tabName = activeTab.id.replace('Tab', '');
      goTab(tabName); // Simuliert das erneute Laden des Tabs
    }
  }
}

// Helper, um Texte aus dem Translation-Objekt abzurufen
function getTranslation(key) {
    return translations[currentLanguage][key] || key; // Fallback zu Schlüssel, falls Übersetzung fehlt
}

// Aktualisiert den Text des Dark Mode Buttons
function updateDarkModeButtonText() {
    const darkModeToggleBtn = document.getElementById('dark-mode-toggle-btn');
    if (darkModeToggleBtn) {
        darkModeToggleBtn.textContent = currentDarkModeState ? getTranslation('darkModeOn') : getTranslation('darkModeOff');
    }
}

// Aktualisiert den visuellen Zustand der Sprach-Buttons
function updateLanguageButtonsState() {
    document.querySelectorAll('.language-option').forEach(button => {
        button.classList.remove('active-lang');
    });
    const activeLangButton = document.getElementById(`lang-${currentLanguage}`);
    if (activeLangButton) {
        activeLangButton.classList.add('active-lang');
    }
}

// Initialisierung der Einstellungen
loadPreferences();
