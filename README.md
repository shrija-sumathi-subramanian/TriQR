
# TriQR

### Your Links. Your Shape. Your Identity.

TriQR is an AI-powered 3D identity builder that transforms personal and professional links into interactive 3D models with scannable QR codes.

Users can choose a 3D shape, add multiple URLs, customise their identity, and assign QR codes to the available faces of their selected model.

## Features

- **Multiple 3D Shapes:** Choose from cube, pyramids, prisms, octahedron, dodecahedron, icosahedron and more.
- **AI-Powered URL Identification:** Automatically identifies link categories such as LinkedIn, GitHub, portfolio, websites, company pages and projects.
- **Custom Display Names:** Add personalised names to links independently of their identified categories.
- **QR Code Generation:** Generate individual scannable QR codes for every valid URL.
- **Fixed QR Capacity:** Each model has a defined number of usable QR faces, with the front face reserved for the user's name.
- **Custom Face Assignment:** Choose which links appear on the selected 3D model. Remaining links are displayed separately.
- **AI-Powered Design:** Generate personalised visual themes using AI.
- **Manual Customisation:** Adjust colours, typography and decorations.
- **Interactive 3D Preview:** Rotate and explore models using drag and scroll interactions.
- **Edit Before Generation:** Preview and modify names, face assignments and visual appearance before finalising.
- **Multiple Export Options:**
  - Download 3D models in GLB/GLTF format.
  - Export reusable HTML and JavaScript source code.
  - Embed interactive models into external websites.

## How It Works

1. Choose a 3D shape.
2. Enter your name and add multiple URLs.
3. Let AI identify and analyse the URLs.
4. Add custom display names.
5. Generate individual QR codes.
6. Choose which QR codes to place on the model.
7. Customise the model using AI-generated themes or manual settings.
8. Preview and edit the interactive 3D model.
9. Generate and export your TriQR model.

## QR Capacity

The front face is always reserved for the user's name and does not contain a QR code.

| 3D Shape | Total Faces | Maximum QR Codes |
|---|---:|---:|
| Cube | 6 | 5 |
| Triangular Pyramid | 4 | 3 |
| Square Pyramid | 5 | 4 |
| Triangular Prism | 5 | 4 |
| Pentagonal Prism | 7 | 6 |
| Hexagonal Prism | 8 | 7 |
| Octahedron | 8 | 7 |
| Dodecahedron | 12 | 11 |
| Icosahedron | 20 | 19 |

Users can add unlimited links, but the number assigned to the model is limited by its usable QR capacity. Unassigned links remain available in the additional-links section.

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework |
| React | User interface |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling |
| Three.js | 3D model rendering |
| React Three Fiber | React-based 3D integration |
| QRCode | QR code generation |
| Google Gemini API | AI-powered URL analysis and design |
| Zod | Data validation |
| GLTFExporter | 3D model export |

## Project Structure

```text
TriQR/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   ├── profile/
│   │   │   └── qr/
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── cube/
│   │   ├── profile/
│   │   ├── layout/
│   │   └── ui/
│   └── lib/
├── public/
├── .env.local
├── package.json
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js
- npm
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/shrija-sumathi-subramanian/TriQR.git
```

### 2. Navigate to the project

```bash
cd TriQR
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Keep API keys private. Never commit `.env.local` to GitHub.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Goals

TriQR aims to make digital identity sharing more interactive, personalised and reusable by combining artificial intelligence, QR technology and 3D visualisation.

## Future Enhancements

- Publicly shareable 3D identity profiles.
- Persistent profile storage.
- Additional 3D shapes and custom models.
- More AI-powered personalisation.
- Reusable interactive cube and model embedding.
- Improved accessibility and mobile responsiveness.

## Author

**Shrija S S**

GitHub: [shrija-sumathi-subramanian](https://github.com/shrija-sumathi-subramanian)

---

*TriQR — One identity, multiple dimensions.*
