document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('submitButton').addEventListener('click', fetchStats);
});

function fetchStats() {
    const timeRange = document.getElementById('timeRange').value;

    fetch(`/topTracks?time_range=${timeRange}`)
        .then(response => response.json())
        .then(data => {
            const topTracksDiv = document.getElementById('topTracks');
            topTracksDiv.innerHTML = data.map(track => `
                <div class="stat-item">
                    <h3>${track.name}</h3>
                    <p>Artist: ${track.artists.map(artist => artist.name).join(', ')}</p>
                    <img src="${track.album.images[0].url}" alt="Album Cover" width="100">
                </div>
            `).join('');
        })
        .catch(err => {
            console.error('Error fetching top tracks:', err);
        });

    fetch(`/topArtists?time_range=${timeRange}`)
        .then(response => response.json())
        .then(data => {
            const topArtistsDiv = document.getElementById('topArtists');
            topArtistsDiv.innerHTML = data.map(artist => `
                <div class="stat-item">
                    <h3>${artist.name}</h3>
                    <img src="${artist.images[0].url}" alt="Artist Image" width="100">
                </div>
            `).join('');
        })
        .catch(err => {
            console.error('Error fetching top artists:', err);
        });
}