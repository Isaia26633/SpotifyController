require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
});

app.get('/login', (req, res) => {
    const scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Error:', error);
        res.send(`Error: ${error}`);
        return;
    }
    spotifyApi.authorizationCodeGrant(code).then(data => {
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];
        const expiresIn = data.body['expires_in'];

        // Set the access token and refresh token for the API calls
        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        console.log('Access Token:', accessToken, refreshToken);

        // Send the user to the next page (adjust for your setup)
        res.redirect('/searchPage'); // You can replace this with a more meaningful page like /dashboard or home

        // Handle token refresh in the background
        setInterval(async () => {
            try {
                const data = await spotifyApi.refreshAccessToken();
                const newAccessToken = data.body['access_token'];
                spotifyApi.setAccessToken(newAccessToken);
                console.log('Token refreshed:', newAccessToken); // Log the refreshed token if needed
            } catch (err) {
                console.error('Error refreshing access token:', err);
            }
        }, (expiresIn / 2) * 1000); // Refresh half the expiration time

    }).catch(error => {
        console.error('Error during authorization:', error);
        res.status(500).send(`Error during authorization: ${error.message}`);
    });
});

app.get('/search', (req, res) => {
    const { q } = req.query;

    // Check if the access token is set before making the search request
    if (!spotifyApi.getAccessToken()) {
        return res.status(401).send('Unauthorized: Access token missing or invalid');
    }

    spotifyApi.searchTracks(q)
        .then(searchData => {
            if (searchData.body.tracks.items.length > 0) {
                const track = searchData.body.tracks.items[0]; // Grab the first track from the search results
                const trackInfo = {
                    name: track.name,
                    artist: track.artists[0].name,
                    uri: track.uri,
                    cover: track.album.images[0].url, // Get the album cover URL
                };
                res.json(trackInfo);
            } else {
                res.status(404).send('No tracks found');
            }
        })
        .catch(err => {
            console.error('Error searching tracks:', err); // Log the full error
            res.status(500).send(`Error: ${err.message}`); // Return detailed error message
        });
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/searchPage', (req, res) => {
    res.render('searchPage');
});

//plays the song when the play button is pressed

app.post('/play', (req, res) => {
    const { uri } = req.body;

    if (!uri) {
        return res.status(400).json({ error: "Missing track URI" });
    }

    spotifyApi.play({ uris: [uri] })
        .then(() => {
            res.json({ success: true, message: "Playing track!" });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: "Playback failed, make sure Spotify is open" });
        });
});

//adds song to queue
app.post('/queue', (req, res) => {
    const { uri } = req.body;

    if (!uri) {
        return res.status(400).json({ error: "Missing track URI" });
    }

    spotifyApi.addToQueue(uri)
        .then(() => {
            res.json({ success: true, message: "Added track to queue!" });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: "Failed to add track to queue" });
        });
})

//skip track
app.post('/next', (req, res) => {
    spotifyApi.skipToNext()
        .then(() => {
            res.json({ success: true, message: "Skipped to next track" });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: "Failed to skip track" });
        });
});

//previou tracks
app.post('/previous', (req, res) => {
    spotifyApi.skipToPrevious()
        .then(() => {
            res.json({ success: true, message: "Skipped to previous track" });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: "Failed to skip to previous track" });
        });
});

app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});
