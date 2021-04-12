require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require("dotenv").config();


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    // hardhat: {
    //   forking: {
    //     url: "https://eth-mainnet.alchemyapi.io/v2/onS4dqEgwFlnReX-5HrjzQjvTjE-BIA7"
    //   }
    // },
    hardhat: {
      forking: {
        url: "https://rpc.xdaichain.com/",

      },
      accounts: {
        mnemonic: process.env.MNEMONIC,
      }
    }
    // ganache: {
    //   url: "http://127.0.0.1:8545",
    //   timeout: 2000000,
    //   accounts: {
    //     mnemonic: process.env.MNEMONIC,
    //   },
    // },
    // rinkeby: {
    //   url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_KEY,
    //   accounts: {
    //     mnemonic: process.env.MNEMONIC,
    //   },
    // },
    // xdai: {
    //   url: "https://rpc.xdaichain.com/",
    //   accounts: [process.env.PRIVATE_KEY],
    //   gasPrice: 10 ** 9,//1 gwei

    // }
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

