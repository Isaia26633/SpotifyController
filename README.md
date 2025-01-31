---

# SpotifyController

A simple Node.js application that allows users to search for Spotify tracks and play them directly from the app. The app integrates with the **Spotify Web API** to enable searching for tracks, fetching their information, and playing them.

## Features
- Search for Spotify tracks by name.
- Play tracks directly from the app.
- User authentication and Spotify access token handling.

**Note**: To play tracks, you must have a Spotify client (e.g., the desktop or mobile app) running and logged in on the same account, as the app uses **Spotify Connect** to control playback.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v12 or higher)
- **npm** (Node Package Manager)

You can download Node.js from [here](https://nodejs.org/).

Additionally, make sure that you have **Spotify running** on your device and that you're logged in to your account. This app uses **Spotify Connect** to control the playback, so the client must be active.

---

## Installation

### 1. Clone the Repository

Clone the repository to your local machine using Git:

```bash
git clone https://github.com/isaia26633/SpotifyController.git
cd SpotifyController
```

### 2. Install Dependencies

After cloning the repository, navigate to the project directory and install the required Node.js packages:

```bash
npm install
```

This will download and install all the dependencies listed in `package.json`.

---

## Setup

### 1. Create a Spotify Developer Application

Each user needs to create their own **Spotify Developer Application** to get the necessary credentials (client ID, client secret, and redirect URI).

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications).
2. Create a new app.
3. After creating the app, you will see the **Client ID**, **Client Secret**, and **Redirect URI**.

### 2. Add Your Credentials

Create a `.env` file in the root of your project with the following content:

```plaintext
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://localhost:3000/callback
```

Make sure to replace `your_spotify_client_id` and `your_spotify_client_secret` with the actual values you got from the Spotify Developer Dashboard.

**Important**: The `.env` file will be different for each user because the **Client ID**, **Client Secret**, and **Redirect URI** are unique to the Spotify Developer Application you create. 

---

## Running the Application

### 1. Start the Server

After setting up the `.env` file with your credentials, run the server with the following command:

```bash
node app
```

This will start the Node.js server on **http://localhost:3000**.

### 2. Open Your Browser

Visit **http://localhost:3000/login** to authenticate with Spotify and grant the app access. After logging in and authorizing the app, you'll be redirected back to the app's **callback** route, and the authentication tokens will be saved.

### 3. Search and Play Tracks

Once logged in, you can search for Spotify tracks by going to **http://localhost:3000/search?q=your-query**, where `your-query` is the name of the song or artist you want to search.

**Important**: To **play the track**, you need to have **Spotify running** on your device (either desktop or mobile app), logged in to the same account. The app uses **Spotify Connect** to control the playback on your active Spotify device.

---

## Routes

- **/login**: Redirects to Spotify's authorization page.
- **/callback**: Handles the Spotify API's redirect after user authentication and stores access tokens.
- **/search?q=your-query**: Searches Spotify tracks by query (e.g., song name or artist).
- **/play?uri=track-uri**: Plays a selected track from its Spotify URI.

---

## Example Usage

1. Navigate to **http://localhost:3000/login** and authorize the app.
2. After authentication, go to **http://localhost:3000/search?q=Imagine Dragons** to search for tracks by Imagine Dragons.
3. Once the search results are returned, you can play a track by visiting **http://localhost:3000/play?uri=spotify:track:trackId** (replace `trackId` with the actual track URI).

**Note**: You must have Spotify open and logged in on the same account for the playback to work via **Spotify Connect**.

---

## Troubleshooting

- If you receive a **`INVALID_CLIENT`** error, double-check that your **client ID** and **client secret** are correct in the `.env` file.
- If the app is redirecting you too many times, ensure that the **redirect URI** in your Spotify Developer Dashboard matches the `REDIRECT_URI` you set in `.env`.
- Ensure that you have **Spotify running** on your device and that you're logged in to the same account for **Spotify Connect** to work properly.

---
