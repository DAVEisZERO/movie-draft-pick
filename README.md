# Movie Draft Pick

A web application for conducting movie draft picks with friends. Import movie lists from platforms like Letterboxd and conduct fair drafts to decide what to watch together.

## 📋 Prerequisites

Before you can run this application, you need to have Node.js installed on your system.

### Installing Node.js

#### Option 1: Using NVM (Recommended)

NVM (Node Version Manager) allows you to easily install and switch between different Node.js versions.

**On Linux/macOS:**

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your terminal or run:
source ~/.bashrc

# Install and use the latest LTS version of Node.js
nvm install --lts
nvm use --lts
```

**On Windows:**

1. Download and install [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
2. Open a new command prompt as Administrator
3. Run:

```cmd
nvm install lts
nvm use lts
```

#### Option 2: Direct Installation

Visit [nodejs.org](https://nodejs.org/) and download the LTS (Long Term Support) version for your operating system.

### Verify Installation

Check that Node.js and npm are properly installed:

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/strucio/movie-draft-pick.git
cd movie-draft-pick
```

### 2. Install Dependencies

```bash
npm install
```

This will install all the required packages including Angular, Ionic, and other dependencies.

### 3. Install Ionic CLI (Optional but Recommended)

```bash
npm install -g @ionic/cli
```

The Ionic CLI provides additional development tools and commands.

## 🏃‍♂️ Running the Application

### Development Server

To start the development server:

```bash
# Using Ionic CLI (recommended)
ionic serve

# Or using npm
npm start
```

The application will be available at `http://localhost:4200` (or `http://localhost:8100` with Ionic CLI). The app will automatically reload when you make changes to the source files.

## ⚙️ Configuration

### Environment Settings

The application uses environment-specific configuration files located in `./src/environments/`:

- `environment.ts` - Development environment settings
- `environment.prod.ts` - Production environment settings

#### Key Configuration Options

Edit `./src/environments/environment.ts` to modify:

```typescript
export const environment = {
    production: false,
    backendUrl: 'http://localhost:3000', // Web Scraper API URL
    tmdbToken: 'your-tmdb-api-token-here', // The Movie Database API token
};
```

**Configuration Options:**

- **`production`**: Set to `true` for production builds
- **`backendUrl`**: URL of the web scraper API server (for importing Letterboxd lists)
- **`tmdbToken`**: API token from [The Movie Database (TMDb)](https://www.themoviedb.org/settings/api) for movie metadata

#### Backend Service Options

This app requires a backend service to scrape Letterboxd movie lists. You have two options:

##### Option 1: Local Backend (Default - Recommended for Development)

```typescript
backendUrl: 'http://localhost:3000';
```

- **Pros**: Much faster, better for testing and development
- **Cons**: Requires setting up the web scraper service locally
- **Default**: This is the default configuration when you run `ionic serve` or `npm start`

##### Option 2: Cloud Backend (Manual Configuration Required)

To use the cloud backend, you need to manually edit `./src/environments/environment.ts`:

```typescript
// Comment out the local backend
// backendUrl: 'http://localhost:3000',

// Uncomment the cloud backend
backendUrl: 'https://letterboxd-list-scraper-lcoj.onrender.com';
```

- **Pros**: No backend service setup required on your machine
- **Cons**: Significantly slower due to cloud hosting limitations
- **Setup**: Requires manually switching the URLs in the environment file

### Getting a TMDb API Token

1. Create an account at [themoviedb.org](https://www.themoviedb.org/)
2. Go to Settings → API
3. Request an API key
4. Copy the "API Read Access Token" to the `tmdbToken` field in your environment file

## 🏗️ Project Structure

This is an **Angular** application using the **Ionic** framework:

- **Angular**: A web application framework for building single-page applications
- **Ionic**: A framework for building mobile-first web apps with native-like UI components

```text
src/
├── app/
│   ├── classes/          # Data models and classes
│   ├── components/       # Reusable UI components
│   ├── pages/            # Application pages/screens
│   └── services/         # Business logic and API calls
├── assets/               # Static files (images, icons)
├── environments/         # Configuration files
└── theme/                # Styling and CSS variables
```
