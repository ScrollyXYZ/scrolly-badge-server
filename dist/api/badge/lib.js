"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBadge = exports.createAttestation = exports.normalizeAddress = void 0;
const eas_sdk_1 = require("@ethereum-attestation-service/eas-sdk");
function normalizeAddress(address) {
    return address.toLowerCase();
}
exports.normalizeAddress = normalizeAddress;
async function createAttestation({ schema, recipient, data, deadline, proxy, signer, }) {
    const attestation = {
        // attestation data
        schema,
        recipient,
        data,
        // unused fields
        revocable: true,
        refUID: eas_sdk_1.ZERO_BYTES32,
        value: 0n,
        expirationTime: eas_sdk_1.NO_EXPIRATION,
        // signature details
        deadline,
        attester: signer.address,
    };
    // sign
    const delegatedProxy = await proxy.connect(signer).getDelegated();
    const signature = await delegatedProxy.signDelegatedProxyAttestation(attestation, signer);
    const req = {
        schema: attestation.schema,
        data: attestation,
        attester: attestation.attester,
        signature: signature.signature,
        deadline: attestation.deadline,
    };
    // note: to use multiAttestByDelegationProxy, change to
    // data: [attestation],
    // signatures: [signature.signature],
    return req;
}
exports.createAttestation = createAttestation;
async function createBadge({ badge, recipient, payload, proxy, signer, }) {
    const encoder = new eas_sdk_1.SchemaEncoder(process.env.SCROLL_BADGE_SCHEMA);
    const data = encoder.encodeData([
        { name: "badge", value: badge, type: "address" },
        { name: "payload", value: payload, type: "bytes" },
    ]);
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const deadline = BigInt(currentTime + 3600);
    console.log("createAttestation", {
        schema: process.env.SCROLL_BADGE_SCHEMA_UID,
        recipient,
        data,
        deadline,
        proxy,
        signer,
    });
    const attestation = await createAttestation({
        schema: process.env.SCROLL_BADGE_SCHEMA_UID,
        recipient,
        data,
        deadline,
        proxy,
        signer,
    });
    return attestation;
}
exports.createBadge = createBadge;
//# sourceMappingURL=lib.js.map