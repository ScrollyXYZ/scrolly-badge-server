"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.badges = exports.badgeJsons = void 0;
const ScrollBadgeLevelsScrolly_json_1 = __importDefault(require("./abi/ScrollBadgeLevelsScrolly.json"));
const lib_1 = require("./lib");
require("dotenv/config.js");
const ethers_1 = require("ethers");
const badges_data_json_1 = __importDefault(require("./badges-data.json"));
// console.log("badges-data.json", badgesData);
exports.badgeJsons = badges_data_json_1.default;
exports.badges = {};
const provider = new ethers_1.ethers.JsonRpcProvider(process.env.RPC_ENDPOINT);
exports.badges[(0, lib_1.normalizeAddress)(process.env.SIMPLE_BADGE_CONTRACT_ADDRESS)] = {
    name: "Scrolly Badge",
    address: (0, lib_1.normalizeAddress)(process.env.SIMPLE_BADGE_CONTRACT_ADDRESS),
    proxy: (0, lib_1.normalizeAddress)(process.env.SIMPLE_BADGE_ATTESTER_PROXY_CONTRACT_ADDRESS),
    isEligible: async (recipient) => {
        let isEligible = false;
        try {
            const scrollBadgeLevelsScrollyContract = new ethers_1.ethers.Contract(process.env.SIMPLE_BADGE_CONTRACT_ADDRESS, ScrollBadgeLevelsScrolly_json_1.default.abi, provider);
            isEligible = (await scrollBadgeLevelsScrollyContract.isEligible(recipient));
        }
        catch (error) {
            console.log("There was an error checking eligibility for", recipient);
            console.log("error:", error);
        }
        return isEligible;
    },
    createPayload: async ( /*recipient*/) => "0x",
};
//# sourceMappingURL=badges.js.map