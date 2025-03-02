require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
});

// Routes
app.use('/', require('./routes/auth')(spotifyApi));
app.use('/', require('./routes/player')(spotifyApi));
app.use('/', require('./routes/stats')(spotifyApi));

// View routes
app.get('/', (req, res) => res.render('index'));
app.get('/searchPage', (req, res) => res.render('homePage'));
app.get('/stats', (req, res) => res.render('stats'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
