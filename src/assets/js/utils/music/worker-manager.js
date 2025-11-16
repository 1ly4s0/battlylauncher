'use strict';

class MusicWorkerManager {
    constructor() {
        this.worker = null;
        this.taskId = 0;
        this.pendingTasks = new Map();
        this.isReady = false;
    }

    async initialize() {
        if (this.worker) {
            console.warn('Worker ya inicializado');
            return;
        }

        return new Promise((resolve, reject) => {
            try {

                const workerPath = './music-worker.js';
                this.worker = new Worker(workerPath);

                this.worker.addEventListener('message', (event) => {
                    this._handleWorkerMessage(event.data);
                });

                this.worker.addEventListener('error', (error) => {
                    console.error('Worker error:', error);
                    this._handleWorkerError(error);
                });

                const readyTimeout = setTimeout(() => {
                    reject(new Error('Worker timeout'));
                }, 5000);

                const readyHandler = (event) => {
                    if (event.data.type === 'ready') {
                        clearTimeout(readyTimeout);
                        this.isReady = true;
                        console.log('✅ Music Worker inicializado');
                        this.worker.removeEventListener('message', readyHandler);
                        resolve();
                    }
                };

                this.worker.addEventListener('message', readyHandler);
            } catch (error) {
                console.error('Error inicializando worker:', error);
                reject(error);
            }
        });
    }

    _handleWorkerMessage(data) {
        const { type, taskId, ...payload } = data;

        if (type === 'ready') {
            this.isReady = true;
            return;
        }

        if (taskId && this.pendingTasks.has(taskId)) {
            const { resolve, reject } = this.pendingTasks.get(taskId);
            this.pendingTasks.delete(taskId);

            if (type === 'error') {
                reject(new Error(payload.error));
            } else {
                resolve(payload);
            }
        }
    }

    _handleWorkerError(error) {
        console.error('Worker error:', error);

        this.pendingTasks.forEach(({ reject }) => {
            reject(new Error('Worker error: ' + error.message));
        });
        this.pendingTasks.clear();
    }

    _sendTask(type, data) {
        if (!this.isReady) {
            return Promise.reject(new Error('Worker no está listo'));
        }

        return new Promise((resolve, reject) => {
            const taskId = ++this.taskId;

            this.pendingTasks.set(taskId, { resolve, reject });

            setTimeout(() => {
                if (this.pendingTasks.has(taskId)) {
                    this.pendingTasks.delete(taskId);
                    reject(new Error('Task timeout'));
                }
            }, 30000);

            this.worker.postMessage({ type, data, id: taskId });
        });
    }

    async buildEmbeddings(history) {
        try {
            const result = await this._sendTask('build-embeddings', { history });
            console.log(`🧠 ${result.count} embeddings construidos`);
            return result.count;
        } catch (error) {
            console.error('Error construyendo embeddings:', error);
            return 0;
        }
    }

    async getRecommendations(options = {}) {
        try {
            const result = await this._sendTask('get-recommendations', options);
            return result.recommendations || [];
        } catch (error) {
            console.error('Error obteniendo recomendaciones:', error);
            return [];
        }
    }

    async analyzePatterns(history) {
        try {
            const result = await this._sendTask('analyze-patterns', { history });
            return result.patterns || null;
        } catch (error) {
            console.error('Error analizando patrones:', error);
            return null;
        }
    }

    async getSimilarSongs(songId, limit = 10) {
        try {
            const result = await this._sendTask('similar-songs', { songId, limit });
            return result.similar || [];
        } catch (error) {
            console.error('Error obteniendo canciones similares:', error);
            return [];
        }
    }

    async batchProcessMetadata(ids) {
        try {
            const result = await this._sendTask('batch-metadata', { ids });
            return result.metadata || [];
        } catch (error) {
            console.error('Error procesando metadatos:', error);
            return [];
        }
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
            this.pendingTasks.clear();
            console.log('🛑 Worker terminado');
        }
    }

    isAvailable() {
        return this.isReady && this.worker !== null;
    }

    getStats() {
        return {
            isReady: this.isReady,
            pendingTasks: this.pendingTasks.size,
            taskId: this.taskId
        };
    }
}

let workerManagerInstance = null;

function getWorkerManager() {
    if (!workerManagerInstance) {
        workerManagerInstance = new MusicWorkerManager();
    }
    return workerManagerInstance;
}

async function initializeWorker() {
    const manager = getWorkerManager();
    if (!manager.isAvailable()) {
        try {
            await manager.initialize();
            return true;
        } catch (error) {
            console.error('No se pudo inicializar el worker:', error);
            return false;
        }
    }
    return true;
}

module.exports = {
    MusicWorkerManager,
    getWorkerManager,
    initializeWorker
};

