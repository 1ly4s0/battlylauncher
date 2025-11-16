'use strict';

class MusicAIEngine {
    constructor() {
        this.userProfile = null;
        this.listeningPatterns = new Map();
        this.songEmbeddings = new Map();
        this.sessionContext = [];
        this.MAX_HISTORY = 1000;
    }

    async initializeUserProfile(listeningHistory, likedSongs) {
        console.log('🤖 Inicializando perfil de usuario para IA...');

        this.userProfile = {
            totalPlays: listeningHistory.length,
            uniqueSongs: new Set(listeningHistory.map(h => h.id)).size,
            likedCount: likedSongs.size,
            averageSessionLength: this._calculateAverageSession(listeningHistory),
            temporalPreferences: this._analyzeTemporalPatterns(listeningHistory),
            diversityScore: this._calculateDiversity(listeningHistory),
            lastUpdated: Date.now()
        };

        this._buildSongEmbeddings(listeningHistory);

        console.log('✅ Perfil de usuario inicializado:', this.userProfile);
    }

    async getAIRecommendations(options = {}) {
        const {
            count = 50,
            excludeIds = new Set(),
            contextSongs = [],

            diversityWeight = 0.3,

            explorationRate = 0.2

        } = options;

        console.log('🧠 Generando recomendaciones con IA...');

        const candidates = new Map();

        const similarityRecs = this._getCollaborativeRecommendations(
            contextSongs,
            excludeIds,
            count * 2
        );
        similarityRecs.forEach(([id, score]) => {
            candidates.set(id, (candidates.get(id) || 0) + score * 0.4);
        });

        const sequenceRecs = this._getSequenceBasedRecommendations(
            contextSongs,
            excludeIds,
            count
        );
        sequenceRecs.forEach(([id, score]) => {
            candidates.set(id, (candidates.get(id) || 0) + score * 0.3);
        });

        const temporalRecs = this._getTemporalRecommendations(
            excludeIds,
            count
        );
        temporalRecs.forEach(([id, score]) => {
            candidates.set(id, (candidates.get(id) || 0) + score * 0.2);
        });

        if (Math.random() < explorationRate) {
            const explorationRecs = this._getExplorationRecommendations(
                excludeIds,
                Math.floor(count * explorationRate)
            );
            explorationRecs.forEach(([id, score]) => {
                candidates.set(id, (candidates.get(id) || 0) + score * 0.1);
            });
        }

        const diversified = this._applyDiversityBoost(candidates, diversityWeight);

        const sorted = Array.from(diversified.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([id]) => id);

        console.log(`✅ ${sorted.length} recomendaciones generadas`);
        return sorted;
    }

