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
    const scopes = [
        'user-read-private',
        'user-read-email',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-library-modify',
        'user-library-read',
        'user-top-read'
    ];
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
                res.status(404).json({ error: 'No tracks found' });
            }
        })
        .catch(err => {
            console.error('Error searching tracks:', err); // Log the full error
            res.status(500).send(`Error: ${err.message}`); // Return detailed error message
        });
});


//gets the users currently playing song if theyre listening to anything on spotify
app.get('/currentSong', (req, res) => {
    spotifyApi.getMyCurrentPlayingTrack()
        .then(data => {
            if (data.body.item) {
                const track = data.body.item;
                const trackInfo = {
                    name: track.name,
                    artist: track.artists[0].name,
                    uri: track.uri,
                    cover: track.album.images[0].url,
                };
                res.json(trackInfo);
            } else {
                res.status(404).json({ error: 'No tracks found' });
            }
        })
        .catch(err => {
            console.error('Error getting current track:', err);
            res.status(500).send(`Error: ${err.message}`);
        });
});

app.get('/topTracks', (req, res) => {
    const timeRange = req.query.time_range || 'long_term'; // 'long_term' is for the past year

    spotifyApi.getMyTopTracks({ time_range: timeRange, limit: 10 })
        .then(data => {
            res.json(data.body.items);
        })
        .catch(err => {
            console.error('Error fetching top tracks:', err);
            res.status(500).json({ error: `Error: ${err.message}` });
        });
});

app.get('/topArtists', (req, res) => {
    const timeRange = req.query.time_range || 'long_term'; // 'long_term' is for the past year

    spotifyApi.getMyTopArtists({ time_range: timeRange, limit: 10 })
        .then(data => {
            res.json(data.body.items);
        })
        .catch(err => {
            console.error('Error fetching top artists:', err);
            res.status(500).json({ error: `Error: ${err.message}` });
        });
});



app.get('/', (req, res) => {
    res.render('index');
});

app.get('/searchPage', (req, res) => {
    res.render('homePage');
});

app.get('/stats', (req, res) => {
    res.render('stats');
});

app.get('/playbackState', (req, res) => {
    if (!spotifyApi.getAccessToken()) {
        return res.status(401).send('Unauthorized: Access token missing or invalid');
    }

    spotifyApi.getMyCurrentPlaybackState()
        .then(data => {
            if (data.body && data.body.is_playing !== undefined) {
                const playbackState = {
                    isPlaying: data.body.is_playing,
                    progress_ms: data.body.progress_ms,
                    track: data.body.item ? {
                        name: data.body.item.name,
                        artist: data.body.item.artists[0].name,
                        uri: data.body.item.uri,
                        cover: data.body.item.album.images[0].url,
                        duration_ms: data.body.item.duration_ms
                    } : null
                };
                res.json(playbackState);
            } else {
                res.status(404).json({ error: 'No playback state found' });
            }
        })
        .catch(err => {
            console.error('Error getting playback state:', err);
            res.status(500).send(`Error: ${err.message}`);
        });
});

//plays the song when the play button is pressed

app.post('/play', (req, res) => {
    const { uri } = req.body;

    if (!uri) {
        return res.status(400).json({ error: "Missing track URI" });
    }

    // Extract the track ID from the URI
    const trackIdPattern = /^spotify:track:([a-zA-Z0-9]{22})$/;
    const match = uri.match(trackIdPattern);
    if (!match) {
        return res.status(400).json({ error: 'Invalid track URI format' });
    }
    const trackId = match[1];

    // Get track details to include the track info in the response
    spotifyApi.getTrack(trackId)
        .then(trackData => {
            const track = trackData.body;
            const trackInfo = {
                name: track.name,
                artist: track.artists[0].name,
                uri: track.uri,
                cover: track.album.images[0].url,
            };

            // Play the track
            spotifyApi.play({ uris: [uri] })
                .then(() => {
                    res.json({ success: true, message: "Playing track!", trackInfo });
                })
                .catch(err => {
                    console.error('Error:', err);
                    res.status(500).json({ error: "Playback failed, make sure Spotify is open" });
                });
        })
        .catch(err => {
            console.error('Error fetching track details:', err);
            res.status(500).json({ error: `Error: ${err.message}` });
        });
});

