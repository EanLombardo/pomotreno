import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  permissions: [
    "storage",
    "tabs"
  ],
  action: {
    default_title: "Start Timer"
  },
  background: {
    service_worker: "src/background.js"
  },
  web_accessible_resources: [
    {
      resources: ["src/timer_page.html", "src/style.css"],
      matches: ["<all_urls>"]
    }
  ],
  icons: {
    "16": "public/icon16.png",
    "32": "public/icon16.png",
    "48": "public/icon48.png",
    "128": "public/icon128.png"
  }
})