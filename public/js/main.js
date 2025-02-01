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

    function playbackState() {
        fetch('/playbackState')
            .then(response => response.json())
            .then(data => {
                const playPauseButton = document.getElementById('playPauseButton');
                if (data.isPlaying) {
                    playPauseButton.innerText = '⏸'; // Pause icon
                    playPauseButton.onclick = pausePlayback;
                } else {
                    playPauseButton.innerText = '▶'; // Play icon
                    playPauseButton.onclick = resumePlayback;
                }
                updateProgressBar(data);
            })
            .catch(err => {
                console.error('Error fetching playback state:', err);
                Notify('Error fetching playback state');
            });
    }

    // Fetch the current song and playback state every 500ms
    fetchCurrentSong();
    setInterval(fetchCurrentSong, 500);
    playbackState();
    setInterval(playbackState, 500);
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
                Notify("Playing song: " + data.trackInfo.name);
            } else {
                Notify("Error: " + JSON.stringify(data.error)); // Display the full error details
            }
            updateProgressBar(data);
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
        .catch(err => {
            console.error('Fetch Error:', err); // Log any fetch errors
            Notify("Failed to skip song.");
        });
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
        .catch(err => {
            console.error('Fetch Error:', err); // Log any fetch errors
            Notify("Failed to skip song.");
        });
}

function addToLiked(uri) {
    fetch('/addToLiked', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri })
    }).then(response => response.json())
        .then(data => {
            if (data.success) {
                Notify(`Added ${data.trackInfo.name} to Liked Songs`);
            } else {
                Notify("Error: " + JSON.stringify(data.error)); // Display the full error details
            }
        })
        .catch(err => {
            console.error('Fetch Error:', err); // Log any fetch errors
            Notify("Failed to add song to liked songs.");
        });
}

function togglePlayPause() {
    const playPauseButton = document.getElementById('playPauseButton');
    if (playPauseButton.innerText === '▶') {
        resumePlayback();
    } else {
        pausePlayback();
    }
}

function pausePlayback() {
    fetch('/pause', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const playPauseButton = document.getElementById('playPauseButton');
                playPauseButton.innerText = '▶'; // Play icon
                playPauseButton.onclick = resumePlayback;
                Notify('Playback paused');
            } else {
                Notify('Error: ' + data.error);
            }
        })
        .catch(err => {
            console.error('Error pausing playback:', err);
            Notify('Error pausing playback');
        });
}

function resumePlayback() {
    fetch('/resume', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const playPauseButton = document.getElementById('playPauseButton');
                playPauseButton.innerText = '⏸'; // Pause icon
                playPauseButton.onclick = pausePlayback;
                Notify('Playback resumed');
            } else {
                Notify('Error: ' + data.error);
            }
        })
        .catch(err => {
            console.error('Error resuming playback:', err);
            Notify('Error resuming playback');
        });
}

function fetchPlaybackState() {
    fetch('/playbackState')
        .then(response => response.json())
        .then(data => {
            updateProgressBar(data);
        })
        .catch(err => {
            console.error('Error fetching playback state:', err);
        });
}

function updateProgressBar(data) {
    if (data.track) {
        const progressBar = document.getElementById('progressBar');
        const currentTime = document.getElementById('currentTime');
        const totalTime = document.getElementById('totalTime');
        const duration = data.track.duration_ms;
        const progress = data.progress_ms;
        const percentage = (progress / duration) * 100;
        progressBar.style.width = `${percentage}%`;

        // Update playback time
        currentTime.innerText = formatTime(progress);
        totalTime.innerText = formatTime(duration);
    }
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}


function seek(event) {
    const progressContainer = document.getElementById('progressContainer');
    const width = progressContainer.clientWidth;
    const clickX = event.offsetX;
    const percentage = (clickX / width) * 100;

    fetch('/playbackState')
        .then(response => response.json())
        .then(data => {
            if (data.track) {
                const duration = data.track.duration_ms;
                const seekPosition = Math.round((percentage / 100) * duration); // Ensure seekPosition is a number

                fetch('/seek', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ position_ms: seekPosition })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Notify('Seeked to new position');
                        } else {
                            Notify('Error: ' + data.error);
                        }
                    })
                    .catch(err => {
                        console.error('Error seeking playback:', err);
                        Notify('Error seeking playback');
                    });
            }
        })
        .catch(err => {
            console.error('Error fetching playback state:', err);
        });
}

let isShuffleEnabled = false;

function shuffle() {
    const shuffleState = !isShuffleEnabled; // Toggle the shuffle state

    fetch('/shuffle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: shuffleState })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                isShuffleEnabled = shuffleState; // Update the shuffle state
                Notify(`Shuffle ${isShuffleEnabled ? 'enabled' : 'disabled'}`);
            } else {
                Notify('Error: ' + data.error);
            }
        })
        .catch(err => {
            console.error('Error shuffling playback:', err);
            Notify('Error shuffling playback');
        });
}