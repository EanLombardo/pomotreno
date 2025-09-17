# Gemini Project Information

## Project Overview

This project is a Pomodoro timer application called Pomotreno. It is a web-based application that runs entirely in the browser. The main features are a Pomodoro timer, task management, and session history. It uses the Picture-in-Picture API to display an always-visible timer. All data is stored locally using WatermelonDB.

## How to Build, Run, and Test

*   **Install Dependencies:** `npm install`
*   **Run in Development Mode:** `npm run dev`
*   **Build for Production:** `npm run build`

There are currently no automated tests for this project.

## Key Files and Their Purpose

*   `index.html`: The main entry point of the application.
*   `src/main.ts`: The main TypeScript file that initializes the Vue application.
*   `src/db.ts`: Configures and initializes the WatermelonDB database.
*   `src/background.ts`: Contains the logic for the background service worker (if any).
*   `src/timer.ts`: Contains the core logic for the Pomodoro timer.
*   `src/routing.ts`: Defines the application's routing.
*   `src/components/`:
    *   `TimerPage.vue`: The main page for the Pomodoro timer.
    *   `TaskPage.vue`: The page for managing tasks.
    *   `NewTimerDialog.vue`: A dialog for creating new timers.
    *   `Sidebar.vue`: The main navigation sidebar.
    *   `TaskPieChart.vue`: A component to visualize task data.
    *   `TaskTable.vue`: A table to display tasks.
    *   `Timeline.vue`: A component to display the session history.
    *   `TimerControlls.vue`: The controls for the Pomodoro timer (start, pause, reset).
