document.addEventListener('DOMContentLoaded', () => {
    let currentUri = null;

    function fetchCurrentSong() {
        fetch('/currentSong')
            .then(response => response.json())
            .then(data => {
                const currentSongDiv = document.getElementById('currentSong');
                if (data.uri !== currentUri) {
                    currentUri = data.uri;
                    if (data.name) {
                        currentSongDiv.innerHTML = `
                                <h3>Currently Playing</h3>
                                <p>${data.name}</p>
                                <p>By ${data.artist}</p>
                                <img src="${data.cover}" alt="Album Cover" width="200">
                            `;
                    } else {
                        currentSongDiv.innerHTML = "<p>No song currently playing</p>";
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching current song:', err);
                document.getElementById('currentSong').innerHTML = "An error occurred while fetching the current song.";
            });

    }
    fetchCurrentSong();
    setInterval(fetchCurrentSong, 500);
});

let notificationTimeout;

function Notify(message) {
    let notification = document.getElementById("notification");
    document.getElementById("notification-text").textContent = message;

    notification.style.display = "block";
    setTimeout(() => notification.style.opacity = "1", 100);

    notificationTimeout = setTimeout(closeNotification, 5000);
}

function closeNotification() {
    let notification = document.getElementById("notification");
    clearTimeout(notificationTimeout);

    notification.style.opacity = "0";
    setTimeout(() => notification.style.display = "none", 500);
}


function search(event) {
    event.preventDefault(); // Stop page reload

    const query = document.getElementById('searchBar').value;
    if (!query) return Notify("Please enter a song name.");

    fetch(`/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('searchResults');

            if (data.error) {
                resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                resultsDiv.innerHTML = `
                <h3>${data.name}</h3>
                <p>Artist: ${data.artist}</p>
                <img src="${data.cover}" alt="Album Cover" width="200"><br>
                <button onclick="playSong('${data.uri}')" class='playback'>▶</button>
                <br>
                <button onclick="addToQueue('${data.uri}')" class='searchButton'>➕ Add to Queue</button>
                <br>
                <br>
                <button onclick="addToLiked('${data.uri}')" class='searchButton'>❤ Add to Liked Songs</button>
            `;
            }
        })
        .catch(err => {
            console.error('Fetch Error:', err); // Log any fetch errors
            document.getElementById('searchResults').innerHTML = "An error occurred while searching.";
        });
}
function playSong(uri) {
    fetch(`/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // window.location.reload();
            } else {
                Notify("Error: " + JSON.stringify(data.error)); // Display the full error details
            }
        })
        .catch(err => {
            console.error('Fetch Error:', err); // Log any fetch errors
            Notify("Failed to play song.");
        });
}
function addToQueue(uri) {
    fetch('/queue', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Notify(`Added to queue: ${data.trackInfo.name}`);
            } else {
                Notify("Error: " + JSON.stringify(data.error)); // Display the full error details
            }
        })
        .catch(err => {
            console.error('Fetch Error:', err); // Log any fetch errors
            Notify("Failed to add song to queue.");
        });
}
function skipSong(uri) {
    fetch('/next', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri })
    }).then(response => response.json())
        .then(data => {
            if (data.success) {
                Notify("Skipped to next song");
            } else {
                Notify("Error: " + JSON.stringify(data.error)); // Display the full error details
            }
        })
}
function previousSong(uri) {
    fetch('/previous', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri })
    }).then(response => response.json())
        .then(data => {
            if (data.success) {
                Notify("Skipped to previous song");
            } else {
                Notify("Error: " + JSON.stringify(data.error)); // Display the full error details
            }
        })

}
function addToLiked(uri) {
    fetch('/addToLiked', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri })
    }).then(response => response.json())
        .then(data => {
            if (data.success) {
                Notify(`Added ${data.trackInfo.name}to Liked Songs`);
            } else {
                Notify("Error: " + JSON.stringify(data.error)); // Display the full error details
            }
        })
    console.log(uri)
    
}