export const THEME_STORAGE_KEY = 'unbound-theme';
export type Theme = 'light' | 'dark';

/**
 * Runs before first paint: applies an explicitly chosen theme (if any; otherwise the OS preference applies via CSS)
 * and adds the "js" class that enables entrance reveals. Storage access is guarded: it can throw in private modes.
 */
export const THEME_BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t);}}catch(e){}})();`;

export function readStoredTheme(): Theme | null {
  try {
    const t = window.localStorage.getItem(THEME_STORAGE_KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

export function storeTheme(t: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, t);
  } catch {
    /* storage unavailable: the choice lasts for this page view only */
  }
}

export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
