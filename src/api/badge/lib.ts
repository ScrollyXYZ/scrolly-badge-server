import {
  SchemaEncoder,
  ZERO_BYTES32,
  NO_EXPIRATION,
  EIP712AttestationProxyParams,
} from "@ethereum-attestation-service/eas-sdk";
import { EIP712Proxy } from "@ethereum-attestation-service/eas-sdk/dist/eip712-proxy";
import { ethers } from "ethers";

export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

interface ICreateAttestation {
  schema: string;
  recipient: string;
  data: string;
  deadline: bigint;
  proxy: EIP712Proxy;
  signer: ethers.Wallet;
}

export async function createAttestation({
  schema,
  recipient,
  data,
  deadline,
  proxy,
  signer,
}: ICreateAttestation) {
  const attestation: EIP712AttestationProxyParams & { attester: string } = {
    // attestation data
    schema,
    recipient,
    data,

    // unused fields
    revocable: true,
    refUID: ZERO_BYTES32,
    value: 0n,
    expirationTime: NO_EXPIRATION,

    // signature details
    deadline,
    attester: signer.address,
  };

  // sign
  const delegatedProxy = await proxy.connect(signer).getDelegated();
  const signature = await delegatedProxy.signDelegatedProxyAttestation(
    attestation,
    signer
  );

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

interface ICreateBadge {
  badge: string;
  recipient: string;
  payload: string;
  proxy: EIP712Proxy;
  signer: ethers.Wallet;
}

export async function createBadge({
  badge,
  recipient,
  payload,
  proxy,
  signer,
}: ICreateBadge) {
  const encoder = new SchemaEncoder(process.env.SCROLL_BADGE_SCHEMA);
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
