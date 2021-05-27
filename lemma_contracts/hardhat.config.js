const { ethers } = require("ethers");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-ethers");
require("@tenderly/hardhat-tenderly");
require("solidity-coverage");

require("dotenv").config();


task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://rpc.xdaichain.com/",
      // },
      forking: {
        url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_KEY,
      },
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
      // chainId: 100,
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_KEY,
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
    },
    xdai: {
      url: "https://rpc.xdaichain.com/",
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
      gasPrice: (ethers.utils.parseUnits("1", "gwei")).toNumber()
    }
  },
  solidity: {
    version: "0.8.3",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 999999
  }
};