    _getCollaborativeRecommendations(contextSongs, excludeIds, limit) {
        const recommendations = new Map();

        contextSongs.slice(-10).forEach(songId => {
            const embedding = this.songEmbeddings.get(songId);
            if (!embedding) return;

            this.songEmbeddings.forEach((otherEmbedding, otherId) => {
                if (otherId === songId || excludeIds.has(otherId)) return;

                const similarity = this._cosineSimilarity(embedding, otherEmbedding);
                if (similarity > 0.1) {

                    recommendations.set(
                        otherId,
                        (recommendations.get(otherId) || 0) + similarity
                    );
                }
            });
        });

        return Array.from(recommendations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    }

    _getSequenceBasedRecommendations(contextSongs, excludeIds, limit) {
        if (contextSongs.length === 0) return [];

        const lastSongs = contextSongs.slice(-3);

        const nextSongCounts = new Map();

        this.listeningPatterns.forEach((pattern, songId) => {
            if (!pattern.nextSongs) return;

            lastSongs.forEach(lastSong => {
                if (pattern.previousSongs && pattern.previousSongs.has(lastSong)) {
                    pattern.nextSongs.forEach((count, nextId) => {
                        if (!excludeIds.has(nextId)) {
                            nextSongCounts.set(nextId, (nextSongCounts.get(nextId) || 0) + count);
                        }
                    });
                }
            });
        });

        return Array.from(nextSongCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    }

    _getTemporalRecommendations(excludeIds, limit) {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        const recommendations = new Map();

        this.listeningPatterns.forEach((pattern, songId) => {
            if (excludeIds.has(songId)) return;

            let score = 0;

            if (pattern.hourPreferences) {
                const hourScore = pattern.hourPreferences.get(hour) || 0;
                score += hourScore;
            }

            if (pattern.dayPreferences) {
                const dayScore = pattern.dayPreferences.get(dayOfWeek) || 0;
                score += dayScore * 0.5;
            }

            if (score > 0) {
                recommendations.set(songId, score);
            }
        });

        return Array.from(recommendations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    }

    _getExplorationRecommendations(excludeIds, limit) {
        const candidates = [];

        this.songEmbeddings.forEach((embedding, songId) => {
            if (excludeIds.has(songId)) return;

            const pattern = this.listeningPatterns.get(songId);
            const playCount = pattern?.playCount || 0;

            const embeddingStrength = Math.sqrt(
                embedding.reduce((sum, val) => sum + val * val, 0)
            );

            const explorationScore = embeddingStrength / (Math.log(playCount + 2));
            candidates.push([songId, explorationScore]);
        });

        return candidates
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
    }

    _applyDiversityBoost(candidates, diversityWeight) {
        if (diversityWeight === 0) return candidates;

        const boosted = new Map();
        const selectedEmbeddings = [];

        const sorted = Array.from(candidates.entries()).sort((a, b) => b[1] - a[1]);

        sorted.forEach(([songId, score]) => {
            const embedding = this.songEmbeddings.get(songId);
            if (!embedding) {
                boosted.set(songId, score);
                return;
            }

            let diversityPenalty = 0;
            selectedEmbeddings.forEach(selectedEmb => {
                const similarity = this._cosineSimilarity(embedding, selectedEmb);
                diversityPenalty += similarity;
            });

            const diversifiedScore = score * (1 - diversityPenalty * diversityWeight);
            boosted.set(songId, diversifiedScore);

            selectedEmbeddings.push(embedding);
        });

        return boosted;
    }

    _buildSongEmbeddings(listeningHistory) {
        console.log('📊 Construyendo embeddings de canciones...');

        const coOccurrence = new Map();

        const windowSize = 10;

        for (let i = 0; i < listeningHistory.length; i++) {
            const currentSong = listeningHistory[i].id;

            if (!coOccurrence.has(currentSong)) {
                coOccurrence.set(currentSong, new Map());
            }

            const start = Math.max(0, i - windowSize);
            const end = Math.min(listeningHistory.length, i + windowSize + 1);

            for (let j = start; j < end; j++) {
                if (i === j) continue;
                const contextSong = listeningHistory[j].id;
                const currentMap = coOccurrence.get(currentSong);
                currentMap.set(contextSong, (currentMap.get(contextSong) || 0) + 1);
            }
        }

        const allSongIds = Array.from(coOccurrence.keys());
        const embeddingDim = Math.min(100, allSongIds.length);

        allSongIds.forEach(songId => {
            const coOccurMap = coOccurrence.get(songId);
            const embedding = new Array(embeddingDim).fill(0);

            const topCoOccur = Array.from(coOccurMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, embeddingDim);

            topCoOccur.forEach(([otherId, count], idx) => {
                embedding[idx] = Math.log(count + 1);

            });

            this.songEmbeddings.set(songId, embedding);
        });

        this._buildSequencePatterns(listeningHistory);

        console.log(`✅ ${this.songEmbeddings.size} embeddings creados`);
    }

    _buildSequencePatterns(listeningHistory) {
        listeningHistory.forEach((entry, idx) => {
            const songId = entry.id;

            if (!this.listeningPatterns.has(songId)) {
                this.listeningPatterns.set(songId, {
                    playCount: 0,
                    nextSongs: new Map(),
                    previousSongs: new Map(),
                    hourPreferences: new Map(),
                    dayPreferences: new Map()
                });
            }

            const pattern = this.listeningPatterns.get(songId);
            pattern.playCount++;

            const timestamp = entry.timestamp || Date.now();
            const date = new Date(timestamp);
            const hour = date.getHours();
            const day = date.getDay();

            pattern.hourPreferences.set(hour, (pattern.hourPreferences.get(hour) || 0) + 1);
            pattern.dayPreferences.set(day, (pattern.dayPreferences.get(day) || 0) + 1);

            if (idx < listeningHistory.length - 1) {
                const nextId = listeningHistory[idx + 1].id;
                pattern.nextSongs.set(nextId, (pattern.nextSongs.get(nextId) || 0) + 1);
            }

            if (idx > 0) {
                const prevId = listeningHistory[idx - 1].id;
                pattern.previousSongs.set(prevId, (pattern.previousSongs.get(prevId) || 0) + 1);
            }
        });
    }

    _cosineSimilarity(vec1, vec2) {
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

    _analyzeTemporalPatterns(history) {
        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Array(7).fill(0);

        history.forEach(entry => {
            const date = new Date(entry.timestamp || Date.now());
            hourCounts[date.getHours()]++;
            dayCounts[date.getDay()]++;
        });

        return {
            mostActiveHour: hourCounts.indexOf(Math.max(...hourCounts)),
            mostActiveDay: dayCounts.indexOf(Math.max(...dayCounts)),
            hourDistribution: hourCounts,
            dayDistribution: dayCounts
        };
    }

    _calculateAverageSession(history) {
        if (history.length === 0) return 0;

        const sessions = [];
        let currentSession = [];
        const SESSION_GAP = 30 * 60 * 1000;

        history.forEach((entry, idx) => {
            if (idx === 0) {
                currentSession.push(entry);
                return;
            }

            const prevTimestamp = history[idx - 1].timestamp || Date.now();
            const currentTimestamp = entry.timestamp || Date.now();

            if (currentTimestamp - prevTimestamp > SESSION_GAP) {
                sessions.push(currentSession);
                currentSession = [entry];
            } else {
                currentSession.push(entry);
            }
        });

        if (currentSession.length > 0) sessions.push(currentSession);

        const avgLength = sessions.reduce((sum, s) => sum + s.length, 0) / sessions.length;
        return Math.round(avgLength);
    }

    _calculateDiversity(history) {
        const songCounts = new Map();
        history.forEach(entry => {
            songCounts.set(entry.id, (songCounts.get(entry.id) || 0) + 1);
        });

        let entropy = 0;
        const total = history.length;

        songCounts.forEach(count => {
            const probability = count / total;
            entropy -= probability * Math.log2(probability);
        });

        const maxEntropy = Math.log2(songCounts.size);
        return maxEntropy === 0 ? 0 : entropy / maxEntropy;
    }

    updateSessionContext(songId) {
        this.sessionContext.push({
            id: songId,
            timestamp: Date.now()
        });

        if (this.sessionContext.length > 50) {
            this.sessionContext.shift();
        }
    }

    getStats() {
        return {
            embeddingsCount: this.songEmbeddings.size,
            patternsCount: this.listeningPatterns.size,
            sessionLength: this.sessionContext.length,
            userProfile: this.userProfile
        };
    }
}

let aiEngineInstance = null;

function getMusicAI() {
    if (!aiEngineInstance) {
        aiEngineInstance = new MusicAIEngine();
    }
    return aiEngineInstance;
}

module.exports = {
    MusicAIEngine,
    getMusicAI
};

