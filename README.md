[![Next.js](https://img.shields.io/badge/Next.js-13.5.1-black.svg?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.12.7-22B5BF.svg)](https://recharts.org/)
[![AI](https://img.shields.io/badge/AI-Groq_API-F55036.svg)](https://groq.com/)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel-black.svg?logo=vercel)](https://vercel.com/)
[![GitHub](https://img.shields.io/badge/Repository-GitHub-181717.svg?logo=github)](https://github.com/SeyedRezaZibjou/DataMind)

# DataMind --- AI-Powered Data Analysis & Visualization

DataMind is a web-based data analysis platform that helps users explore
datasets, understand data quality, create visualizations, generate
reports, and ask questions about their data using an AI assistant.

The application is designed with a clean interface and supports
**English and Persian**, **LTR and RTL layouts**, and **light and dark
themes**.

## Features

-   **Dataset upload** --- import datasets and inspect their structure.
-   **Data overview** --- review dataset dimensions, column information,
    and descriptive statistics.
-   **Data quality** --- explore missing values, duplicate records, and
    other data-quality indicators.
-   **Data visualization** --- create charts to explore patterns and
    relationships in the data.
-   **Reports** --- access analysis results in a report-oriented view.
-   **AI assistant** --- ask questions about the currently loaded
    dataset and receive context-aware answers.
-   **Internationalization** --- English and Persian interface support,
    including RTL layout.
-   **Theme support** --- light and dark modes.
-   **Local persistence** --- dataset state is stored in the browser
    using IndexedDB.

## AI Assistant

The AI assistant uses the **Groq API** through a server-side Next.js API
route. Relevant dataset context is prepared by the application and sent
to the model so that responses can refer to the loaded dataset.

The default model configured for this project is:

``` env
GROQ_MODEL=openai/gpt-oss-20b
```

The API key is kept on the server and must never be exposed through a
`NEXT_PUBLIC_` environment variable or committed to source control.

## Technology Stack

-   **Framework:** Next.js 13.5.1 (App Router)
-   **Language:** TypeScript
-   **UI:** React 18, Tailwind CSS, shadcn/ui, Radix UI
-   **Charts:** Recharts
-   **AI API:** Groq
-   **Client-side storage:** IndexedDB
-   **Icons:** Lucide

## Getting Started

### Prerequisites

-   Node.js and npm
-   A Groq API key if you want to use the AI assistant

### 1. Clone the repository

``` bash
git clone https://github.com/SeyedRezaZibjou/DataMind.git
cd DataMind
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a file named `.env.local` in the project root:

``` env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
```

Replace `your_groq_api_key` with your own Groq API key. Keep
`.env.local` private. It should not be committed to Git.

### 4. Run the development server

``` bash
npm run dev
```

Open <http://localhost:3000> in your browser.

## Available Scripts

``` bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Start the production server
npm run typecheck # Run TypeScript type checking
```

## Project Structure

``` text
app/
  api/
    chat/          # Server-side AI chat endpoint
  assistant/       # AI assistant page
  overview/        # Dataset overview
  quality/         # Data quality analysis
  visualization/   # Data visualization
  reports/         # Reports
  upload/          # Dataset upload
  settings/        # Application settings
  about/           # About page

components/        # Reusable UI components
hooks/             # Custom React hooks
lib/
  ai/              # AI context-building utilities
  dataset/         # Dataset parsing and analysis logic
```

## Security Notes

-   Never commit `.env.local` or any file containing API keys.
-   Keep `GROQ_API_KEY` server-side.
-   Do not expose private credentials in client-side code or public
    repositories.

## Deployment

DataMind can be deployed to platforms that support Next.js, such as
[Vercel](https://vercel.com/).

When deploying, configure the following environment variables in the
hosting platform:

-   `GROQ_API_KEY`
-   `GROQ_MODEL`

Do not upload `.env.local` to the hosting platform or commit it to Git;
enter the values through the platform's environment-variable settings.

## Project Status

The project is under active development. Features and documentation may
evolve as development continues.

## Author

**Seyed Reza Zibjou**

-   GitHub: [@SeyedRezaZibjou](https://github.com/SeyedRezaZibjou)
-   LinkedIn: [zibjou](https://www.linkedin.com/in/zibjou)
-   YouTube: [Excel By Reza](https://www.youtube.com/@ExcelByReza)
-   Email: <seyed.reza.zibjou@gmail.com>

------------------------------------------------------------------------

If you find this project useful, feel free to explore the repository and
share your feedback.
