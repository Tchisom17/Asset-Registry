// import express from "express";
// import { ethers } from "ethers";
// import fs from "fs";
// import { initDb } from "./db.ts";

// const ABI = JSON.parse(
//   fs.readFileSync("./src/abi/AssetRegistry.json", "utf-8")
// );
// const CONTRACT_ADDRESS = "0x29c64bdEc2973Ca6cc1766399e07996f63e52005"; // Replace after deploy

// const app = express();
// const port = 4000;

// async function main() {
//   const db = await initDb();

//   const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
//   const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

//   contract.on("AssetRegistered", async (id, owner, desc, ts) => {
//     await db.run(
//       "INSERT INTO assets (id, owner, description, registeredAt) VALUES (?,?,?,?)",
//       id,
//       owner,
//       desc,
//       Number(ts)
//     );
//   });

//   contract.on("OwnershipTransferred", async (id, prev, next, ts) => {
//     await db.run(
//       "INSERT INTO transfers (assetId, fromOwner, toOwner, timestamp) VALUES (?,?,?,?)",
//       id,
//       prev,
//       next,
//       Number(ts)
//     );
//     await db.run("UPDATE assets SET owner=? WHERE id=?", next, id);
//   });

//   app.get("/assets", async (_, res) =>
//     res.json(await db.all("SELECT * FROM assets"))
//   );
//   app.get("/assets/:id/transfers", async (req, res) => {
//     res.json(
//       await db.all("SELECT * FROM transfers WHERE assetId=?", req.params.id)
//     );
//   });

//   app.listen(port, () =>
//     console.log(`API running on http://localhost:${port}`)
//   );
// }

// main();

import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import { initDb } from "./db.ts";

// Load only the abi array from the artifact
const artifact = JSON.parse(
  fs.readFileSync("./src/abi/AssetRegistry.json", "utf-8")
);
const ABI = artifact.abi;

// Replace after deploy, or use process.env.CONTRACT_ADDRESS
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "0x29c64bdEc2973Ca6cc1766399e07996f63e52005";

const app = express();
const port = 4000;

async function main() {
  const db = await initDb();

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error(
      "Missing SEPOLIA_RPC_URL. Export it from keystore before running backend:\n" +
        'export SEPOLIA_RPC_URL="$(npx hardhat keystore get SEPOLIA_RPC_URL)"'
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  // Listen to events
  contract.on("AssetRegistered", async (id, owner, desc, ts) => {
    await db.run(
      "INSERT OR REPLACE INTO assets (id, owner, description, registeredAt) VALUES (?,?,?,?)",
      Number(id),
      owner,
      desc,
      Number(ts)
    );
    console.log("Indexed AssetRegistered:", { id: Number(id), owner });
  });

  contract.on("OwnershipTransferred", async (id, prev, next, ts) => {
    await db.run(
      "INSERT INTO transfers (assetId, fromOwner, toOwner, timestamp) VALUES (?,?,?,?)",
      Number(id),
      prev,
      next,
      Number(ts)
    );
    await db.run("UPDATE assets SET owner=? WHERE id=?", next, Number(id));
    console.log("Indexed OwnershipTransferred:", {
      id: Number(id),
      prev,
      next,
    });
  });

  // REST API
  app.get("/assets", async (_req, res) => {
    const rows = await db.all("SELECT * FROM assets ORDER BY id ASC");
    res.json(rows);
  });

  app.get("/assets/:id/transfers", async (req, res) => {
    const rows = await db.all(
      "SELECT * FROM transfers WHERE assetId=? ORDER BY timestamp ASC",
      Number(req.params.id)
    );
    res.json(rows);
  });

  app.get("/owners/:address/assets", async (req, res) => {
    try {
      const ownerChecksum = ethers.getAddress(req.params.address); // validate + checksum
      const rows = await db.all(
        "SELECT * FROM assets WHERE lower(owner) = lower(?) ORDER BY id ASC",
        ownerChecksum
      );
      res.json(rows);
    } catch {
      res.status(400).json({ error: "Invalid Ethereum address" });
    }
  });

  app.listen(port, () =>
    console.log(`API running on http://localhost:${port}`)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
