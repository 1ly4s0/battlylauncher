'use strict';

let aiEngine = null;
let musicCache = null;
let processingQueue = [];
let isProcessing = false;

class WorkerAIEngine {
    constructor() {
        this.embeddings = new Map();
        this.patterns = new Map();
    }

    buildEmbeddings(history) {
        const coOccurrence = new Map();
        const windowSize = 10;

        for (let i = 0; i < history.length; i++) {
            const currentSong = history[i].id;

            if (!coOccurrence.has(currentSong)) {
                coOccurrence.set(currentSong, new Map());
            }

            const start = Math.max(0, i - windowSize);
            const end = Math.min(history.length, i + windowSize + 1);

            for (let j = start; j < end; j++) {
                if (i === j) continue;
                const contextSong = history[j].id;
                const currentMap = coOccurrence.get(currentSong);
                currentMap.set(contextSong, (currentMap.get(contextSong) || 0) + 1);
            }
        }

        const allSongIds = Array.from(coOccurrence.keys());
        const embeddingDim = Math.min(50, allSongIds.length);

        allSongIds.forEach(songId => {
            const coOccurMap = coOccurrence.get(songId);
            const embedding = new Array(embeddingDim).fill(0);

            const topCoOccur = Array.from(coOccurMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, embeddingDim);

            topCoOccur.forEach(([otherId, count], idx) => {
                embedding[idx] = Math.log(count + 1);
            });

            this.embeddings.set(songId, embedding);
        });

        return this.embeddings.size;
    }

    calculateSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    getSimilarSongs(songId, limit = 10) {
        const embedding = this.embeddings.get(songId);
        if (!embedding) return [];

        const similarities = [];

        this.embeddings.forEach((otherEmbedding, otherId) => {
            if (otherId === songId) return;
            const similarity = this.calculateSimilarity(embedding, otherEmbedding);
            if (similarity > 0.1) {
                similarities.push({ id: otherId, similarity });
            }
        });

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }
}

async function processQueue() {
    if (isProcessing || processingQueue.length === 0) return;

    isProcessing = true;

    while (processingQueue.length > 0) {
        const task = processingQueue.shift();

        try {
            await processTask(task);
        } catch (error) {
            self.postMessage({
                type: 'error',
                taskId: task.id,
                error: error.message
            });
        }
    }

    isProcessing = false;
}

async function processTask(task) {
    const { type, data, id } = task;

    switch (type) {
        case 'init-ai':
            await initializeAI(data);
            self.postMessage({ type: 'ai-initialized', taskId: id });
            break;

        case 'build-embeddings':
            const embeddingCount = await buildEmbeddings(data.history);
            self.postMessage({
                type: 'embeddings-ready',
                taskId: id,
                count: embeddingCount
            });
            break;

        case 'get-recommendations':
            const recommendations = await getRecommendations(data);
            self.postMessage({
                type: 'recommendations-ready',
                taskId: id,
                recommendations
            });
            break;

        case 'analyze-patterns':
            const patterns = await analyzeListeningPatterns(data.history);
            self.postMessage({
                type: 'patterns-ready',
                taskId: id,
                patterns
            });
            break;

        case 'similar-songs':
            const similar = await getSimilarSongs(data.songId, data.limit);
            self.postMessage({
                type: 'similar-songs-ready',
                taskId: id,
                similar
            });
            break;

        case 'batch-metadata':
            const metadata = await batchProcessMetadata(data.ids);
            self.postMessage({
                type: 'metadata-ready',
                taskId: id,
                metadata
            });
            break;

        default:
            throw new Error(`Unknown task type: ${type}`);
    }
}

async function initializeAI(data) {
    aiEngine = new WorkerAIEngine();
    console.log('🤖 AI Engine inicializado en worker');
}

async function buildEmbeddings(history) {
    if (!aiEngine) {
        aiEngine = new WorkerAIEngine();
    }

    return aiEngine.buildEmbeddings(history);
}

async function getRecommendations(data) {
    if (!aiEngine || aiEngine.embeddings.size === 0) {
        return [];
    }

    const { contextSongs = [], excludeIds = [], limit = 20 } = data;
    const recommendations = new Map();

    contextSongs.slice(-5).forEach(songId => {
        const similar = aiEngine.getSimilarSongs(songId, limit * 2);
        similar.forEach(({ id, similarity }) => {
            if (!excludeIds.includes(id)) {
                recommendations.set(id, (recommendations.get(id) || 0) + similarity);
            }
        });
    });

    return Array.from(recommendations.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);
}

async function analyzeListeningPatterns(history) {
    const hourCounts = new Array(24).fill(0);
    const dayCounts = new Array(7).fill(0);
    const songCounts = new Map();

    history.forEach(entry => {
        const date = new Date(entry.timestamp || Date.now());
        hourCounts[date.getHours()]++;
        dayCounts[date.getDay()]++;
        songCounts.set(entry.id, (songCounts.get(entry.id) || 0) + 1);
    });

    const topSongs = Array.from(songCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, count]) => ({ id, count }));

    let entropy = 0;
    const total = history.length;
    songCounts.forEach(count => {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
    });
    const maxEntropy = Math.log2(songCounts.size);
    const diversity = maxEntropy === 0 ? 0 : entropy / maxEntropy;

    return {
        mostActiveHour: hourCounts.indexOf(Math.max(...hourCounts)),
        mostActiveDay: dayCounts.indexOf(Math.max(...dayCounts)),
        hourDistribution: hourCounts,
        dayDistribution: dayCounts,
        topSongs,
        diversity,
        uniqueSongs: songCounts.size,
        totalPlays: history.length
    };
}

async function getSimilarSongs(songId, limit) {
    if (!aiEngine) return [];
    return aiEngine.getSimilarSongs(songId, limit);
}

async function batchProcessMetadata(ids) {

    const results = [];

    for (const id of ids) {
        results.push({
            id,
            thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            processed: true
        });

        await new Promise(resolve => setTimeout(resolve, 10));
    }

    return results;
}

self.addEventListener('message', (event) => {
    const { type, data, id } = event.data;

    processingQueue.push({ type, data, id });

    processQueue();
});

self.addEventListener('error', (event) => {
    console.error('Worker error:', event.message);
    self.postMessage({
        type: 'error',
        error: event.message
    });
});

self.postMessage({ type: 'ready' });

