const AnalyticsHelper = require('./analyticsHelper.js');

class AnalyticsController {
    constructor() {
        this.streamingActive = false;
        console.log('[AnalyticsController] Initialized');
    }

    enableStreaming() {
        if (this.streamingActive) {
            console.log('[AnalyticsController] Streaming already active');
            return;
        }

        console.log('[AnalyticsController] Enabling streaming...');
        AnalyticsHelper.enableStreaming();
        this.streamingActive = true;

        const bufferSize = AnalyticsHelper.getBufferSize();
        console.log(`[AnalyticsController] Buffer size: ${bufferSize}`);

        return {
            success: true,
            message: 'Streaming enabled',
            bufferFlushed: bufferSize
        };
    }

    disableStreaming() {
        if (!this.streamingActive) {
            console.log('[AnalyticsController] Streaming already disabled');
            return;
        }

        console.log('[AnalyticsController] Disabling streaming...');
        AnalyticsHelper.disableStreaming();
        this.streamingActive = false;

        return {
            success: true,
            message: 'Streaming disabled'
        };
    }

    isStreaming() {
        return this.streamingActive;
    }

    getBufferStats() {
        return {
            size: AnalyticsHelper.getBufferSize(),
            maxSize: AnalyticsHelper.maxBufferSize,
            isStreaming: this.streamingActive
        };
    }

    async flushBuffer() {
        console.log('[AnalyticsController] Flushing buffer...');
        return await AnalyticsHelper.flushBuffer();
    }
}

const controller = new AnalyticsController();

if (typeof window !== 'undefined') {
    window.AnalyticsController = controller;
}

module.exports = controller;
