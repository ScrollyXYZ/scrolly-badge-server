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
    // token data query:
    // url: {{pathname}}/api/badge/token?level={{level}}
    // http://127.0.0.1:3000/api/badge/token?level=5"
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
    // example eligibility query:
    // url: {{pathname}}/api/badge/check?badge={{badgeContractAddress}}&recipient={{walletAddress}}
    // curl "http://127.0.0.1:3000/api/badge/check?badge=0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82&recipient=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    router.get("/check", async (req, res) => {
        const { badge, recipient } = req.query;
        const badgeContractAddress = badge;
        const walletAddress = recipient;
        if (!walletAddress)
            return res.json({ error: 'missing query parameter "walletAddress"' });
        if (!badgeContractAddress)
            return res.json({ error: 'missing parameter "address"' });
        const scrollyBadge = badges_1.badges[(0, lib_1.normalizeAddress)(badgeContractAddress)];
        if (!scrollyBadge)
            return res.json({ error: `unknown badge "${badgeContractAddress}"` });
        console.log("Checking eligibility for wallet", walletAddress);
        console.log("With scrollyBadge", scrollyBadge);
        const isEligible = await scrollyBadge.isEligible(walletAddress);
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
    // example claim query:
    // url: {{pathname}}/api/badge/claim?badge={{badgeContractAddress}}&recipient={{walletAddress}}
    router.get("/claim", async (req, res) => {
        const { badge, recipient } = req.query;
        const badgeContractAddress = badge;
        const walletAddress = recipient;
        if (!walletAddress)
            return res.json({ error: 'missing query parameter "walletAddress"' });
        if (!badgeContractAddress)
            return res.json({ error: 'missing parameter "address"' });
        const scrollyBadge = badges_1.badges[(0, lib_1.normalizeAddress)(badgeContractAddress)];
        if (!scrollyBadge)
            return res.json({ error: `unknown badge "${badgeContractAddress}"` });
        const isEligible = await scrollyBadge.isEligible(walletAddress);
        if (!isEligible)
            return res.json({ error: null, status: "not eligible" });
        const proxy = new eip712_proxy_js_1.EIP712Proxy(scrollyBadge.proxy);
        const attestation = await (0, lib_1.createBadge)({
            badge: scrollyBadge.address,
            recipient: walletAddress,
            payload: await scrollyBadge.createPayload(),
            proxy,
            signer,
        });
        console.log("Populate attestation transaction:", attestation);
        const tx = await proxy.contract.attestByDelegation.populateTransaction(attestation);
        console.log("Transaction:", tx);
        res.json({ error: null, status: "eligible", tx });
    });
    router.get("/", (_req, res) => res.send("Scrolly badge API 2"));
    return router;
})();
exports.default = badgeRouter;
//# sourceMappingURL=index.js.map