# grepHuman

A Chrome extension built with Angular 21.

## Development

### Install dependencies

```bash
npm install
```

### Development server

```bash
npm start
```

Navigate to `http://localhost:4200/` to preview the popup during development.

### Build for Chrome

```bash
npm run build
```

The extension will be built to `dist/grephuman/browser/`.

## Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/grephuman/browser` folder
5. The extension icon will appear in your toolbar

## Project Structure

```
src/
├── app/
│   ├── app.component.ts      # Main popup component
│   ├── app.component.html    # Popup template
│   ├── app.component.scss    # Popup styles
│   └── app.config.ts         # App configuration
├── index.html                # Entry HTML
├── main.ts                   # Bootstrap
└── styles.scss               # Global styles

public/
└── manifest.json             # Chrome extension manifest
```

## Adding Chrome APIs

Chrome types are already installed. Use the `chrome` global in your services:

```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  async get<T>(key: string): Promise<T | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  async set(key: string, value: unknown): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }
}
```

Remember to add required permissions to `manifest.json`:

```json
{
  "permissions": ["storage"]
}
```

## Adding Custom Icons

Add your icons to `public/icons/` and update `manifest.json`:

```json
{
  "action": {
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

## Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run watch` - Build and watch for changes
