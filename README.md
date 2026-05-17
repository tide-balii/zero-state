# SafeSpeak

SafeSpeak is an anonymous whistleblowing and feedback platform built on the Midnight Network and powered by Google Gemini AI. It allows whitelisted members to publish verified reports to a public ledger while cryptographically concealing their exact identities.

## Prerequisites

To run this application locally or in production, you must fulfill the following requirements:

1. Node.js (v18.0.0 or higher).
2. The Midnight Lace browser extension installed in your web browser.
3. Within your Lace extension settings:
   - Ensure the network is configured to Midnight Preview.
   - Ensure the dApp Connector setting is enabled.
4. A Google Gemini API key.

## Project Structure

- whitelist.compact: The Midnight smart contract defining the cryptographic set-membership Merkle tree rules, historic root checks, and nullifiers.
- frontend/: The React application and Express server.
  - client/: React, TypeScript, and Tailwind CSS frontend pages and state controls.
  - server/: Express backend serving production assets and running the Google Gemini text sanitization pipeline.

## Configuration

Navigate to the frontend directory and create a .env file:

```bash
cd frontend
```

Add the following environment variables to your .env file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_MIDNIGHT_NETWORK=preview
PORT=3000
```

Explanation of variables:
- GEMINI_API_KEY: Used by the Express server to sanitize incoming whistleblower text.
- VITE_MIDNIGHT_NETWORK: Tells the frontend which network ID to request from the Lace dApp connector.
- PORT: The port number the Express server will listen on.

## Installation

Install the project dependencies from the frontend directory:

```bash
npm install
```

## Running the Application

To run the application, follow these two steps:

### Step 1: Build the Static Assets
Compile the React frontend client and the backend server files by running the build script:

```bash
npm run build
```

This command bundles the client-side assets into dist/public and uses esbuild to bundle the Express server into dist/index.js.

### Step 2: Start the Express Server
Launch the server using Node or tsx with your configured environment variables.

For development or local testing:

```bash
npx tsx --env-file=.env server/index.ts
```

For production execution:

```bash
NODE_ENV=production node --env-file=.env dist/index.js
```

Once started, open your browser and navigate to:
http://localhost:3000

## How It Works

1. Authentication: The user connects their Lace wallet. The DApp performs a dynamic discovery lookup and ensures the wallet is configured to the Midnight Preview network.
2. Submission: The user inputs a detailed incident report.
3. AI Sanitization: The report is securely processed on the backend via the Gemini API, stripping away all names, locations, and identifying details while maintaining the core factual allegation.
4. ZK-Proof Generation: The Lace wallet generates a zero-knowledge proof proving set membership inside the company whitelist Merkle tree (defined in whitelist.compact).
5. On-Chain Ledger: The sanitized report and the ZK-proof are submitted to the Midnight network. Once verified on-chain, it is permanently published to the Public Whistleblower Ledger. A unique cryptographic nullifier is also recorded to prevent double-submissions without revealing the user's private key.
