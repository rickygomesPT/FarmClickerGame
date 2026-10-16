'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import pt from '@/messages/pt.json';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';

export type Locale = 'pt' | 'en' | 'es' | 'fr';

/** Árvore de traduções: só strings e objetos aninhados (sem arrays). */
export type MessageNode = string | { [key: string]: MessageNode };

export type TranslationValues = Record<string, string | number | undefined>;

const messages: Record<Locale, MessageNode> = {
  pt: pt as MessageNode,
  en: en as MessageNode,
  es: es as MessageNode,
  fr: fr as MessageNode,
};

export const SUPPORTED_LOCALES: Locale[] = ['pt', 'en', 'es', 'fr'];

export const LOCALE_LABELS: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const DEFAULT_LOCALE: Locale = 'en';

const STORAGE_KEY = 'quinta-magnifica.locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LOCALES as string[]).includes(stored)) return stored as Locale;
  } catch {}
  try {
    const nav = window.navigator.language?.slice(0, 2).toLowerCase();
    if (nav && (SUPPORTED_LOCALES as string[]).includes(nav)) return nav as Locale;
  } catch {}
  return DEFAULT_LOCALE;
}

let currentLocale: Locale = DEFAULT_LOCALE;

export function resolveT(messagesObj: unknown, key: string, values?: TranslationValues): MessageNode {
  const keys = key.split('.');
  let result: unknown = messagesObj;
  for (const k of keys) {
    if (result !== null && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  if (typeof result === 'string' && values) {
    return Object.entries(values).reduce<string>(
      (str, [name, value]) => str.replace(`{${name}}`, String(value)),
      result,
    );
  }

  if (typeof result === 'string' || (result !== null && typeof result === 'object')) {
    return result as MessageNode;
  }
  return key;
}

export function t(key: string, values?: TranslationValues): string {
  const resolved = resolveT(messages[currentLocale], key, values);
  return typeof resolved === 'string' ? resolved : key;
}

/** Secção inteira (objeto) de traduções — ex.: `tSection('HomePage.missions')`. */
export function tSection(key: string): MessageNode {
  return resolveT(messages[currentLocale], key);
}

export function t_items(key: string): string {
  return t(`Items.${key}`);
}

export function t_general(key: string): string {
  return t(`General.${key}`);
}

function applyDocumentLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  const dict = messages[locale];
  const title = resolveT(dict, 'App.title');
  if (typeof title === 'string') document.title = title;
  const description = resolveT(dict, 'App.description');
  const meta = document.querySelector('meta[name="description"]');
  if (meta && typeof description === 'string') meta.setAttribute('content', description);
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
  applyDocumentLocale(locale);
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const initial = getInitialLocale();
    currentLocale = initial;
    setLocaleState(initial);
    applyDocumentLocale(initial);
  }, []);

  const handleSetLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setLocaleState(nextLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}