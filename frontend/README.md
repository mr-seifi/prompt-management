# Prompt Management Frontend

This is the frontend application for the Prompt Management System, built with React and TypeScript.

## Development Setup

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

1. Clone the repository
2. Navigate to the frontend directory:

```bash
cd frontend
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.sample`:

```bash
cp .env.sample .env
```

5. Start the development server:

```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

To build the application for production:

```bash
npm run build
```

This creates a `build` folder with the optimized production build.

## Deployment

### Using Docker

The application can be deployed using Docker. The included Dockerfile sets up a production-ready container with Apache.

Build the Docker image:

```bash
docker build -t prompt-manager-frontend .
```

Run the container:

```bash
docker run -p 8001:80 prompt-manager-frontend
```

The app will be available at [http://localhost:8001](http://localhost:8001) when running in Docker.

### Environment Variables

The following environment variables can be set to configure the application:

- `REACT_APP_API_URL`: URL of the backend API (e.g., `https://prompt-back.aminseifi.com/api`)
- `REACT_APP_ENVIRONMENT`: `development`, `test`, or `production`
- `REACT_APP_USE_MOCK_DATA`: `true` or `false` - whether to use mock data instead of real API calls
- `REACT_APP_AUTH_STORAGE_KEY`: The key used to store authentication information in localStorage

## GitHub Actions CI/CD

The project includes a GitHub Actions workflow in `.github/workflows/frontend-deploy.yml` that handles:

1. Building and testing the application
2. Building a Docker image
3. Pushing the image to Docker Hub
4. Triggering a deployment

To enable CI/CD, set the following secrets in your GitHub repository:

- `DOCKER_HUB_USERNAME`: Your Docker Hub username
- `DOCKER_HUB_TOKEN`: Your Docker Hub access token
- `REACT_APP_API_URL`: The URL to the backend API

## Project Structure

```
frontend/
├── public/            # Static files
├── src/               # Source code
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── context/       # React context providers
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── styles/        # Global styles
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Root component
│   └── index.tsx      # Application entry point
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Learn More

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Create React App Documentation](https://create-react-app.dev/docs/getting-started/) 