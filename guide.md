# Gmail API Authentication Setup Guide

1. **Create Google Cloud Project**:

   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Click the "Select Project" dropdown at the top of the page
   - Click "New Project"
   - Enter a project name (e.g., `mail-processor`)
   - Click "Create"

2. **Enable Gmail API**:

   - Select "APIs & Services" → "Enabled APIs & Services" from the left menu
   - Click "+ Enable APIs & Services" at the top
   - Type "Gmail" in the search bar
   - Select "Gmail API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**:

   - Select "APIs & Services" → "OAuth consent screen" from the left menu
   - Choose "External" user type (for personal projects)
   - Click "Create"
   - Fill in required information:
     - Application name
     - User support email
     - Developer contact information
   - In the "Scopes" section, add the following scopes:
     - `https://www.googleapis.com/auth/gmail.readonly` (Read emails)
     - `https://www.googleapis.com/auth/gmail.send` (Send emails)
   - In the "Test users" section, add your Gmail account
   - Complete configuration and click "Save and Continue"

4. **Create OAuth 2.0 Credentials**:

   - Select "APIs & Services" → "Credentials" from the left menu
   - Click "+ Create Credentials" → "OAuth client ID"
   - Select "Desktop application" as the application type
   - Enter a name (e.g., `Mail Processor Client`)
   - Add the following Authorized redirect URIs: `http://localhost:3000/auth/callback`, `https://developers.google.com/oauthplayground`
   - Click "Create"
   - The system will display your `Client ID` and `Client Secret`. Record these values or download the JSON directly

5. **Get Refresh Token**:

   - Visit [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Click the gear icon in the top right (Settings)
   - Check "Use your own OAuth credentials"
   - Enter your previously obtained Client ID and Client Secret
   - Find "Gmail API v1" in the left list
   - Select the required scope:
     - `https://www.googleapis.com/auth/gmail.readonly`
   - Click "Authorize APIs"
   - Sign in to your Google account and authorize
   - Click "Exchange authorization code for tokens"
   - In the response, you will see the `refresh_token`, record this value

6. **Configure Environment Variables**:
   Add the obtained credentials to your `.env` file:

   ```
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   GMAIL_REFRESH_TOKEN=your_refresh_token
   ```
