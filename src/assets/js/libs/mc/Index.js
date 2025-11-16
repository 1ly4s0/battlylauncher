"use strict";
/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Downloader = exports.Status = exports.Mojang = exports.Microsoft = exports.Launch = exports.AZauth = void 0;
const AZauth_js_1 = __importDefault(require("./Authenticator/AZauth.js"));
exports.AZauth = AZauth_js_1.default;
const Launch_js_1 = __importDefault(require("./Launch.js"));
exports.Launch = Launch_js_1.default;
const Microsoft_js_1 = __importDefault(require("./Authenticator/Microsoft.js"));
exports.Microsoft = Microsoft_js_1.default;
const Mojang = __importStar(require("./Authenticator/Mojang.js"));
exports.Mojang = Mojang;
const status_js_1 = __importDefault(require("./StatusServer/status.js"));
exports.Status = status_js_1.default;
const Downloader_js_1 = __importDefault(require("./utils/Downloader.js"));
exports.Downloader = Downloader_js_1.default;
//# sourceMappingURL=Index.js.map