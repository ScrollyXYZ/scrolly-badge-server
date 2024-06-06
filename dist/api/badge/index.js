"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const badges_1 = require("./badges");
const lib_1 = require("./lib");
const eip712_proxy_js_1 = require("@ethereum-attestation-service/eas-sdk/dist/eip712-proxy.js");
require("dotenv/config.js");
const ethers_1 = require("ethers");
const provider = new ethers_1.ethers.JsonRpcProvider(process.env.RPC_ENDPOINT);
const signer = new ethers_1.ethers.Wallet(process.env.SIGNER_PRIVATE_KEY).connect(provider);
const badgeRouter = (() => {
    const router = express_1.default.Router();
    // Resolves token data
    // url: localhost:3000/api/badge/token?level={{level}}
    router.get("/token", async (req, res) => {
        const level = parseInt(req.query.level);
        let badgeData = badges_1.badgeJsons[0];
        console.log("Getting token info for level:", level);
        if (level && Number.isFinite(level)) {
            if (level < badges_1.badgeJsons.length) {
                badgeData = badges_1.badgeJsons[level];
            }
            else {
                badgeData = badges_1.badgeJsons[badges_1.badgeJsons.length - 1];
            }
        }
        console.log("returning badge:", badgeData);
        return res.json(badgeData);
    });
    // Resolves eligibility:
    // curl 'localhost:3000/api/badge/check?badge={{badge}}&recipient={{wallet}}'
    router.get("/check", async (req, res) => {
        const { badge, recipient } = req.query;
        const badgeContractAddress = badge;
        const walletAddress = recipient;
        if (!walletAddress)
            return res.json({
                code: 0,
                message: 'missing query parameter "recipient"',
            });
        if (!badgeContractAddress)
            return res.json({ code: 0, message: 'missing parameter "badge"' });
        const scrollyBadge = badges_1.badges[(0, lib_1.normalizeAddress)(badgeContractAddress)];
        if (!scrollyBadge)
            return res.json({
                code: 0,
                message: `unknown badge  "${badgeContractAddress}"`,
            });
        console.log(`Checking eligibility for wallet "${walletAddress}" With scrollyBadge "${scrollyBadge}"`);
        const isEligible = await scrollyBadge.isEligible(walletAddress);
        // Only return 'success' if elegible is true
        if (isEligible === true)
            return res.json({
                code: 1,
                message: "success",
                eligibility: true,
            });
        return res.json({
            code: 0,
            message: "The wallet doen't have enough points to be eligeble",
            eligibility: false,
        });
    });
    // Resolves claim data payload:
    // curl 'localhost:3000/api/badge/claim?badge={{badge}}&recipient={{wallet}}'
    router.get("/claim", async (req, res) => {
        const { badge, recipient } = req.query;
        const badgeContractAddress = badge;
        const walletAddress = recipient;
        if (!walletAddress)
            return res.json({
                code: 0,
                message: 'missing query parameter "recipient"',
            });
        if (!badgeContractAddress)
            return res.json({ code: 0, message: 'missing parameter "badge"' });
        const scrollyBadge = badges_1.badges[(0, lib_1.normalizeAddress)(badgeContractAddress)];
        if (!scrollyBadge)
            return res.json({
                code: 0,
                message: `unknown badge "${badgeContractAddress}"`,
            });
        const isEligible = await scrollyBadge.isEligible(walletAddress);
        if (!isEligible)
            return res.json({ code: 0, message: "not eligible" });
        const proxy = new eip712_proxy_js_1.EIP712Proxy(scrollyBadge.proxy);
        const attestation = await (0, lib_1.createBadge)({
            badge: scrollyBadge.address,
            recipient: walletAddress,
            payload: await scrollyBadge.createPayload(),
            proxy,
            signer,
        });
        console.log("Populated attestation transaction:", attestation);
        const tx = await proxy.contract.attestByDelegation.populateTransaction(attestation);
        console.log("Transaction to sign:", tx);
        res.json({ code: 1, message: "success", tx });
    });
    // Resolve api/ to avoid errors
    router.get("/", (_req, res) => res.send("Scrolly badge API v1"));
    return router;
})();
exports.default = badgeRouter;
//# sourceMappingURL=index.js.map