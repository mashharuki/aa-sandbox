import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  gasReporter: {
    enabled: true,
  },
};
switch (process.env.ENV) {
  case "dev":
    config.networks = {
      sepolia: {
        url: process.env.RPC_URL,
        accounts: [process.env.PRIVATE_KEY!],
      },
    };
    config.etherscan = {
      apiKey: process.env.ETHERSCAN_API_KEY,
    };
}

export default config;
