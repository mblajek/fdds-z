import i18next from "i18next";
import I18NextHttpBackend from "i18next-http-backend";
import intervalPlural from "i18next-intervalplural-postprocessor";
import {createSignal} from "solid-js";

const [getTranslationsVersion, setTranslationsVersion] = createSignal(0);

/**
 * Adds a dependence of a SolidJS computation on the translations version, which gets updated
 * when language is changed or when translations are reloaded.
 */
export function dependOnTranslationsVersion() {
  getTranslationsVersion();
}

function updateTranslationsVersion() {
  setTranslationsVersion(Date.now());
}

export const translationsLoadedPromise = new Promise<void>((resolve) =>
  i18next
    .use(I18NextHttpBackend)
    .use(intervalPlural)
    .on("loaded", () => {
      updateTranslationsVersion();
      resolve();
    }),
);

const [getTranslationsLoaded, setTranslationsLoaded] = createSignal(false);
translationsLoadedPromise.then(() => setTranslationsLoaded(true));

export const translationsLoaded = getTranslationsLoaded;

const [getCurrentLanguage, setCurrentLanguage] = createSignal(i18next.resolvedLanguage);
i18next.on("languageChanged", (lang) => {
  updateTranslationsVersion();
  setCurrentLanguage(lang);
});

export const currentLanguage = getCurrentLanguage;

import.meta.hot?.on("translationsFileChange", () => i18next.reloadResources());
