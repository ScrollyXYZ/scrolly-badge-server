import scrollBadgeLevelsScrollyABI from "./abi/ScrollBadgeLevelsScrolly.json";
import { normalizeAddress } from "./lib";
import "dotenv/config.js";
import { ethers } from "ethers";

import badgesData from "./badges-data.json";
// console.log("badges-data.json", badgesData);
export const badgeJsons = badgesData;

export const badges: any = {};

const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT);

badges[normalizeAddress(process.env.SIMPLE_BADGE_CONTRACT_ADDRESS)] = {
  name: "Scrolly Badge",
  address: normalizeAddress(process.env.SIMPLE_BADGE_CONTRACT_ADDRESS),
  proxy: normalizeAddress(
    process.env.SIMPLE_BADGE_ATTESTER_PROXY_CONTRACT_ADDRESS
  ),
  isEligible: async (recipient: string): Promise<boolean> => {
    let isEligible: boolean = false;
    try {
      const scrollBadgeLevelsScrollyContract = new ethers.Contract(
        process.env.SIMPLE_BADGE_CONTRACT_ADDRESS,
        scrollBadgeLevelsScrollyABI.abi,
        provider
      );
      isEligible = (await scrollBadgeLevelsScrollyContract.isEligible(
        recipient
      )) as boolean;
    } catch (error) {
      console.log("There was an error checking eligibility for", recipient);
      console.log("error:", error);
    }
    return isEligible;
  },
  createPayload: async (/*recipient*/) => "0x",
};
