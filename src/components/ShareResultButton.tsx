"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Match } from "@/types/domain";
import { buildShareText } from "@/lib/match-share";

interface ShareResultButtonProps {
  match: Match;
}

export default function ShareResultButton({ match }: ShareResultButtonProps) {
  const t = useTranslations("share");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleShare() {
    const shareText = buildShareText(match);
    const shareData = {
      title: "FindWhoAmAI",
      text: shareText,
      url: "https://findwhoamai.com",
    };

    try {
      // Check if Web Share API is available at click time (not render time to avoid SSR issues)
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData);
        // No feedback needed for native share - the OS handles it
      } else {
        // Fallback to clipboard
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          setFeedback(t("copied"));
          setTimeout(() => setFeedback(null), 2000);
        } else {
          throw new Error("Clipboard not available");
        }
      }
    } catch (error) {
      // User cancelled share dialog - don't show error
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setFeedback(t("error"));
      setTimeout(() => setFeedback(null), 2000);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="w-full py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 transition-colors"
        aria-label={t("button")}
      >
        {feedback || t("button")}
      </button>
    </div>
  );
}
