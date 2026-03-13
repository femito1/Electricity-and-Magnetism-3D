/**
 * Lightweight i18n for E&M 3D Visualizer.
 * Supports English (en) and Portuguese (pt).
 */

const STORAGE_KEY = 'em-viz-locale';

let locale = 'en';
let strings = { en: {}, pt: {} };
const listeners = [];

export function setLocale(loc) {
  if (loc !== 'en' && loc !== 'pt') return;
  locale = loc;
  try {
    localStorage.setItem(STORAGE_KEY, loc);
  } catch (_) {}
  document.documentElement.lang = loc === 'pt' ? 'pt-BR' : 'en';
  document.title = loc === 'pt' ? 'Visualizador 3D de E&M' : 'E&M 3D Visualizer';
  listeners.forEach(fn => fn(loc));
}

export function getLocale() {
  return locale;
}

export function initLocale() {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  if (urlLang === 'en' || urlLang === 'pt') {
    locale = urlLang;
  } else {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'pt') locale = stored;
    } catch (_) {}
  }
  document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en';
  document.title = locale === 'pt' ? 'Visualizador 3D de E&M' : 'E&M 3D Visualizer';
}

export function registerStrings(loc, obj) {
  if (loc !== 'en' && loc !== 'pt') return;
  strings[loc] = { ...strings[loc], ...obj };
}

export function t(key) {
  const val = strings[locale]?.[key];
  if (val !== undefined && val !== null) return val;
  const fallback = strings.en?.[key];
  if (fallback !== undefined && fallback !== null) return fallback;
  return key;
}

export function onLocaleChange(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}
