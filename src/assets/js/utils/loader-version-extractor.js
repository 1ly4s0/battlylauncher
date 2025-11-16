"use strict";

function stripBOM(s) {
    if (!s) return s;
    return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

function takeTomlString(src, re) {

    const m =
        src.match(new RegExp(re.source.replace(/\(\.\*\?\)/g, "(.*?)").toString(), re.flags)) ||
        src.match(new RegExp(re.source.replace(/\(\.\*\?\)/g, "'(.*?)'").toString(), re.flags));
    if (m) return m[1];

    const m2 = src.match(/modId\s*=\s*(?:"([^"]+)"|'([^']+)')/i);
    if (m2) return m2[1] ?? m2[2] ?? null;
    return null;
}

async function loadForgeMapFromMaven(url = "https://files.minecraftforge.net/net/minecraftforge/forge/maven-metadata.json") {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status} al descargar maven-metadata.json`);
    const data = await res.json();

    const map = {};

    const mcVersions = Object.keys(data).sort(cmpSemverLike);

    for (const mc of mcVersions) {
        for (const entry of data[mc] || []) {
            const parts = String(entry).split("-");
            if (parts.length < 2) continue;
            const forgeStr = parts.slice(1).join("-");
            const major = parseInt(forgeStr.split(".")[0], 10);
            if (Number.isNaN(major)) continue;

            if (!map[major]) map[major] = { mcs: new Set(), firstMc: mc, lastMc: mc };
            map[major].mcs.add(mc);
            if (cmpSemverLike(mc, map[major].firstMc) < 0) map[major].firstMc = mc;
            if (cmpSemverLike(mc, map[major].lastMc) > 0) map[major].lastMc = mc;
        }
    }
    for (const k of Object.keys(map)) map[k].mcs = Array.from(map[k].mcs).sort(cmpSemverLike);
    return map;
}

function inferMinecraftFromForgeModsToml(modsTomlText, forgeMap, mode = "single") {
    const r = extractForgeMinMajor(modsTomlText);
    if (!r) return null;
    const majors = Object.keys(forgeMap)
        .map((n) => parseInt(n, 10))
        .sort((a, b) => a - b);
    const mcs = new Set();
    for (const mj of majors) {
        if (mj < r.minMajor) continue;
        for (const mc of forgeMap[mj].mcs) mcs.add(mc);
    }
    const list = Array.from(mcs).sort(cmpSemverLike);
    if (!list.length) return null;
    return mode === "all" ? list : list[list.length - 1];
}

function inferMinecraftFromNeoForgeModsToml(modsTomlText) {
    const text = stripBOM(String(modsTomlText));

    const depBlocks = matchDependencyBlocks(text);

    for (const block of depBlocks) {
        const modId = getKey(block, "modId");
        if (modId?.toLowerCase() !== "minecraft") continue;
        const vr = getKey(block, "versionRange");
        const v = normalizeNeoForgeVersionSpec(vr);
        if (v) return v;
    }

    for (const block of depBlocks) {
        const modId = getKey(block, "modId");
        if (!modId) continue;
        if (modId.toLowerCase() === "neoforge" || modId.toLowerCase() === "neo" || modId.toLowerCase() === "forge") {
            const vr = getKey(block, "versionRange");
            const nf = normalizeBracketRange(vr);
            if (nf?.min) return `NeoForge ${nf.min}+`;
        }
    }

    const modVersionMC = extractMinecraftFromModVersion(text);
    if (modVersionMC) return modVersionMC + "+";

    return null;
}

function matchDependencyBlocks(t) {

    const re = /\[\[dependencies[^\]]*\]\][\s\S]*?(?=\[\[|$)/gi;
    const out = [];
    let m;
    while ((m = re.exec(t)) !== null) out.push(m[0]);
    return out;
}

function getKey(block, key) {

    const m = block.match(new RegExp(`${key}\\s*=\\s*(?:"([^"]+)"|'([^']+)')`, "i"));
    return m ? m[1] ?? m[2] : null;
}

function inferMinecraftFromFabricModJson(jsonText) {
    let json;
    try {
        json = JSON.parse(jsonText);
    } catch {
        return null;
    }
    const dep = json?.depends?.minecraft;
    if (!dep) return null;

    if (typeof dep === "string") return normalizeFabricMinecraftSpec(dep);
    if (Array.isArray(dep) && dep.length) return normalizeFabricMinecraftSpec(dep[0]);
    if (typeof dep === "object") {
        const s = Object.values(dep)[0];
        if (typeof s === "string") return normalizeFabricMinecraftSpec(s);
    }
    return null;
}

