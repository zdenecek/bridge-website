# Bridge Website

A bilingual (Czech/English) static website about bridge tournaments, software, and resources built with [Hugo](https://gohugo.io/).

**Live site:** [bridge.zdenektomis.eu](https://bridge.zdenektomis.eu)

## Content

This site contains:

- **Tournament results and information** - Results from various bridge tournaments, including Czech Bridge Tour events, national leagues, and other competitions
- **Bridge software guides** - Documentation and tutorials for bridge-related software tools
- **Tournament Director resources** - Guides and tips for running bridge tournaments, including Tournament Calculator workflows and other TD tools
- **Articles and links** - Various articles about bridge and useful links

The site is bilingual, with content available in both Czech and English.

## Prerequisites

- [Hugo](https://gohugo.io/installation/) (static site generator)
- Python 3 (for tournament data conversion scripts)
- Node.js (if you need to work with the theme)

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bridge.zdenektomis.eu
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Build the site:
   ```bash
   make site
   ```

## Development

### Running the development server

```bash
make watch
```

This will:
- Convert tournament data from JSON to Hugo content files
- Start Hugo's development server with hot reload
- Build future-dated content

The site will be available at `http://localhost:1313`

### Building for production

```bash
make site
```

This generates the static site in the `public/` directory.

### Available Make targets

- `make site` - Build the complete site (converts tournaments and generates static files)
- `make watch` - Start development server with auto-reload
- `make clean` - Clean generated tournament content files
- `make all` - Alias for `make site`

## Project Structure

```
.
├── bin/              # Python scripts for data conversion
├── content/          # Site content (markdown files)
│   ├── cs/          # Czech content
│   └── en/          # English content
├── data/             # Data files (JSON, TOML)
│   └── tournaments/ # Tournament markdown files (generated)
├── layouts/          # Custom Hugo templates
├── static/           # Static assets (images, JS, CSS)
├── themes/           # Hugo theme
├── scripts/          # PHP scripts (mounted to static/apps)
└── resources/        # Hugo resources (SCSS, etc.)
```

## Tournament Data

Tournament information is stored in JSON format:
- `data/tournaments.json` - Main tournament data
- `data/bkpTournaments.json` - BK Praha tournament data

The `bin/convert.py` script converts these JSON files into Hugo content files:
- English tournaments → `content/en/tournaments/`
- Czech tournaments → `content/cs/turnaje/`

## Content Management

### Adding a Tournament

1. Edit `data/tournaments.json` and add your tournament entry
2. Run `make site` or `make watch` to regenerate content files
3. Optionally add tournament-specific content in `data/tournaments/YYYY/`

### Adding Content

- Czech content goes in `content/cs/`
- English content goes in `content/en/`
- Both directories mirror each other's structure

## Configuration

- `hugo.yaml` - Main Hugo configuration
- `data/menu.*.toml` - Menu structure for each language
- `i18n/*.yaml` - Translation strings

## Deployment

The `public/` directory contains the generated static site and can be deployed to any static hosting service (GitHub Pages, Netlify, Vercel, etc.).

## License

See [LICENSE](LICENSE) file for details.
