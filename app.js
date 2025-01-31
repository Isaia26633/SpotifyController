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

        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        console.log('Access Token:', accessToken, refreshToken);
        res.redirect('/searchPage');


        setInterval(async () => {
            const data = await spotifyApi.refreshAccessToken();
            const accessToken = data.body['access_token'];
            spotifyApi.setAccessToken(accessToken);
        }, expiresIn / 2 * 1000);

    }).catch(error => {
        console.error('Error:', error);
        res.send(`Error: ${error}`);
    });
});

app.get('/search', (req, res) => {
    const { q } = req.query;

    spotifyApi.searchTracks(q)
        .then(searchData => {
            if (searchData.body.tracks.items.length > 0) {
                const track = searchData.body.tracks.items[0]; // First result
                res.json({
                    name: track.name,
                    artist: track.artists[0].name,
                    cover: track.album.images[0].url,
                    uri: track.uri // Still sending URI for backend use
                });
            } else {
                res.json({ error: "No results found" });
            }
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: "Something went wrong" });
        });
});

app.get('/play', (req, res) => {
    const { uri } = req.query;
    spotifyApi.play({ uris: [uri] }).then(() => {
        res.send('success');
    }).catch(err => {
        console.error('Error:', err);
        res.status(500).send(err); // Improved error handling
    });
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/searchPage', (req, res) => {
    res.render('searchPage');
});

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


app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});