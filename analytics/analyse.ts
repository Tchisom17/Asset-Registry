import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from "url";

type Row = Record<string, any>;

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // DB lives in backend folder
  const dbPath = path.resolve(__dirname, "../backend/registry.db");
  const outDir = path.resolve(__dirname, ".");
  fs.mkdirSync(outDir, { recursive: true });

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  const assets: Row[] = await db.all("SELECT * FROM assets");
  const transfers: Row[] = await db.all("SELECT * FROM transfers");

  // Summary
  const totalAssets = assets.length;
  const totalTransfers = transfers.length;

  // Top owners by current holdings
  const ownerCounts = new Map<string, number>();
  for (const a of assets) {
    ownerCounts.set(a.owner, (ownerCounts.get(a.owner) || 0) + 1);
  }
  const topOwners = Array.from(ownerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([owner, count]) => ({ owner, count }));

  // Transfers per day
  const byDay = new Map<string, number>();
  for (const t of transfers) {
    const d = new Date(Number(t.timestamp) * 1000);
    const day = d.toISOString().slice(0, 10); // YYYY-MM-DD
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }
  const byDayRows = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, count]) => ({ day, count }));

  // Write outputs
  fs.writeFileSync(
    path.join(outDir, "analytics.json"),
    JSON.stringify({ totalAssets, totalTransfers, topOwners }, null, 2)
  );

  // Make sure subdir exists before writing
//   const analyticsDir = path.join(outDir, "analytics");
//   fs.mkdirSync(analyticsDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "summary.md"),
    `# Analytics Summary\n\n- Total Assets: ${totalAssets}\n- Total Transfers: ${totalTransfers}\n- Top Owners: ${JSON.stringify(
      topOwners,
      null,
      2
    )}`
  );

  const csv = [
    "day,count",
    ...byDayRows.map((r) => `${r.day},${r.count}`),
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "activity_by_day.csv"), csv);

  console.log("Analytics written to:", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// import fs from "fs";
// import path from "path";
// import sqlite3 from "sqlite3";
// import { open } from "sqlite";

// type Row = Record<string, any>;

// async function main() {
//   // DB lives in backend folder
//   const dbPath = path.resolve(__dirname, "../../backend/registry.db");
//   const outDir = path.resolve(__dirname, "../out");
//   fs.mkdirSync(outDir, { recursive: true });

//   const db = await open({ filename: dbPath, driver: sqlite3.Database });

//   const assets: Row[] = await db.all("SELECT * FROM assets");
//   const transfers: Row[] = await db.all("SELECT * FROM transfers");

//   // Summary
//   const totalAssets = assets.length;
//   const totalTransfers = transfers.length;

//   // Top owners by current holdings
//   const ownerCounts = new Map<string, number>();
//   for (const a of assets) {
//     ownerCounts.set(a.owner, (ownerCounts.get(a.owner) || 0) + 1);
//   }
//   const topOwners = Array.from(ownerCounts.entries())
//     .sort((a, b) => b[1] - a[1])
//     .slice(0, 5)
//     .map(([owner, count]) => ({ owner, count }));

//   // Transfers per day
//   const byDay = new Map<string, number>();
//   for (const t of transfers) {
//     const d = new Date(Number(t.timestamp) * 1000);
//     const day = d.toISOString().slice(0, 10); // YYYY-MM-DD
//     byDay.set(day, (byDay.get(day) || 0) + 1);
//   }
//   const byDayRows = Array.from(byDay.entries())
//     .sort((a, b) => a[0].localeCompare(b[0]))
//     .map(([day, count]) => ({ day, count }));

//   // Write outputs
//   fs.writeFileSync(
//     path.join(outDir, "analytics.json"),
//     JSON.stringify({ totalAssets, totalTransfers, topOwners }, null, 2)
//   );
//   fs.writeFileSync(
//     path.join(outDir, "analytics/summary.md"),
//     `# Analytics Summary\n\n- Total Assets: ${totalAssets}\n- Total Transfers: ${totalTransfers}\n- Top Owners: ${JSON.stringify(
//       topOwners,
//       null,
//       2
//     )}`
//   );

//   const csv = [
//     "day,count",
//     ...byDayRows.map((r) => `${r.day},${r.count}`),
//   ].join("\n");
//   fs.writeFileSync(path.join(outDir, "activity_by_day.csv"), csv);

//   console.log("Analytics written to:", outDir);
// }

// main().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });

// import { ethers } from "ethers";
// import fs from "fs";
// import db from "../backend/src/db.ts";
// import AssetRegistry from "../artifacts/contracts/AssetRegistry.sol/AssetRegistry.json";

// const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
// const contract = new ethers.Contract(
//   process.env.CONTRACT_ADDRESS!,
//   AssetRegistry.abi,
//   provider
// );

// async function runAnalytics() {
//   const latest = await provider.getBlockNumber();
//   const fromBlock = latest - 1000;

//   const registerEvents = await contract.queryFilter(
//     "AssetRegistered",
//     fromBlock,
//     latest
//   );
//   const transferEvents = await contract.queryFilter(
//     "OwnershipTransferred",
//     fromBlock,
//     latest
//   );

//   // Store into SQLite
//   for (const e of registerEvents) {
//     const { id, owner, description, timestamp } = e.args!;
//     db.prepare(
//       "INSERT OR IGNORE INTO assets (id, owner, description, registeredAt) VALUES (?, ?, ?, ?)"
//     ).run(id.toString(), owner, description, timestamp.toString());
//   }

//   for (const e of transferEvents) {
//     const { id, from, to, timestamp } = e.args!;
//     db.prepare(
//       "INSERT INTO transfers (assetId, fromOwner, toOwner, timestamp) VALUES (?, ?, ?, ?)"
//     ).run(id.toString(), from, to, timestamp.toString());
//   }

//   // Analytics
//   const totalAssets = db
//     .prepare("SELECT COUNT(*) as count FROM assets")
//     .get().count;
//   const totalTransfers = db
//     .prepare("SELECT COUNT(*) as count FROM transfers")
//     .get().count;
//   const topOwners = db
//     .prepare(
//       `
//     SELECT toOwner as owner, COUNT(*) as transfers
//     FROM transfers
//     GROUP BY toOwner
//     ORDER BY transfers DESC
//     LIMIT 3
//   `
//     )
//     .all();

//   const summary = { totalAssets, totalTransfers, topOwners };
//   fs.writeFileSync(
//     "analytics/analytics.json",
//     JSON.stringify(summary, null, 2)
//   );
//   fs.writeFileSync(
//     "analytics/summary.md",
//     `# Analytics Summary\n\n- Total Assets: ${totalAssets}\n- Total Transfers: ${totalTransfers}\n- Top Owners: ${JSON.stringify(
//       topOwners,
//       null,
//       2
//     )}`
//   );

//   console.log("Analytics complete ✅");
// }

// runAnalytics();
