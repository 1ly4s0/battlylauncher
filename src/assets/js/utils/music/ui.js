'use strict';

function createProgressModal() {
    const modalDiv = document.createElement("div");
    modalDiv.classList.add("modal", "is-active");
    modalDiv.style.zIndex = "99999999";
    modalDiv.innerHTML = `
    <div class="modal-background"></div>
    <div class="modal-card modal-animated" style="border-radius: 15px;">
      <section class="modal-card-body" style="background-color: #101726;">
        <div class="content has-text-centered">
          <h2 class="title" style="color:#fff;" data-string-id="music.updatingTitle">${window.getString("music.updatingTitle")}</h2>
          <p class="subtitle" style="color:#fff; text-align: start;" data-string-id="music.downloadingLatestVersion">${window.getString("music.downloadingLatestVersion")}</p>
          <progress id="ytdlp-progress" class="progress is-info" value="0" max="100">0%</progress>
          <p id="ytdlp-progress-text" style="color:#cfd3dc">0%</p>
        </div>
      </section>
    </div>`;
    document.body.appendChild(modalDiv);
    const bar = modalDiv.querySelector('#ytdlp-progress');
    const txt = modalDiv.querySelector('#ytdlp-progress-text');

    return {
        update: (percent, subtitle) => {
            if (typeof percent === 'number' && isFinite(percent)) {
                bar.removeAttribute('indeterminate');
                bar.value = Math.max(0, Math.min(100, percent));
                txt.textContent = `${Math.round(bar.value)}%`;
            }
            if (subtitle) {
                modalDiv.querySelector('.subtitle').textContent = subtitle;
            }
        },
        setIndeterminate: (subtitle) => {
            bar.setAttribute('indeterminate', 'true');
            txt.textContent = '...';
            if (subtitle) modalDiv.querySelector('.subtitle').textContent = subtitle;
        },
        done: (subtitle = window.getString("music.ready")) => {
            bar.value = 100;
            txt.textContent = '100%';
            modalDiv.querySelector('.subtitle').textContent = subtitle;
            setTimeout(() => {
                try { modalDiv.remove(); } catch { }
            }, 1200);
        },
        close: () => {
            try { modalDiv.remove(); } catch { }
        }
    };
}

function runIdle(fn) {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => { fn(); }, { timeout: 2000 });
    } else {
        setTimeout(() => { fn(); }, 0);
    }
}

module.exports = {
    createProgressModal,
    runIdle
};

