export async function wsLatency(domain, tries = 5, timeout = 3000) {
    return new Promise((resolve) => {
        const url = `wss://${domain}/latency`;
        const ws = new WebSocket(url);

        let rtts = [], t0, timer;

        const done = (val) => {
            clearTimeout(timer);
            try { ws.close(); } catch { }
            resolve(val);
        };

        ws.onerror = () => done(9999);

        ws.onopen = () => ping();

        ws.onmessage = () => {
            rtts.push(performance.now() - t0);
            if (rtts.length === tries) {
                const avg = Math.round(rtts.reduce((a, b) => a + b) / rtts.length);
                done(avg);
            } else {
                ping();

            }
        };

        function ping() {
            t0 = performance.now();
            ws.send("p");

            timer = setTimeout(() => done(9999), timeout);
        }
    });
}

