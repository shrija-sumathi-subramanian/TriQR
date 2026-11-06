
# TriQR

### Your Links. Your Shape. Your Identity.

TriQR is an AI-powered 3D identity builder that transforms personal, professional and project links into interactive 3D models with scannable QR codes.

Users can choose from multiple 3D shapes, add unlimited URLs, automatically identify link types using AI, customise display names, assign QR codes to model faces and export their personalised 3D identity for use across different platforms.

## Features

### 1. Multiple 3D Shapes
- Choose from cube, pyramids, prisms, octahedron, dodecahedron, icosahedron and other geometric models.
- Each shape has a predefined number of faces and QR slots.
- The front face is reserved for the user's name and never contains a QR code.

### 2. AI-Powered URL Identification
- Automatically identify URL categories without requiring users to select a link type.
- Recognise platforms and categories such as LinkedIn, GitHub, Instagram, YouTube, portfolios, websites, companies and projects.
- Identify deployed websites hosted on platforms such as Vercel and Netlify.
- Classify unrecognised URLs as Other when their purpose cannot be determined confidently.
- Analyse accessible webpage information to improve identification.

### 3. URL Verification
- Validate URL formats.
- Check website accessibility where possible.
- Detect redirects and inaccessible destinations.
- Clearly indicate links that could not be verified.

### 4. Custom Display Names
- Add personalised display names to every URL.
- Keep display names independent of automatically identified link categories.
- Edit names before generating the final model.
- Support multiple URLs belonging to the same category.

### 5. QR Code Generation
- Generate an individual QR code for every valid URL.
- Maintain separate QR codes even for multiple links from the same platform.
- Display QR codes on the selected model faces.
- Keep unassigned links in a separate additional-links section.

### 6. Fixed QR Capacity
- Each 3D shape has a predefined QR capacity based on its usable faces.
- Users can choose which links appear on the model.
- The application prevents assignments beyond the selected shape's capacity.
- The front face is always reserved for the user's name.

### 7. AI and Manual Design Customisation
- Generate personalised design themes using AI.
- Manually customise colours, typography and decorations.
- Preview design changes before final generation.
- Allow users to modify AI-generated designs.

### 8. Interactive 3D Preview
- Rotate models using mouse drag or touch drag.
- Zoom using pinch gestures on supported touch devices.
- Keep normal webpage scrolling independent of model interaction.
- Click a face to smoothly align the camera with that face.
- Display the selected face directly, clearly and without an angled viewing perspective.
- Provide a reset control to return to the front face.
- Restore the initial front-face camera view after a page refresh.

### 9. Editing and Final Generation
- Edit the user's name and link display names.
- Change QR assignments between faces.
- Modify colours, typography and decorations.
- Preview the complete model before confirming final generation.

### 10. Multiple Export Options

**Download 3D Model**
- Export models in GLB and GLTF formats.
- Include model geometry and QR face textures.

**Export HTML / JavaScript**
- Download reusable source code.
- Preserve interactive 3D rotation and face details.
- Integrate the model into independent websites and projects.

**Embed on Websites**
- Copy an embed snippet.
- Display the interactive 3D model inside external websites.
- Use a hosted viewer for shareable embedded models.

## How It Works

1. Choose a 3D shape.
2. Enter your name and add multiple URLs.
3. Let AI identify the URL categories.
4. Verify URLs and analyse accessible webpage information.
5. Add personalised display names.
6. Generate individual QR codes.
7. Select which QR codes to place on the model.
8. Customise the appearance using AI or manual settings.
9. Preview and interact with the 3D model.
10. Edit and confirm the final design.
11. Export the model as GLB/GLTF, HTML/JavaScript or an embeddable experience.

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

The maximum QR capacity is based on usable faces. Shapes with faces too small to display a reliably scannable QR code may have a lower usable capacity.

Users can add any number of URLs. However, only the number of QR codes supported by the selected model can be assigned to its faces. Remaining links are displayed separately.

## 3D Interaction Controls

| Action | Behaviour |
|---|---|
| Mouse drag | Rotate the model |
| Touch drag | Rotate the model |
| Pinch | Zoom in or out |
| Mouse wheel | Normal webpage scrolling |
| Click a face | Align camera with the selected face |
| Reset view | Return to the front face |
| Refresh page | Restore the front-face view |

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework |
| React | User interface |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling |
| Three.js | 3D model rendering |
| React Three Fiber | React-based 3D integration |
| React Three Drei | 3D controls and utilities |
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

It provides users with a flexible way to organise their digital presence and represent it through interactive 3D models.

## Future Enhancements

- Publicly shareable 3D identity profiles.
- Persistent user profile and model storage.
- Additional geometric shapes and custom 3D models.
- Advanced AI-powered link recommendations.
- More design themes and customisation options.
- Reusable interactive 3D model library.
- Improved mobile accessibility and responsiveness.

## Author

**Shrija S S**

GitHub: [shrija-sumathi-subramanian](https://github.com/shrija-sumathi-subramanian)

---

*TriQR — One identity, multiple dimensions.*
