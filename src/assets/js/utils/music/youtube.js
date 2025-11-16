'use strict';

const usetube = require('../../libs/youtube/usetube');
const ytpl = require('ytpl');
const AnalyticsHelper = require('../analyticsHelper.js');

const infoCache = new Map();

async function searchYouTube(query, maxResults = 12) {
    try {
        const { videos } = (await usetube.searchVideo(query)) ?? {};
        if (!Array.isArray(videos) || videos.length === 0) {
            return [];
        }

        const resultsArray = await Promise.all(videos.slice(0, maxResults).map(async v => {
            const j = await fetch(`https://noembed.com/embed?nowrap=1&url=https://youtu.be/${v.id}`).then(r => r.json());

            const vid = v.id || v.videoId || v?.video?.id;
            const title = j.title || v.title || v?.video?.title || 'Sin título';
            const author = j.author_name || v.author || v?.video?.author || 'Desconocido';
            return {
                id: { videoId: vid },
                snippet: {
                    title,
                    channelTitle: author,
                    thumbnails: {
                        default: {
                            url: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`
                        }
                    }
                }
            };
        }));

        // Track successful search
        AnalyticsHelper.trackMusicSearch(query, resultsArray.length)
            .catch(err => console.error('Error tracking music search:', err));

        return resultsArray;
    } catch (error) {
        console.error('Error en búsqueda de YouTube:');
        console.error(error);

        // Track search error
        AnalyticsHelper.trackError(error, {
            context: 'youtube_search',
            query
        }).catch(err => console.error('Error tracking error:', err));

        return [];
    }
}

async function getVideoInfo(videoId) {
    if (infoCache.has(videoId)) {
        return infoCache.get(videoId);
    }

    try {
        const info = await usetube.getVideoInfo(videoId);
        infoCache.set(videoId, info);
        return info;
    } catch (error) {
        console.error('Error getting video info:');
        console.error(error);
        return null;
    }
}

async function getYouTubePlaylistDetails(playlistUrl) {
    try {
        const playlistData = await ytpl(playlistUrl, { limit: Infinity });
        return {
            title: playlistData.title,
            description: playlistData.description || '',
            thumbnail: playlistData.bestThumbnail?.url || '',
            songs: playlistData.items.map(item => ({
                id: item.id,
                title: item.title,
                artist: item.author?.name || 'Unknown',
                thumbnail: item.bestThumbnail?.url || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
            }))
        };
    } catch (error) {
        console.error('Error getting YouTube playlist details:');
        console.error(error);
        throw error;
    }
}

function clearInfoCache() {
    infoCache.clear();
}

module.exports = {
    searchYouTube,
    getVideoInfo,
    getYouTubePlaylistDetails,
    clearInfoCache,
    infoCache
};

