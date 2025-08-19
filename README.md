<!-- # Sample Hardhat 3 Beta Project (`mocha` and `ethers`)

This project showcases a Hardhat 3 Beta project using `mocha` for tests and the `ethers` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using `mocha` and ethers.js
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `mocha` tests:

```shell
npx hardhat test solidity
npx hardhat test mocha
```

### Make a deployment to Sepolia

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Sepolia.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
``` -->
---

# Asset Registry – Blockchain + Backend + Analytics

## 📌 Overview

This project demonstrates a complete blockchain-based solution using **Hardhat v3 (Solidity smart contracts)**, a **Node.js backend with SQLite integration**, and **analytics tooling**.

It covers:

1. Smart contracts for **asset registration** and **ownership transfer**
2. Backend API to **index on-chain events** and provide REST access
3. Analytics layer using **Node.js + SQLite**
4. A proposed **real-world fintech use case design**

---

## 🛠️ Part 1 – Smart Contract

* `AssetRegistry.sol` implements:

  * Registering assets
  * Emitting events: `AssetRegistered` and `OwnershipTransferred`
  * Enforcing ownership rules for transfers

Tests are written in **Solidity** using Hardhat v3’s native test runner.

---

## 🌐 Part 2 – Backend & API Integration

Backend built with **Express + ethers.js + SQLite**.

### Features:

* Connects to Ethereum Sepolia testnet
* Listens for events (`AssetRegistered`, `OwnershipTransferred`)
* Stores data in `registry.db`
* Exposes REST API endpoints

### Endpoints:

1. **Get all registered assets**

   ```http
   GET /assets
   ```

   Returns all assets stored locally.

2. **Get all transfers for a given asset ID**

   ```http
   GET /assets/:id/transfers
   ```

   Returns ownership history for an asset.

3. **Get all assets owned by a given address** ✅

   ```http
   GET /owners/:address/assets
   ```

   Returns all assets currently owned by a specific Ethereum address.

---

## 📊 Part 3 – Analytics

Analytics module uses **Node.js with SQLite**.

* `analyse.ts` processes the `registry.db` database
* Generates:

  * `analytics.json`: Raw stats (e.g., number of assets, transfers, most active owners)
  * `summary.md`: Human-readable summary

Run with:

```bash
npm run analyse
```

---

## 💡 Part 4 – Fintech Use Case Design

### Problem Statement

**Cross-border remittances** are expensive, slow, and opaque. Traditional rails (SWIFT, money transfer operators) often involve high fees (7–10%) and settlement delays of several days.

### Proposed Blockchain Solution

* Use **Ethereum Layer 2 (e.g., Arbitrum or Base)** for low-fee, fast stablecoin transfers.
* Users register digital wallets linked to their IDs.
* Smart contracts handle escrow, asset registration (e.g., stablecoin deposits), and ownership transfers.
* Off-chain APIs integrate with mobile money providers or local banks to cash-in/out.

Why Ethereum L2?

* Wide stablecoin adoption (USDC, USDT)
* Mature ecosystem for wallets, identity, and remittance bridges
* Low-cost and high throughput compared to L1

### Architecture Overview

```
+--------------------+         +----------------------+
|  User Wallet (L2)  | <-----> |  AssetRegistry SC    |
|  (MetaMask, Mobile)|         |  - Register deposits |
+--------------------+         |  - Transfer escrow   |
                               +----------+-----------+
                                          |
                                          v
+--------------------+         +----------------------+
| Backend (Node.js)  | <-----> | SQLite / Analytics   |
|  - Event listener  |         | - Track remittances  |
|  - REST API        |         | - Compliance logs    |
+--------------------+         +----------------------+
                                          |
                                          v
+--------------------+         +----------------------+
| Off-chain Partners | <-----> | Local Banks /        |
|  (mobile money)    |         | Cash-in/Cash-out     |
+--------------------+         +----------------------+
```

---

## 🚀 Running the Project

### 1. Install Dependencies

```bash
npm install
```

### 2. Set RPC URL & Private Key in Hardhat Keystore

```bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set DEV_PRIVATE_KEY
```

### 3. Export Variables Before Running Backend

```bash
export SEPOLIA_RPC_URL="$(npx hardhat keystore get SEPOLIA_RPC_URL)"
export CONTRACT_ADDRESS="<deployed-contract-address>"
```

### 4. Run Backend

```bash
cd backend
npm run dev
```

API available at: `http://localhost:4000`

### 5. Run Analytics

```bash
ts-node analytics/analyse.ts
```

---
