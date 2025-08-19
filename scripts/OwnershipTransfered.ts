import { ethers } from "ethers";
import { setDefaultResultOrder } from "dns";
import abiJson from "../backend/src/abi/AssetRegistry.json" assert { type: "json" };

// Force Node to use IPv4 first to avoid ETIMEDOUT
setDefaultResultOrder("ipv4first");

async function main() {
  console.log("Transferring asset...");

  // --- Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x29c64bdEc2973Ca6cc1766399e07996f63e52005";

  // Provider + Signer (uses your Hardhat config `sepolia` network + keystore/private key)
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  // Connect to contract
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abiJson.abi, wallet);

  // Pick an assetId and newOwner (must be a valid Sepolia address)
  const assetId = 1; // Change this to an existing registered asset
  const newOwner = "0xDE4c5b756E3c19CD0c39C67a94967A2D77C4C6eC"; // Replace with a valid test address

  // Send tx
  const tx = await contract.transferAsset(assetId, newOwner);
  console.log(`Tx submitted: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log("Tx confirmed in block:", receipt.blockNumber);

  // Parse events
  const event = receipt.logs
    .map((log: { topics: ReadonlyArray<string>; data: string; }) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter((e: { name: string; }) => e && e.name === "OwnershipTransferred");

  if (event.length > 0) {
    const { assetId, previousOwner, newOwner, timestamp } = event[0].args;
    console.log("OwnershipTransferred Event:");
    console.log(" assetId:", assetId.toString());
    console.log(" previousOwner:", previousOwner);
    console.log(" newOwner:", newOwner);
    console.log(" timestamp:", timestamp.toString());
  } else {
    console.log("⚠️ No OwnershipTransferred event found in receipt.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
