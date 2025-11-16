const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const toml = require("toml");

async function readModMeta(modPath) {
    try {
        const zip = await unzipper.Open.file(modPath);

        let entry = zip.files.find((f) => f.path.toLowerCase() === "fabric.mod.json");
        if (entry) {
            const raw = (await entry.buffer()).toString("utf8");
            const j = JSON.parse(raw);
            return {
                loader: "fabric",
                id: j.id || null,
                name: j.name || j.id || null,
                version: j.version || null
            };
        }

        entry = zip.files.find((f) => f.path.toLowerCase() === "quilt.mod.json");
        if (entry) {
            const raw = (await entry.buffer()).toString("utf8");
            const j = JSON.parse(raw);
            const q = j.quilt_loader || {};
            return {
                loader: "quilt",
                id: q.id || j.id || null,
                name: (q.metadata && q.metadata.name) || j.name || q.id || null,
                version: q.version || j.version || null
            };
        }

        entry = zip.files.find((f) => f.path.toLowerCase() === "meta-inf/mods.toml");
        if (entry) {
            const raw = (await entry.buffer()).toString("utf8");
            const t = toml.parse(raw);
            const first = Array.isArray(t.mods) && t.mods.length ? t.mods[0] : {};

            const loaderFromToml =
                typeof t.modLoader === "string" && /neoforge/i.test(t.modLoader)
                    ? "neoforge"
                    : /forge/i.test(t.modLoader || "")
                        ? "forge"
                        : null;

            return {
                loader: loaderFromToml,

                id: first.modId || null,
                name: first.displayName || first.modId || null,
                version: first.version || null
            };
        }
    } catch (_) {

    }
    return { loader: null, id: null, name: null, version: null };
}

function guessLoaderFromFilename(filename) {
    const s = filename.toLowerCase();
    if (s.includes("neoforge")) return "neoforge";
    if (s.includes("forge")) return "forge";
    if (s.includes("fabric")) return "fabric";
    if (s.includes("quilt")) return "quilt";
    return null;
}

function stripExt(file) {
    return file.replace(/\.(jar|disabledmod)$/i, "");
}

async function extractMods(dataDirectory) {
    const modsDirectory = path.join(dataDirectory, ".battly", "mods");
    if (!fs.existsSync(modsDirectory)) fs.mkdirSync(modsDirectory, { recursive: true });

    const files = fs
        .readdirSync(modsDirectory)
        .filter((f) => /\.(jar|disabledmod)$/i.test(f));

    const mods = [];

    await Promise.all(
        files.map(async (file) => {
            const full = path.join(modsDirectory, file);
            const meta = await readModMeta(full);

            const loader =
                meta.loader ||
                guessLoaderFromFilename(file);

            mods.push({
                file: full,
                name: meta.name || stripExt(file),
                id: meta.id || null,
                version: meta.version || null,
                loader: loader || null,
                enabled: /\.jar$/i.test(file)
            });
        })
    );

    mods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return mods;
}

module.exports = { extractMods };

