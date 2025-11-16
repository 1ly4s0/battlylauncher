const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ErrorReporter {
    constructor() {
        this.modal = null;
        this.screenshot = null;
        this.maxCommentLength = 1000;
        this.isOpen = false;
    }

    async captureScreen() {
        try {
            console.log('[ErrorReporter] Solicitando captura vía IPC...');

            const screenshot = await ipcRenderer.invoke('capture-window-screenshot');

            if (screenshot && screenshot.startsWith('data:image/')) {
                console.log('[ErrorReporter] Screenshot recibido correctamente');
                return screenshot;
            } else {
                console.warn('[ErrorReporter] Screenshot inválido o null, usando placeholder');
                return this.createPlaceholderImage();
            }

        } catch (error) {
            console.error('[ErrorReporter] Error capturando pantalla:');
            console.error(error.message);
            console.error(error.stack);

            return this.createPlaceholderImage();
        }
    }
    createPlaceholderImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2a2a2a');
        gradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        ctx.fillStyle = '#666';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📸', canvas.width / 2, canvas.height / 2 - 40);

        ctx.fillStyle = '#999';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Screenshot no disponible', canvas.width / 2, canvas.height / 2 + 20);

        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.fillText('La captura de pantalla no pudo ser generada', canvas.width / 2, canvas.height / 2 + 50);

        return canvas.toDataURL('image/png');
    }

    collectSystemInfo() {
        try {
            let battlyVersion = 'Unknown';
            try {
                battlyVersion = require('../../../../package.json').version;
            } catch (e) {
                console.warn('[ErrorReporter] No se pudo leer package.json');
            }

            return {
                platform: os.platform(),
                arch: os.arch(),
                release: os.release(),
                cpus: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / (1024 ** 3)) + ' GB',
                freeMemory: Math.round(os.freemem() / (1024 ** 3)) + ' GB',
                uptime: Math.round(os.uptime() / 3600) + ' hours',
                nodeVersion: process.versions.node,
                electronVersion: process.versions.electron,
                chromeVersion: process.versions.chrome,
                battlyVersion: battlyVersion,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[ErrorReporter] Error recolectando system info:');
            console.error(error.message);
            return {
                platform: 'unknown',
                error: error.message
            };
        }
    }

    async collectLogs() {
        try {
            const logsPath = path.join(os.homedir(), 'AppData', 'Roaming', '.battly', 'logs.txt');

            if (fs.existsSync(logsPath)) {
                const logs = fs.readFileSync(logsPath, 'utf8');

                const lines = logs.split('\n');
                return lines.slice(-500).join('\n');
            }
            return 'No logs available';
        } catch (error) {
            console.error('Error leyendo logs:', error);
            return 'Error reading logs: ' + error.message;
        }
    }

    async openReportModal() {
        if (this.isOpen) {
            console.log('[ErrorReporter] Modal ya está abierto');
            return;
        }

        console.log('[ErrorReporter] Abriendo modal de reporte...');
        this.isOpen = true;

        try {

            console.log('[ErrorReporter] Capturando pantalla...');
            const screenshot = await this.captureScreen();

            if (!screenshot) {
                console.warn('[ErrorReporter] No se pudo capturar la pantalla, continuando sin screenshot');
            } else {
                console.log('[ErrorReporter] Screenshot capturado correctamente');
            }

            this.screenshot = screenshot;

            console.log('[ErrorReporter] Creando modal...');
            this.createModal();
            console.log('[ErrorReporter] Modal creado correctamente');
        } catch (error) {
            console.error('[ErrorReporter] Error abriendo modal:');
            console.error(error.message);
            console.error(error.stack);
            this.isOpen = false;
        }
    }

    createModal() {

        if (this.modal) {
            this.modal.remove();
        }

        const modalHTML = `
            <div id="error-report-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            ">
                <div style="
                    background: #1e1e1e;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                ">
                    <!-- Header -->
                    <div style="
                        padding: 20px;
                        border-bottom: 1px solid #333;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                        <div>
                            <h2 style="margin: 0; color: #fff; font-size: 20px;">
                                🐛 Reportar Problema
                            </h2>
                            <p style="margin: 5px 0 0 0; color: #888; font-size: 13px;">
                                Describe el problema que encontraste
                            </p>
                        </div>
                        <button id="close-report-btn" style="
                            background: transparent;
                            border: none;
                            color: #888;
                            font-size: 24px;
                            cursor: pointer;
                            padding: 0;
                            width: 30px;
                            height: 30px;
                        ">×</button>
                    </div>

                    <!-- Content -->
                    <div style="
                        padding: 20px;
                        overflow-y: auto;
                        flex: 1;
                    ">
                        <!-- Screenshot Preview -->
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; color: #fff; margin-bottom: 8px; font-size: 14px;">
                                📸 Captura de Pantalla
                            </label>
                            <div style="
                                border: 2px solid #333;
                                border-radius: 8px;
                                overflow: hidden;
                                background: #000;
                            ">
                                <img id="screenshot-preview" 
                                     src="${this.screenshot || ''}" 
                                     style="width: 100%; height: auto; display: block;"
                                     alt="Screenshot">
                            </div>
                        </div>

                        <!-- Comment Input -->
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; color: #fff; margin-bottom: 8px; font-size: 14px;">
                                💬 Describe el Problema <span style="color: #e74c3c;">*</span>
                            </label>
                            <textarea id="error-comment" 
                                      maxlength="${this.maxCommentLength}"
                                      placeholder="Explica qué estabas haciendo cuando ocurrió el problema..."
                                      style="
                                width: 100%;
                                min-height: 120px;
                                padding: 12px;
                                background: #2a2a2a;
                                border: 1px solid #444;
                                border-radius: 6px;
                                color: #fff;
                                font-size: 14px;
                                font-family: inherit;
                                resize: vertical;
                            "></textarea>
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                margin-top: 5px;
                                font-size: 12px;
                                color: #888;
                            ">
                                <span id="char-count">0 / ${this.maxCommentLength} caracteres</span>
                                <span style="color: #666;">Mínimo 10 caracteres</span>
                            </div>
                        </div>

                        <!-- Info Notice -->
                        <div style="
                            background: #2a2a2a;
                            border-left: 3px solid #3498db;
                            padding: 12px;
                            border-radius: 4px;
                            font-size: 13px;
                            color: #aaa;
                        ">
                            <strong style="color: #3498db;">ℹ️ Información incluida:</strong><br>
                            • Captura de pantalla actual<br>
                            • Logs del launcher (últimas 500 líneas)<br>
                            • Información del sistema (OS, RAM, CPU)<br>
                            • Versión de Battly y Electron
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="
                        padding: 20px;
                        border-top: 1px solid #333;
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                    ">
                        <button id="cancel-report-btn" style="
                            padding: 10px 20px;
                            background: transparent;
                            border: 1px solid #555;
                            border-radius: 6px;
                            color: #fff;
                            cursor: pointer;
                            font-size: 14px;
                            transition: all 0.2s;
                        ">Cancelar</button>
                        <button id="submit-report-btn" style="
                            padding: 10px 24px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            border: none;
                            border-radius: 6px;
                            color: #fff;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 500;
                            transition: all 0.2s;
                        ">
                            📤 Enviar Reporte
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('error-report-modal');

        this.attachEventListeners();
    }

    attachEventListeners() {
        const commentTextarea = document.getElementById('error-comment');
        const charCount = document.getElementById('char-count');
        const closeBtn = document.getElementById('close-report-btn');
        const cancelBtn = document.getElementById('cancel-report-btn');
        const submitBtn = document.getElementById('submit-report-btn');

        commentTextarea.addEventListener('input', () => {
            const length = commentTextarea.value.length;
            charCount.textContent = `${length} / ${this.maxCommentLength} caracteres`;

            if (length < 10) {
                charCount.style.color = '#e74c3c';
            } else {
                charCount.style.color = '#888';
            }
        });

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());

        submitBtn.addEventListener('click', () => this.submitReport());

        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    async submitReport() {
        const commentTextarea = document.getElementById('error-comment');
        const submitBtn = document.getElementById('submit-report-btn');
        const comment = commentTextarea.value.trim();

        if (comment.length < 10) {
            this.showNotification('⚠️ El comentario debe tener al menos 10 caracteres', 'warning');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.innerHTML = '⏳ Enviando...';

        try {

            const systemInfo = this.collectSystemInfo();
            const logs = await this.collectLogs();

            const reportData = {
                comment,
                screenshot: this.screenshot,
                systemInfo,
                logs,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };

            const result = await ipcRenderer.invoke('submit-error-report', reportData);

            if (result.success) {
                this.showNotification('✅ Reporte enviado correctamente. ¡Gracias!', 'success');
                this.closeModal();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error enviando reporte:');
            console.error(error.message);
            console.error(error.stack);
            this.showNotification('❌ Error al enviar el reporte: ' + error.message, 'error');

            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.innerHTML = '📤 Enviar Reporte';
        }
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 9999999;
            font-size: 14px;
            max-width: 350px;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                this.modal.remove();
                this.modal = null;
                this.screenshot = null;
                this.isOpen = false;
            }, 200);
        }
    }
}

const errorReporter = new ErrorReporter();

console.log('[ErrorReporter] Módulo cargado, registrando shortcut Ctrl+E...');

document.addEventListener('keydown', (e) => {

    if (e.ctrlKey && e.key === 'e') {
        console.log('[ErrorReporter] Ctrl+E detectado, abriendo modal...');
        e.preventDefault();
        errorReporter.openReportModal();
    }
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    #error-report-modal button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    #cancel-report-btn:hover {
        background: #2a2a2a !important;
    }
`;
document.head.appendChild(style);

module.exports = errorReporter;

