# Fuel Pass Bangladesh

Fuel Pass Bangladesh is a comprehensive system designed to manage and monitor fuel distribution across the country. This repository contains the source code for the server, web client, and mobile application.

## Project Structure

- **server/**: Express.js backend with MySQL database.
- **client/**: React (Vite) web dashboard for users and administrators.
- **mobile/**: Expo (React Native) mobile application for vehicle owners.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL](https://www.mysql.com/) database

### Running the Server

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in a `.env` file.
4. Run migrations and seed the database:
   ```bash
   npx tsx migrate_db.ts
   npx tsx seed.ts
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### Running the Web Client

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### Running the Mobile App

1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo project:
   ```bash
   npm start
   ```

## Features

- **Dynamic QR Code**: Secure vehicle identification with 1-minute auto-refreshing JWT tokens.
- **Quota Management**: Real-time tracking of weekly fuel limits.
- **Dashboard**: Visual tracking of fuel consumption and history.
- **Multi-role Access**: Separate dashboards for Owners, Operators, and Distributors.

