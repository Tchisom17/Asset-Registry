import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AssetRegistryModule", (m) => {
  const assetRegistry = m.contract("AssetRegistry");

  return { assetRegistry };
});

// deployed address: 0x29c64bdEc2973Ca6cc1766399e07996f63e52005