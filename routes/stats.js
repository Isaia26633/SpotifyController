const express = require('express');
const router = express.Router();

module.exports = (spotifyApi) => {
    router.get('/topTracks', async (req, res) => {
        const timeRange = req.query.time_range || 'long_term';
        
        try {
            const data = await spotifyApi.getMyTopTracks({ 
                time_range: timeRange, 
                limit: 10 
            });
            res.json(data.body.items);
        } catch (err) {
            console.error('Error fetching top tracks:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.get('/topArtists', async (req, res) => {
        const timeRange = req.query.time_range || 'long_term';
        
        try {
            const data = await spotifyApi.getMyTopArtists({ 
                time_range: timeRange, 
                limit: 10 
            });
            res.json(data.body.items);
        } catch (err) {
            console.error('Error fetching top artists:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};