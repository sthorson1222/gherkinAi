# GherkinGenius Control Plane

A React-based dashboard for generating Cucumber/Playwright test cases using AI (Google Gemini) and managing test execution across local and Dockerized environments.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

1.  **Node.js**: v18 or higher.
2.  **Docker & Docker Compose**: Required if you plan to run tests in isolated containers.
3.  **Google Gemini API Key**: You need a paid API key from Google AI Studio.

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd gherkin-genius
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up your environment variables:
    *   Create a `.env` file in the root directory.
    *   Add your API key:
        ```env
        API_KEY=your_actual_api_key_here
        ```

## Running the Application

You can run the application in two modes: **Host Mode** (runs directly on your machine) or **Docker Mode** (runs entirely within containers).

### Option A: Quick Start (Host Mode)

This is best for local development if you have Playwright browsers installed locally.

1.  **Start the Backend Server**:
    ```bash
    node server.js
    ```
    *   Runs on `http://localhost:3001`

2.  **Start the Frontend**:
    In a separate terminal:
    ```bash
    npm start
    # OR if using a bundler command defined in package.json, otherwise serve the index.html
    ```
    *   *Note: If you are using a simple file server, ensure it serves `index.html` on port 3000 or configure the backend URL in the UI settings.*

### Option B: Docker Environment (Recommended)

This sets up the Control Plane and a dedicated Playwright Runner container.

1.  **Build and Start**:
    ```bash
    docker-compose up -d --build
    ```

2.  **Access the App**:
    *   Open your browser to `http://localhost:3000`.

3.  **Execution Config**:
    *   In the UI Dashboard, open **Settings**.
    *   Set **Operation Mode** to **Real Execution**.
    *   Set **Execution Environment** to **Docker Container**.
    *   Ensure Backend URL is `http://localhost:3001`.
    *   Ensure Container Name is `playwright-runner`.

## Project Structure

*   `components/`: React UI components (Dashboard, Runner, Generator).
*   `services/`: AI integration logic (`geminiService.ts`).
*   `server.js`: Node.js Express server acting as the bridge between UI and CLI tools.
*   `tests/generated/`: Directory where generated `.feature` and `.ts` files are stored.
*   `docker-compose.yml`: Infrastructure configuration.

## Troubleshooting

*   **Blank Screen?** check the browser console. The app uses ES modules; ensure your browser supports them.
*   **Docker Logs not streaming?** Ensure the `playwright-runner` container is running (`docker ps`) and that the Backend URL in the UI settings matches the server's address.
*   **API Key Errors?** Verify the key is correctly set in the `.env` file or passed into the docker-compose environment variables.