function extractForgeMinMajor(t) {

    const m1 = t.match(/loaderVersion\s*=\s*(?:"\s*\[([0-9]+)\s*,|'\s*\[([0-9]+)\s*,)/i);
    if (m1) {
        const n = parseInt(m1[1] ?? m1[2], 10);
        if (!Number.isNaN(n)) return { source: "javafml", minMajor: n };
    }

    const depBlocks = matchDependencyBlocks(t);
    for (const block of depBlocks) {
        const modId = getKey(block, "modId");
        if (modId?.toLowerCase() !== "forge") continue;
        const vr = getKey(block, "versionRange");
        const br = normalizeBracketRange(vr);
        if (br?.min) return { source: "forge", minMajor: parseInt(br.min, 10) };
    }
    return null;
}

function normalizeBracketRange(s) {
    if (!s) return null;
    s = s.trim();

    if (s.startsWith(">=")) return { min: s.replace(/^>=\s*/, ""), max: null };
    if (s.startsWith(">")) return { min: s.replace(/^>\s*/, ""), max: null };

    if (s.startsWith("[") || s.startsWith("(")) {
        const mm = s.match(/^[\[\(]\s*([^,\s]+)?\s*,\s*([^\]\)]*)\s*[\]\)]$/);
        if (!mm) return null;
        const min = mm[1] || null;
        const max = mm[2] || null;
        return { min, max };
    }
    return { min: s, max: null };

}

function normalizeNeoForgeVersionSpec(s) {
    const br = normalizeBracketRange(s);
    if (!br) return null;
    if (br.min && !br.max) {
        return br.min.endsWith("+") ? br.min : `${br.min}+`;
    }
    if (br.min && br.max) return `${br.min} – ${br.max}`;
    return null;
}

function normalizeFabricMinecraftSpec(s) {
    s = s.trim();

    let m = s.match(/^>=\s*([0-9][0-9.\-x]+)\-?$/i);
    if (m) return `${stripTrailingDash(m[1])}+`;

    m = s.match(/^([0-9]+(?:\.[0-9x]+)*)$/i);
    if (m) return m[1];

    const br = normalizeBracketRange(s);
    if (br?.min && !br.max) return `${stripTrailingDash(br.min)}+`;
    if (br?.min && br?.max) return `${stripTrailingDash(br.min)} – ${stripTrailingDash(br.max)}`;

    return s;
}

function stripTrailingDash(v) {
    return v.endsWith("-") ? v.slice(0, -1) : v;
}

function extractMinecraftFromModVersion(t) {

    const re = /version\s*=\s*(?:"([^"]+)"|'([^']+)')/i;
    const m = t.match(re);
    const ver = m ? m[1] ?? m[2] : null;
    if (!ver) return null;

    const mm = ver.match(/mc(\d+\.\d+(?:\.\d+)?)/i);
    return mm ? mm[1] : null;
}

function cmpSemverLike(a, b) {
    const pa = String(a).split(/[^0-9]+/).filter(Boolean).map((n) => parseInt(n, 10));
    const pb = String(b).split(/[^0-9]+/).filter(Boolean).map((n) => parseInt(n, 10));
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const da = pa[i] ?? 0;
        const db = pb[i] ?? 0;
        if (da !== db) return da - db;
    }
    return 0;
}

async function getMinecraftVersionFromForgeModsToml(modsTomlText, mode = "single") {
    const map = await loadForgeMapFromMaven();
    return inferMinecraftFromForgeModsToml(modsTomlText, map, mode);
}

function getMinecraftVersionFromNeoForgeModsToml(modsTomlText) {
    console.log("Detectando versión Minecraft desde NeoForge mods.toml...");
    console.log(modsTomlText);
    return inferMinecraftFromNeoForgeModsToml(modsTomlText);
}

function getMinecraftVersionFromFabricJson(jsonText) {
    return inferMinecraftFromFabricModJson(jsonText);
}

module.exports = {
    loadForgeMapFromMaven,
    inferMinecraftFromForgeModsToml,
    inferMinecraftFromNeoForgeModsToml,
    inferMinecraftFromFabricModJson,
    getMinecraftVersionFromForgeModsToml,
    getMinecraftVersionFromNeoForgeModsToml,
    getMinecraftVersionFromFabricJson,
};

