"use client";

import { useTranslations } from "next-intl";

export default function DemoBanner() {
  const t = useTranslations("demoBanner");

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 text-sm">
      <div className="max-w-md mx-auto px-4 py-2 text-center">
        {t("message")}
      </div>
    </div>
  );
}
