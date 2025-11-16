'use strict';

const { getMusicAPIURL } = require('./config');

const { getMusicCache } = require('./cache');

function getAPIBaseURL() {
    return getMusicAPIURL();
}

async function fetchLikedSongs(database) {
    try {
        const token = await database.getSelectedAccountToken();
        const response = await fetch(`${getAPIBaseURL()}/api/user/likes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener canciones favoritas: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido al obtener canciones favoritas');
        }

        const likedSongIds = data.songs || [];
        const cache = getMusicCache();

        const enriched = await Promise.all(
            likedSongIds.map(async (songId) => {
                const id = typeof songId === 'string' ? songId : songId.id;
                const metadata = await cache.getSongMetadata(id);
                return {
                    id,
                    ...metadata
                };
            })
        );

        return enriched;
    } catch (error) {
        console.error('Error al obtener canciones favoritas:', error);
        return [];
    }
}

async function toggleLikeSong(database, videoId) {
    try {
        const token = await database.getSelectedAccountToken();

        const checkResponse = await fetch(`${getAPIBaseURL()}/api/user/likes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const checkData = await checkResponse.json();
        const exists = checkData.songs?.some(s => s.id === videoId);

        const response = await fetch(`${getAPIBaseURL()}/api/user/likes/${videoId}`, {
            method: exists ? 'DELETE' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }

        });

        if (!response.ok) {
            throw new Error(`Error al cambiar estado de favorito: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }

        return data;
    } catch (error) {
        console.error('Error al cambiar estado de favorito:', error);
        throw error;
    }
}

async function createPlaylist(database, name, description, cover = '', songs = []) {
    try {
        const token = await database.getSelectedAccountToken();

        if (!Array.isArray(songs)) {
            songs = [];
        }

        const songIds = songs.map(s => typeof s === 'string' ? s : s.id);

        const response = await fetch(`${getAPIBaseURL()}/api/user/playlist/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                description: description || '',
                cover: cover || '',
                songs: songIds

            })
        });

        if (!response.ok) {
            throw new Error(`Error al crear playlist: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido al crear playlist');
        }

        return data.playlist;
    } catch (error) {
        console.error('Error al crear playlist:', error);
        throw error;
    }
}

async function updatePlaylistSongs(database, playlistId, songs) {
    try {
        const token = await database.getSelectedAccountToken();

        if (!Array.isArray(songs)) {
            songs = [];
        }

        const songIds = songs.map(s => typeof s === 'string' ? s : s.id);

        const response = await fetch(`${getAPIBaseURL()}/api/user/playlist/${playlistId}/songs`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                songs: songIds

            })
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar canciones: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido al actualizar canciones');
        }

        return data.playlist;
    } catch (error) {
        console.error('Error al actualizar canciones:', error);
        throw error;
    }
}

async function getPlaylist(database, playlistId) {
    try {
        const token = await database.getSelectedAccountToken();
        const response = await fetch(`${getAPIBaseURL()}/api/user/playlist/${playlistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al obtener playlist: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido al obtener playlist');
        }

        return data.playlist;
    } catch (error) {
        console.error('Error al obtener playlist:', error);
        throw error;
    }
}

async function loadPlaylists(database) {
    try {
        const token = await database.getSelectedAccountToken();
        const response = await fetch(`${getAPIBaseURL()}/api/user/playlists`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error al cargar playlists: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error desconocido al cargar playlists');
        }

        return data.playlists;
    } catch (error) {
        console.error('Error al cargar playlists:', error);
        return [];
    }
}

module.exports = {
    fetchLikedSongs,
    toggleLikeSong,
    createPlaylist,
    updatePlaylistSongs,
    getPlaylist,
    loadPlaylists,
    getAPIBaseURL

};

