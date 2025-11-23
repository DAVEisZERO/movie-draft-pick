# Movie Draft Pick

## 📋 Description

This project entails a A friendly Ionic/Angular web application to conduct movie draft picks with friends. Import Letterboxd lists and run fair drafts to decide what to watch together. The app mus be used in conjuction with a backend service for aaccoutn management providing basic account features (authentication/authorization). Per default, the [Simple Redis IAM](https://github.com/DAVEisZERO/simple-redis-iam) backend service is already configured to perfectly work with this draft pick app.

"Movie Draft Pick" helps groups fairly decide movies to watch by importing friends' Letterboxd lists and running draft rounds. The repository also intentionally includes optional insecure features so developers can learn about [OWASP Top 10 (2021)](https://owasp.org/Top10/A00_2021_Introduction/) issues in a controlled environment.

Badges: ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

---

## Table of contents

---

## 🎯 Goal

Provide a functional, user friendly web application to draft out films in a typical "movie nights" context with your dear ones. Resolving disputes/conflcits about what to watch and making the selectio process mroe efficient. Cause you know, "time is gold".
In addtion, This application demonstrates both secure and intentionally vulnerable code patterns to educate developers about common security pitfalls in realation to OWASP Top 10 web app vulnerbailities (e.g., A06, A08).

---

## 📦 Prerequisites

- Node.js (v18 LTS or later)
    - npm (v9 or later)
    - Optional: Ionic CLI for a better developer experience
- Create a TMDB API Key

### Install Node.js (recommended: NVM)

Windows (nvm-windows)

```cmd
# Download & install nvm-windows from:
# https://github.com/coreybutler/nvm-windows/releases
nvm install lts
nvm use lts
```

Linux/macOS

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your terminal or run:
source ~/.bashrc

# Install and use the latest LTS version of Node.js
nvm install --lts
nvm use --lts
```

##### Direct Installation

Visit [nodejs.org](https://nodejs.org/) and download the LTS (Long Term Support) version for your operating system.

#### Verify Installation

Check that Node.js and npm are properly installed:

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### Ionic CLI

To install the Ionic CLI, run:

```bash
npm install -g @ionic/cli
```

The Ionic CLI provides additional development tools and commands.

### TMDb API key

1. Create an account at [themoviedb.org](https://www.themoviedb.org/)
2. Go to Settings → API
3. Request an API key
4. Copy the "API Read Access Token" to the `tmdbToken` field in your environment file

## 🔧 Build and Deploy

There are two deployment approaches, highlighting the importance of respecting **A06** and **A08** OWASP vulnerabilities:

- **A06:2021** – Vulnerable and Outdated Components
- **A08:2021** – Software and Data Integrity Failures

---

## 🔒 Secure Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/strucio/movie-draft-pick.git
cd movie-draft-pick
```

### 2. Check for Outdated Components

```bash
npm outdated
```

- Red: Matches your version requirements (safe to update).

- Yellow: A newer major version exists (breaking changes).

This will install all the required packages including Angular, Ionic, and other dependencies.

### 3. Security Gate

```bash
npm audit
npm audit fix #Automatically updates minor versions to patch holes.
```

update what you need/prefer based on audit and security scans

```bash
npm update <dependency>
```

### 4. Install dependencies

Secure. (Clean Install). Fails if lockfile and package.json disagree.

```bash
npm ci --ignore-scripts # Reads only package-lock.json. Deletes node_modules first. Verifies Hashes.
```

1. INTEGRITY: Use 'npm ci' (Clean Install) instead of 'npm install'
2. SECURITY: Prevent malicious post-install scripts
    - Preventing Script Injection (A08) -> ignore-scripts flag

### 5. Running the Application

To start the development server:

```bash
# Using Ionic CLI (recommended)
ionic serve

# Or using npm
npm start
```

The application will be available at `http://localhost:4200` (or `http://localhost:8100` with Ionic CLI). The app will automatically reload when you make changes to the source files.

---

## ⚡ Non-Secure Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/strucio/movie-draft-pick.git
cd movie-draft-pick
```

### 2. Install dependencies

Reads package.json, calculates versions, updates the lockfile if needed.

```bash
npm install # ❌ Risky in Prod. (Can silently install a different version than you tested).
```

### 3. Running the Application

To start the development server:

````bash
# Using Ionic CLI (recommended)
ionic serve

# Or using npm
npm start

```bash
git clone https://github.com/strucio/movie-draft-pick.git
cd movie-draft-pick
````

---

## Configuration

### Environment files

The application uses environment-specific configuration files located in `./src/environments/`:

- `environment.ts` - Development environment settings
- `environment.prod.ts` - Production environment settings

### Important options

Edit `./src/environments/environment.ts` to modify:

```typescript
export const environment = {
    production: false,
    backendUrl: 'http://localhost:3000', // Web Scraper API URL
    tmdbToken: 'your-tmdb-api-token-here', // The Movie Database API token
    iam: {...}, // iam ednpoints (sign-up, loging etc.)
};
```

**Configuration Options:**

- **`production`**: Set to `true` for production builds
- **`backendUrl`**: URL of the web scraper API server (for importing Letterboxd lists)
- **`tmdbToken`**: API token from [The Movie Database (TMDb)](https://www.themoviedb.org/settings/api) for movie metadata

#### Backend Service Options

This app requires a backend service to scrape Letterboxd movie lists.

##### Cloud Backend (Manual Configuration Required)

To use the cloud backend, you need to manually edit `./src/environments/environment.ts`:

```typescript
// Comment out the local backend
// backendUrl: 'http://localhost:3000',

// Uncomment the cloud backend
backendUrl: 'https://letterboxd-list-scraper-lcoj.onrender.com';
```

## 🏗️ Architecture & project layout

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

### Recommended Learning Resources

- [OWASP Top 10 (2021)](https://owasp.org/www-project-top-ten/)
- [Node.js Security Handbook](https://www.nodejs-security-handbook.com/)
- [Angular Security Guide](https://angular.io/guide/security)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