//adds song to queue
app.post('/queue', (req, res) => {
    const { uri } = req.body;

    if (!uri) {
        return res.status(400).json({ error: "Missing track URI" });
    }

    // Extract the track ID from the URI
    const trackIdPattern = /^spotify:track:([a-zA-Z0-9]{22})$/;
    const match = uri.match(trackIdPattern);
    if (!match) {
        return res.status(400).json({ error: 'Invalid track URI format' });
    }
    const trackId = match[1];

    // Get track details to include the track name in the response
    spotifyApi.getTrack(trackId)
        .then(trackData => {
            const track = trackData.body;
            const trackInfo = {
                name: track.name,
                artist: track.artists[0].name,
                uri: track.uri,
                cover: track.album.images[0].url,
            };

            // Add the track to the queue
            spotifyApi.addToQueue(uri)
                .then(() => {
                    res.status(200).json({ success: true, message: "Added track to queue!", trackInfo });
                })
                .catch(err => {
                    console.error('Error adding track to queue:', err);
                    res.status(500).json({ error: "Failed to add track to queue" });
                });
        })
        .catch(err => {
            console.error('Error fetching track details:', err);
            res.status(500).json({ error: `Error: ${err.message}` });
        });
});

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

//add to liked
app.post('/addToLiked', (req, res) => {
    const trackUri = req.body.uri;

    if (!trackUri) {
        return res.status(400).json({ error: 'Track URI is required' });
    }

    // Log the track URI for debugging
    console.log('Track URI:', trackUri);

    // Extract the track ID from the URI
    const trackIdPattern = /^spotify:track:([a-zA-Z0-9]{22})$/;
    const match = trackUri.match(trackIdPattern);
    if (!match) {
        return res.status(400).json({ error: 'Invalid track URI format' });
    }
    const trackId = match[1];


    spotifyApi.getTrack(trackId)
        .then(trackData => {
            const track = trackData.body;
            const trackInfo = {
                name: track.name,
                artist: track.artists[0].name,
                uri: track.uri,
                cover: track.album.images[0].url,
            };
            spotifyApi.addToMySavedTracks([trackId])
                .then(() => {
                    res.status(200).json({ success: true, message: 'Track added to liked songs', trackInfo });
                })
                .catch(err => {
                    console.error('Error adding track to liked songs:', err);
                    res.status(500).json({ error: `Error: ${err.message}` });
                });
        })
        .catch(err => {
            console.error('Error fetching track details:', err);
            res.status(500).json({ error: `Error: ${err.message}` });
        });
});

//pause track
app.post('/pause', (req, res) => {
    spotifyApi.pause()
        .then(() => {
            res.json({ success: true, message: "Paused playback" });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: "Failed to pause playback" });
        });
});

app.post('/resume', (req, res) => {
    spotifyApi.play()
        .then(() => {
            res.json({ success: true, message: "Resumed playback" });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: "Failed to resume playback" });
        });
});

app.post('/shuffle', (req, res) => {
    const { state } = req.body;

    if (typeof state !== 'boolean') {
        return res.status(400).json({ error: 'Shuffle state must be a boolean' });
    }

    spotifyApi.setShuffle(state)
        .then(() => {
            res.json({ success: true, message: `Shuffle ${state ? 'enabled' : 'disabled'}` });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(500).json({ error: `Failed to ${state ? 'enable' : 'disable'} shuffle` });
        });
});




app.put('/seek', (req, res) => {
    const { position_ms } = req.body;

    if (typeof position_ms !== 'number' || isNaN(position_ms)) {
        return res.status(400).json({ error: 'Position in milliseconds must be a valid number' });
    }

    spotifyApi.seek(position_ms)
        .then(() => {
            res.json({ success: true, message: 'Playback position updated' });
        })
        .catch(err => {
            console.error('Error seeking playback:', err);
            res.status(500).json({ error: `Error: ${err.message}` });
        });
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});