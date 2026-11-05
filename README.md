
# TriQR

### AI-Powered Interactive 3D Personal Identity Cube

TriQR is an AI-powered personal identity platform that transforms your digital presence into an interactive 3D cube.

Users can add their professional and personal links, receive AI-powered recommendations for the most useful links, and generate a personalized visual theme for their identity cube.

## Features

- Personal profile and link validation
- AI-powered link recommendations using Google Gemini
- Automatic separation of recommended and additional links
- AI-generated cube design themes
- QR code generation for personal links
- Interactive 3D identity cube (in development)

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Three.js
- React Three Fiber
- Drei
- Google Gemini API
- Zod
- QRCode

## Current Development Status

**Completed:**
- Project setup
- Profile validation API
- QR code generation API
- AI recommendation API
- AI design generation API
- Backend integration testing
- Initial 3D frontend folder setup

**Upcoming:**
- Profile creation interface
- Link management interface
- AI recommendation preview
- Interactive 3D cube
- QR code integration with cube faces
- Additional links display
- Deployment

## Getting Started

Clone the repository:

```bash
git clone https://github.com/shrija-sumathi-subramanian/TriQR.git
cd TriQR
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Project Vision

TriQR aims to make sharing a digital identity more engaging by combining AI-powered personalization, QR technology, and interactive 3D experiences.

## Author

Shrija S S
<<<<<<< HEAD
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
# TriQR – AI-Powered 3D Personal Identity Generator

TriQR is an open-source web application that uses Artificial Intelligence to create interactive 3D identity cubes containing three unique QR codes for contact information, email and portfolio links.

Users can rotate and explore the cube, with each QR code displayed on a separate face. AI automatically generates the cube's visual design and QR code placement.

## Problem Statement

Sharing multiple personal identity links through separate QR codes can be inconvenient. TriQR aims to combine these details into a single interactive 3D identity object.

## Core Features

- Generate three independent QR codes.
- Contact QR using vCard format.
- Email QR using mailto format.
- Portfolio QR using a website URL.
- AI-generated cube design configuration.
- Interactive 3D cube visualization.
- Automatic QR code placement.
- Rotate and zoom functionality.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Three.js
- React Three Fiber
- Drei
- QRCode
- AI API
- Zod

## Project Status

Currently under development. Features will be implemented and tested incrementally.

## Future Enhancements

- Downloadable QR images.
- Save and share identity cubes.
- Additional 3D shapes.
- Custom themes and layouts.
- Exportable 3D models.

## Contribution

Contributions, suggestions and improvements are welcome.

## License

MIT License (to be finalized before the first public release).

## Author

Developed as an independent open-source project.
>>>>>>> origin/main
