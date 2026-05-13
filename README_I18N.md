# Internationalization (i18n)

This application is fully internationalized using [next-intl](https://next-intl-docs.vercel.app/).

## Features

✅ **Automatic locale detection** - Detects user's preferred language from browser settings  
✅ **Manual language switching** - Users can pick their preferred language  
✅ **URL-based routing** - Clean URLs like `/en/match/123` or `/pt/match/123`  
✅ **SEO-friendly** - Proper meta tags for each language  
✅ **Contributor-friendly** - Easy to add new languages via PR

## Available Languages

- 🇺🇸 **English** (`en`) - Default
- 🇧🇷 **Portuguese** (`pt`)

## How It Works

### Locale Detection

When a user visits the app:

1. The middleware checks their browser's `Accept-Language` header
2. If their preferred language is available, they're redirected to that locale
3. If not, they get the default language (English)
4. Users can manually switch languages using the language switcher in the UI

### File Structure

```
├── messages/              # Translation files
│   ├── en.json           # English translations
│   └── pt.json           # Portuguese translations
├── src/
│   ├── i18n/             # i18n configuration
│   │   ├── config.ts     # Locale list, names, and flags
│   │   ├── request.ts    # Next-intl request config
│   │   └── routing.ts    # Routing configuration
│   ├── middleware.ts     # Locale detection middleware
│   ├── app/
│   │   └── [locale]/     # Locale-based routing
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── match/
│   └── components/
│       └── LanguageSwitcher.tsx  # UI for switching languages
```

### Translation Files

All user-facing text is stored in JSON files under `messages/`:

```json
{
  "lobby": {
    "title": "Perfil Game",
    "players": {
      "heading": "Players",
      "addButton": "Add"
    }
  }
}
```

Components use the `useTranslations` hook:

```tsx
import { useTranslations } from "next-intl";

export default function Lobby() {
  const t = useTranslations("lobby");
  
  return <h1>{t("title")}</h1>;
}
```

### Locale Routing

The app uses Next.js App Router with dynamic `[locale]` segment:

- `/` → Redirects to `/en` or user's preferred locale
- `/en` → English lobby
- `/pt` → Portuguese lobby
- `/en/match/123` → English match view
- `/pt/match/123` → Portuguese match view

## Adding a New Language

Want to add support for another language? Check out [CONTRIBUTING_I18N.md](./CONTRIBUTING_I18N.md) for step-by-step instructions!

## Configuration

### Locale Prefix Strategy

The app uses `localePrefix: 'as-needed'` which means:
- Default locale (English) URLs: `/` and `/match/123`
- Other locales include prefix: `/pt` and `/pt/match/123`

You can change this in `src/i18n/routing.ts`.

### Supported Locales

To add or remove locales, update:
1. `src/i18n/config.ts` - locale list and metadata
2. `src/i18n/routing.ts` - routing configuration
3. `src/middleware.ts` - matcher regex
4. Create corresponding `messages/[locale].json` file

## Development

### Adding New Translatable Text

1. Add the key to **all** language files in `messages/`:

```json
// messages/en.json
{
  "newFeature": {
    "title": "New Feature"
  }
}

// messages/pt.json
{
  "newFeature": {
    "title": "Nova Funcionalidade"
  }
}
```

2. Use it in your component:

```tsx
const t = useTranslations("newFeature");
return <h2>{t("title")}</h2>;
```

### Testing Different Locales

**Option 1: Use the language switcher** in the UI (top right corner)

**Option 2: Visit locale URLs directly:**
- http://localhost:3000/en
- http://localhost:3000/pt

**Option 3: Change your browser language** and clear cookies

## API Integration

The app passes locale to the backend for AI-generated content:

```typescript
const apiLocale = locale === "pt" ? "pt-BR" : "en-US";
await createMatch({
  config: {
    locale: apiLocale,  // Backend generates clues in this language
    // ...
  }
});
```

## Best Practices

### ✅ Do

- Keep translation keys semantic (`lobby.players.addButton` not `button1`)
- Use ICU message format for plurals: `{count, plural, =1 {# item} other {# items}}`
- Include all placeholders in translations: `"Welcome {name}"`
- Test all languages before deploying
- Keep translations in sync across files

### ❌ Don't

- Hardcode user-facing text in components
- Use generic keys like `text1`, `label2`
- Skip translation files when adding new text
- Assume all languages have the same plural rules

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
