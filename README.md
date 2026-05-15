# FindWhoAmAI

An AI-powered take on the classic "Perfil" guessing game. Add players, draw cards, and race to guess the answer as clues are revealed!

## Internationalization

The app supports English and Portuguese. Locale is auto-detected from the browser and can be changed manually. See [`docs/i18n.md`](./docs/i18n.md) for architecture details and how to add a new language.

## 🎮 Features

- **Multiplayer gameplay** - Add 2+ players
- **AI-generated cards** - Unique clues powered by Claude AI
- **Multiple profile types** - Person, Place, Thing, Animal
- **Customizable rounds** - Choose how many rounds to play
- **Match statistics** - View detailed stats and round-by-round breakdowns
- **Fully responsive** - Works on desktop and mobile
- **Internationalized** - Available in multiple languages

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/perfil-game.git
cd perfil-game
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Anthropic API key to `.env.local`:
```
ANTHROPIC_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI**: Anthropic Claude API
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Fonts**: [Geist](https://vercel.com/font)

## 📁 Project Structure

```
├── messages/              # Translation files (en.json, pt.json)
├── src/
│   ├── app/
│   │   ├── [locale]/     # Localized app routes
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── i18n/            # i18n configuration
│   ├── lib/             # Utilities and API functions
│   └── types/           # TypeScript types
└── docs/                # Documentation
```

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

### Adding Translations

See [`docs/i18n.md`](./docs/i18n.md) for instructions on adding a new language.

### Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Original "Perfil" game concept
- [Anthropic](https://anthropic.com) for Claude AI
- [Next.js](https://nextjs.org) team for the amazing framework
- [next-intl](https://next-intl-docs.vercel.app/) for internationalization support

## 📋 Technical Debt

See [TECHNICAL_DEBT.md](./TECHNICAL_DEBT.md) for known issues and planned migrations that need future attention.

## 🔗 Links

- [Live Demo](https://findwhoamai.com)
- [Report a Bug](https://github.com/yourusername/perfil-game/issues)
- [Request a Feature](https://github.com/yourusername/perfil-game/issues)

---

Made with Claude AI
