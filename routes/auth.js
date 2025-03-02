const express = require('express');
const router = express.Router();

module.exports = (spotifyApi) => {
    router.get('/login', (req, res) => {
        const scopes = [
            'user-read-private',
            'user-read-email',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-library-modify',
            'user-library-read',
            'user-top-read',
            'streaming',
            'app-remote-control'
        ];
        res.redirect(spotifyApi.createAuthorizeURL(scopes));
    });

    router.get('/callback', (req, res) => {
        const { error, code } = req.query;

        if (error) {
            console.error('Error:', error);
            return res.send(`Error: ${error}`);
        }

        spotifyApi.authorizationCodeGrant(code)
            .then(data => {
                const { access_token, refresh_token, expires_in } = data.body;
                
                spotifyApi.setAccessToken(access_token);
                spotifyApi.setRefreshToken(refresh_token);
                
                console.log('User authenticated successfully');
                res.redirect('/searchPage');

                setupTokenRefresh(spotifyApi, expires_in);
            })
            .catch(error => {
                console.error('Error during authorization');
                res.status(500).send(`Error during authorization: ${error.message}`);
            });
    });

    return router;
};

function setupTokenRefresh(spotifyApi, expiresIn) {
    setInterval(async () => {
        try {
            const data = await spotifyApi.refreshAccessToken();
            spotifyApi.setAccessToken(data.body['access_token']);
            console.log('Token refreshed successfully');
        } catch (err) {
            console.error('Error refreshing access token');
        }
    }, (expiresIn / 2) * 1000);
}
