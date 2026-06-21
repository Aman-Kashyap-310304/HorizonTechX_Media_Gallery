# 🌌 HorizonTechX Media Gallery

> **"Your memories belong to your RAM, not a distant data center."**

HorizonTechX Media Gallery is a **high-performance, privacy-first, zero-server web application** built strictly with standard HTML5, CSS3, and Vanilla JavaScript. Designed to function as a fully persistent offline hub, the application securely archives images, videos, and custom version trees directly inside your browser's client-side **IndexedDB** storage.

---

## 🚀 Live Deployment

**Access the app directly:** [HorizonTechX Media Gallery Hub](https://aman-kashyap-310304.github.io/HorizonTechX_Media-Gallery/)

*(Note: Because the application writes strictly to your local device hardware, your media will persist safely between browser reloads across isolated private sessions).*

---

## ✨ Architectural Highlights & Features

### 📦 100% Client-Side Persistence

Zero backend databases, zero PHP/Node servers, and zero cloud uploads. Uploaded media is instantly parsed into Base64 / raw Blobs and committed to the browser's native **IndexedDB API**.

### 📂 Automated "Daily Virtual Folders"

To maintain an organized structure without forcing the user to manually create directories for every single batch, uploads are automatically assigned to virtual folders bound to their upload date (e.g., `Gallery-YYYY-MM-DD`).

### 🎨 Non-Destructive Canvas Editing Suite

When viewing an image inside the Lightbox, clicking the **Edit** tool opens an HTML5 `<canvas>` rendering engine that allows you to:

* **Rotate the viewport 90°** right instantly.
* **Inject custom Text Overlays** mapped to custom Y-axis coordinates, custom font sizes, and custom HEX color pickers.
* **Commit Version Trees:** Saving an edit does not overwrite your original file. It creates a secondary child Blob linked directly to the parent's `versions[]` history array in IndexedDB, which can be viewed or deleted inside the Media Details pane.

### 🎬 Advanced Custom Video Engine

Bypasses basic browser players in favor of a custom, styled DOM wrapper featuring custom seek tracking, muted states, and a **dynamic playback speed selector (0.5x to 2x)**. Your preferred video speed settings are saved to IndexedDB and automatically restored the next time you press play.

### ⚡ Batch Operations & Selection Mode

Toggling the top navbar checkmark enters **Selection Mode**, turning the media cards into aim-free, single-tap hitboxes. Once multiple files are selected, floating action buttons allow you to trigger group deletions or pass the original File objects to your device's native OS share sheet via `navigator.share()`.

### 🛡️ Client-Side Domain Guard

Includes a self-executing security script that intercepts the DOM before initialization. If the app detects it is being rendered inside an unauthorized `<iframe>` or hosted on a ripped external domain, it freezes body execution, blurs the viewport, and locks the interface behind an **App Code verification screen**.

### 💬 Unified Modal Framework

Bypasses thread-blocking, un-stylable native browser dialogs (`alert()`, `confirm()`, `prompt()`). All user feedback routes through a single, custom `ModalManager` JavaScript class driven by buttery-smooth **0.25s** CSS keyframe transitions.

---

## 🧠 The IndexedDB Data Schema

Under the hood, the application instantiates `MediaGalleryDB` (v1) and manages three distinct object stores: **`media`**, **`versions`**, and **`settings`**.

A standard committed media object follows this strict architecture:

```json
{
  "id": "1718923410_a8f9c",
  "name": "project_blueprint_v2.png",
  "blob": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "type": "image/png",
  "size": 157350,
  "uploadDate": 1718923410512,
  "folderDate": "2026-06-20",
  "isFavorite": true,
  "versions": []
}

```

---

## 🛠️ Getting Started (Local Development)

Because the software contains **zero server-side dependencies**, launching a local development instance requires zero terminal builds or package installations.

1. **Clone the repository:**
```bash

```



git clone https://github.com/aman-kashyap-310304/HorizonTechX_Media-Gallery.git

```
2. **Navigate into the directory:**
   ```bash
cd HorizonTechX_Media-Gallery

```

3. **Run the app:**
Simply double-click `index.html` to open it in your browser, or serve it through the VS Code *Live Server* extension.

---

## 🛡️ Understanding the Client Security Layer

The top of `index.html` contains an inline JavaScript **Auth Guard**. When the browser attempts to parse the document, the script verifies:

1. `window.self === window.top` *(Ensures the app is not trapped inside a clickjacking frame)*.
2. `window.location.href.startsWith('[https://aman-kashyap-310304.github.io](https://aman-kashyap-310304.github.io)')` *(Ensures origin integrity)*.

If either check fails, the application **refuses to append `style.css` or `app.js` to the DOM**. Instead, it renders a glassmorphic login prompt requiring an exact match against one of the encrypted fallback keys sitting in the document's `<meta name="authorization-X">` tags. Once satisfied, the body is un-blurred and the scripts are dynamically injected into the thread.

---

## 📱 Breakpoint Layout Matrix

The CSS utilizes CSS Grid auto-fitting combined with strict media queries to guarantee native-app scannability across all physical devices:

| Screen Width | Viewport Classification | Grid Columns | Header Behavior |
| --- | --- | --- | --- |
| **1400px+** | Desktop Widescreen | `repeat(auto-fill, minmax(200px, 1fr))` | Standard / Split left-right |
| **768px – 1399px** | Tablet / Laptop | `repeat(auto-fill, minmax(150px, 1fr))` | Standard / Split left-right |
| **480px – 767px** | Mobile Landscape | `repeat(auto-fill, minmax(120px, 1fr))` | Inline-block Row / Swipeable filters |
| **< 480px** | Mobile Portrait | `repeat(2, 1fr)` *(Strict 2-Column)* | Compact Titles / Fullscreen Modals |

---

## 🔮 Planned Roadmap

* [ ] **Cloudflare Worker Asymmetric Auth:** Upgrade the Domain Guard to verify App Codes off-thread against an encrypted serverless worker endpoint.
* [ ] **Manual Directory Allocation:** Provide a drag-and-drop folder pane inside the sidebar to move items out of their default date folders.
* [ ] **Freehand Canvas Cropping:** Add custom X/Y bounding box handles to the Image Editing suite.

---

### 📄 License & Attribution

Designed and built by **Akshat Prasad** & **Aman Kashyap** for the *Horizon TechX Hub*. Released under the **MIT License**. Free to copy, inspect, fork, and adapt for personal portfolios.
