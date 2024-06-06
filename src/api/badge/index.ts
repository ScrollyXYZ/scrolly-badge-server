import express, { Router } from "express";
import { badges, badgeJsons } from "./badges";
import { createBadge, normalizeAddress } from "./lib";
import { EIP712Proxy } from "@ethereum-attestation-service/eas-sdk/dist/eip712-proxy.js";
import "dotenv/config.js";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT);
const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY).connect(
  provider
);

const badgeRouter: Router = (() => {
  const router = express.Router();

  // Resolves token data
  // url: localhost:3000/api/badge/token?level={{level}}
  router.get("/token", async (req, res) => {
    const level: number = parseInt(req.query.level as string);
    let badgeData = badgeJsons[0];

    console.log("Getting token info for level:", level);

    if (level && Number.isFinite(level)) {
      if (level < badgeJsons.length) {
        badgeData = badgeJsons[level];
      } else {
        badgeData = badgeJsons[badgeJsons.length - 1];
      }
    }

    console.log("returning badge:", badgeData);
    return res.json(badgeData);
  });

  // Resolves eligibility:
  // curl 'localhost:3000/api/badge/check?badge={{badge}}&recipient={{wallet}}'
  router.get("/check", async (req, res) => {
    const { badge, recipient } = req.query;
    const badgeContractAddress: string = badge as string;
    const walletAddress = recipient;

    if (!walletAddress)
      return res.json({
        code: 0,
        message: 'missing query parameter "recipient"',
      });
    if (!badgeContractAddress)
      return res.json({ code: 0, message: 'missing parameter "badge"' });

    const scrollyBadge = badges[normalizeAddress(badgeContractAddress)];
    if (!scrollyBadge)
      return res.json({
        code: 0,
        message: `unknown badge  "${badgeContractAddress}"`,
      });

    console.log(
      `Checking eligibility for wallet "${walletAddress}" With scrollyBadge "${scrollyBadge}"`
    );

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
    const badgeContractAddress: string = badge as string;
    const walletAddress: string = recipient as string;

    if (!walletAddress)
      return res.json({
        code: 0,
        message: 'missing query parameter "recipient"',
      });
    if (!badgeContractAddress)
      return res.json({ code: 0, message: 'missing parameter "badge"' });

    const scrollyBadge = badges[normalizeAddress(badgeContractAddress)];
    if (!scrollyBadge)
      return res.json({
        code: 0,
        message: `unknown badge "${badgeContractAddress}"`,
      });

    const isEligible = await scrollyBadge.isEligible(walletAddress);
    if (!isEligible) return res.json({ code: 0, message: "not eligible" });

    const proxy = new EIP712Proxy(scrollyBadge.proxy);

    const attestation = await createBadge({
      badge: scrollyBadge.address,
      recipient: walletAddress,
      payload: await scrollyBadge.createPayload(),
      proxy,
      signer,
    });

    console.log("Populated attestation transaction:", attestation);

    const tx = await proxy.contract.attestByDelegation.populateTransaction(
      attestation
    );
    console.log("Transaction to sign:", tx);
    res.json({ code: 1, message: "success", tx });
  });

  // Resolve api/ to avoid errors
  router.get("/", (_req, res) => res.send("Scrolly badge API v1"));

  return router;
})();

export default badgeRouter;
