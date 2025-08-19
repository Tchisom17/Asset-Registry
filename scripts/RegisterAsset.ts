// scripts/RegisterAsset.ts
import { setDefaultResultOrder } from "dns";
setDefaultResultOrder("ipv4first");
import { ethers } from "ethers";
import abiJson from "../backend/src/abi/AssetRegistry.json" assert { type: "json" };

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
  const contractAddress = "0x29c64bdEc2973Ca6cc1766399e07996f63e52005";

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error(
      "Missing environment variables: SEPOLIA_RPC_URL, SEPOLIA_PRIVATE_KEY, or CONTRACT_ADDRESS"
    );
  }

  // Connect to provider + wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Load ABI
  // const abi = require("../src/abi/AssetRegistry.json").abi;

  const contract = new ethers.Contract(contractAddress, abiJson.abi, wallet);

  console.log("Registering asset...");
  const tx = await contract.registerAsset("My first asset from script");
  console.log("Transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ Transaction mined in block", receipt.blockNumber);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
