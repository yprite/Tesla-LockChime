document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language-select');
    const i18nApi = window.i18n;

    if (!languageSelect || !i18nApi) {
        return;
    }

    if (typeof i18nApi.getLanguage === 'function') {
        const lang = i18nApi.getLanguage();
        languageSelect.value = lang;
        document.documentElement.lang = lang;
    }

    if (typeof i18nApi.updatePage === 'function') {
        i18nApi.updatePage();
    }

    languageSelect.addEventListener('change', (e) => {
        if (typeof i18nApi.setLanguage === 'function') {
            i18nApi.setLanguage(e.target.value);
        }
    });

    window.addEventListener('languageChanged', (e) => {
        const changed = e?.detail?.language;
        if (changed && languageSelect.value !== changed) {
            languageSelect.value = changed;
        }
    });
});
