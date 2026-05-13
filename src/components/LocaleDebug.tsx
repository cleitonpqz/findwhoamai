"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/routing";

export default function LocaleDebug() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white text-xs px-3 py-2 rounded shadow-lg font-mono">
      <div>Locale: {locale}</div>
      <div>Path: {pathname}</div>
      <div>Browser: {typeof window !== 'undefined' ? navigator.language : 'SSR'}</div>
    </div>
  );
}
