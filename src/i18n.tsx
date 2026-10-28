import { createContext, useContext } from 'react';
export type Locale = 'zh' | 'en';
export const Language = createContext<Locale>('zh');
export function useLanguage() {
  const locale = useContext(Language);
  return { locale, t: (zh: string, en: string) => locale === 'zh' ? zh : en };
}
export const routePath = (path: string, locale: Locale) => `${locale === 'en' ? '/en' : ''}${path}`;
