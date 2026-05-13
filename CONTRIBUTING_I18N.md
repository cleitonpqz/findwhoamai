# Contributing Translations

Thank you for your interest in helping translate FindWhoAmAI! This guide will walk you through the process of adding a new language to the application.

## Current Languages

- English (en)
- Portuguese (pt)

## How to Add a New Language

### 1. Create a Translation File

Create a new JSON file in the `messages/` directory with your language code as the filename. For example:
- Spanish: `messages/es.json`
- French: `messages/fr.json`
- German: `messages/de.json`

You can use `messages/en.json` as a template. Copy its contents and translate all the values while keeping the keys unchanged.

### 2. Update the i18n Configuration

Edit `src/i18n/config.ts` to add your language:

```typescript
export const locales = ['en', 'pt', 'es'] as const; // Add your language code here
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
  es: 'Español', // Add your language name here
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  pt: '🇧🇷',
  es: '🇪🇸', // Add your flag emoji here
};
```

### 3. Update the Routing Configuration

Edit `src/i18n/routing.ts` to include your new locale:

```typescript
export const routing = defineRouting({
  locales: ['en', 'pt', 'es'], // Add your language code here
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});
```

### 4. Update the Middleware Configuration

Edit `src/middleware.ts` to add your locale to the matcher:

```typescript
export const config = {
  matcher: ['/', '/(pt|en|es)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
  //                      ↑ Add your locale here
};
```

### 5. Update the Layout Metadata

Edit `src/app/[locale]/layout.tsx` to add metadata for your language:

```typescript
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const isPortuguese = params.locale === 'pt';
  const isSpanish = params.locale === 'es'; // Add this check

  // Add your language's metadata
  return {
    title: isSpanish
      ? "FindWhoAmAI — Juego de adivinanzas con IA"
      : isPortuguese
      ? "FindWhoAmAI — Jogo de adivinhação com IA"
      : "FindWhoAmAI — AI-powered guessing game",
    // ... add other metadata fields
  };
}
```

### 6. Update the Language Switcher

Edit `src/components/LanguageSwitcher.tsx` to add your language to the display names and flags:

```typescript
const localeNames: Record<string, string> = {
  en: "English",
  pt: "Português",
  es: "Español", // Add your language
};

const localeFlags: Record<string, string> = {
  en: "🇺🇸",
  pt: "🇧🇷",
  es: "🇪🇸", // Add your flag
};
```

### 7. Test Your Translation

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Visit your locale URL:
   - English: `http://localhost:3000/en`
   - Portuguese: `http://localhost:3000/pt`
   - Your language: `http://localhost:3000/[your-locale]`

3. Test all pages and features:
   - Lobby page (player management, profile type selection, rounds)
   - Match page (clues, awards, round progression)
   - Match summary page (rankings, statistics, round-by-round)
   - Language switcher
   - Demo banner

### 8. Submit a Pull Request

1. Fork the repository
2. Create a new branch for your translation:
   ```bash
   git checkout -b add-spanish-translation
   ```

3. Commit your changes:
   ```bash
   git add .
   git commit -m "Add Spanish (es) translation"
   ```

4. Push to your fork:
   ```bash
   git push origin add-spanish-translation
   ```

5. Open a Pull Request on GitHub with:
   - A clear title: "Add [Language] translation"
   - Description of what you've translated
   - Screenshots of the app in your language (optional but appreciated)

## Translation Guidelines

### General Principles

1. **Keep it natural**: Translate the meaning, not word-for-word
2. **Be consistent**: Use the same terminology throughout
3. **Consider context**: Some phrases may need to be adapted to your culture
4. **Test thoroughly**: Make sure everything displays correctly

### Key Terms to Consider

- **"Perfil"**: This is the original Brazilian game name. Consider whether to:
  - Keep it as "Perfil" (for recognition)
  - Translate to "Profile"
  - Use a culturally equivalent game name

- **Profile Types**: 
  - Person/Character
  - Place
  - Thing/Object
  - Animal

- **Game Terms**:
  - Round
  - Clue/Hint
  - Award/Give point
  - Skip
  - Winner

### Pluralization

The app uses ICU message format for pluralization. For example:

```json
{
  "playerStats": {
    "wins": "{count, plural, =1 {# win} other {# wins}}"
  }
}
```

Make sure to adapt plural rules to your language. Some languages have different plural forms:
- English: 1 item / 2+ items
- Portuguese: 1 item / 2+ items  
- Russian: 1 item / 2-4 items / 5+ items
- Arabic: 0 items / 1 item / 2 items / 3-10 items / 11+ items

### Variables

Some translations include variables like `{name}`, `{count}`, `{number}`, etc. Keep these exactly as they are:

```json
{
  "header": {
    "round": "Round {number}"  // Spanish: "Ronda {number}"
  }
}
```

## Need Help?

- Open an issue on GitHub if you have questions
- Check existing translations for examples
- Refer to the [next-intl documentation](https://next-intl-docs.vercel.app/) for advanced features

## Language Codes Reference

Use ISO 639-1 two-letter codes:
- `en` - English
- `pt` - Portuguese
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `ar` - Arabic
- `ru` - Russian
- `hi` - Hindi

See [full list](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

Thank you for contributing! 🌍
