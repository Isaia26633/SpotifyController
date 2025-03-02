const express = require('express');
const router = express.Router();

module.exports = (spotifyApi) => {
    router.get('/search', async (req, res) => {
        const { q } = req.query;

        if (!spotifyApi.getAccessToken()) {
            return res.status(401).send('Unauthorized: Access token missing or invalid');
        }

        try {
            const searchData = await spotifyApi.searchTracks(q);
            if (searchData.body.tracks.items.length > 0) {
                const track = searchData.body.tracks.items[0];
                res.json({
                    name: track.name,
                    artist: track.artists[0].name,
                    uri: track.uri,
                    cover: track.album.images[0].url,
                });
            } else {
                res.status(404).json({ error: 'No tracks found' });
            }
        } catch (err) {
            console.error('Error searching tracks:', err);
            res.status(500).send(`Error: ${err.message}`);
        }
    });

    router.get('/currentSong', async (req, res) => {
        try {
            const data = await spotifyApi.getMyCurrentPlayingTrack();
            if (data.body.item) {
                const track = data.body.item;
                res.json({
                    name: track.name,
                    artist: track.artists[0].name,
                    uri: track.uri,
                    cover: track.album.images[0].url,
                });
            } else {
                res.status(404).json({ error: 'No tracks found' });
            }
        } catch (err) {
            console.error('Error getting current track:', err);
            res.status(500).send(`Error: ${err.message}`);
        }
    });

    router.get('/playbackState', async (req, res) => {
        try {
            const data = await spotifyApi.getMyCurrentPlaybackState();
            
            if (!data.body) {
                return res.json({
                    isPlaying: false,
                    track: null,
                    progress_ms: 0
                });
            }

            res.json({
                isPlaying: data.body.is_playing,
                track: data.body.item,
                progress_ms: data.body.progress_ms,
                device: {
                    id: data.body.device.id,
                    name: data.body.device.name,
                    type: data.body.device.type
                }
            });
        } catch (err) {
            console.error('Error fetching playback state:', err);
            res.status(500).json({ 
                error: 'Failed to fetch playback state',
                isPlaying: false,
                track: null,
                progress_ms: 0
            });
        }
    });

    // Play/Pause endpoints
    router.post('/pause', async (req, res) => {
        try {
            await spotifyApi.pause();
            res.json({ success: true });
        } catch (err) {
            console.error('Error pausing playback:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/resume', async (req, res) => {
        try {
            await spotifyApi.play();
            res.json({ success: true });
        } catch (err) {
            console.error('Error resuming playback:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Seek endpoint
    router.put('/seek', async (req, res) => {
        try {
            const { position_ms } = req.body;
            await spotifyApi.seek(position_ms);
            res.json({ success: true });
        } catch (err) {
            console.error('Error seeking position:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Play specific track
    router.post('/play', async (req, res) => {
        try {
            const { uri } = req.body;
            await spotifyApi.play({ uris: [uri] });
            const trackInfo = await spotifyApi.getTrack(uri.split(':')[2]);
            res.json({ 
                success: true, 
                trackInfo: {
                    name: trackInfo.body.name,
                    artist: trackInfo.body.artists[0].name
                }
            });
        } catch (err) {
            console.error('Error playing track:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Skip to next/previous
    router.post('/next', async (req, res) => {
        try {
            await spotifyApi.skipToNext();
            res.json({ success: true });
        } catch (err) {
            console.error('Error skipping to next:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    router.post('/previous', async (req, res) => {
        try {
            await spotifyApi.skipToPrevious();
            res.json({ success: true });
        } catch (err) {
            console.error('Error skipping to previous:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Shuffle control
    router.post('/shuffle', async (req, res) => {
        try {
            const { state } = req.body;
            await spotifyApi.setShuffle(state);
            res.json({ success: true });
        } catch (err) {
            console.error('Error setting shuffle:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
