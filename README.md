## Resume of Sandeep Donepudi

A modern, responsive resume template built with HTML, CSS, and JavaScript. This project allows you to create a beautiful, professional resume that can be exported as both HTML and PDF. You can check out my resume [here](https://resume.sandeepdonepudi.in).

### Features

- 🎨 Modern and clean design
- 📱 Fully responsive layout
- 📄 PDF export support
- 🌐 Live preview during development
- 🎯 Easy to customize
- ⚡ Fast and lightweight
- 🔄 Auto-updating GitHub profile information

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/skdonepudi/resume.git
cd resume
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:8888`

## How it works

- The data is hosted by [Gist](https://gist.github.com/skdonepudi/61f2e3bba23f31b7d38c66427bffa61d) with [JSON Resume](https://jsonresume.org/) standard.
- The website is hosted by [GitHub Pages](https://pages.github.com/) with CI/CD.
- HTML is generated with [Handlebars](https://handlebarsjs.com/) and PDF is printed with [puppeteer](https://github.com/puppeteer/puppeteer/).

### Customization

1. Edit `resume.json` with your information
2. Modify `assets/less/theme.less` to customize the styling
3. Update `resume.hbs` to change the template structure

## Building

To build your resume:

```bash
npm run build
```

This will generate:
- `dist/index.html` - The HTML version
- `dist/resume.pdf` - The PDF version


## Development

- `npm run dev` - Start development server with live reload
- `npm run build` - Build the resume
- `npm run deploy` - Deploy to GitHub Pages




### Acknowledgments

- This is a modernized fork of [Anthony Fu](https://github.com/antfu/resume)'s template with improved build process and deployment workflow.

### License
MIT © [Sandeep Donepudi](https://github.com/skdonepudi)