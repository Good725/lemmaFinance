const hre = require("hardhat");
const { ethers, upgrades } = hre;
const fetch = require("cross-fetch");
const addresses = require("../addresses.json");
require("dotenv").config();

const network = "mainnet";
// const tokenTransfers = require("truffle-token-test-utils");//just to visualize token transfers in a transaction
async function main() {
    const xDAIProvider = new ethers.getDefaultProvider("https://rough-frosty-dream.xdai.quiknode.pro/40ffd401477e07ef089743fe2db6f9f463e1e726/");


    // //for testing in the localhost
    // const xDAIProvider = new ethers.getDefaultProvider("http://127.0.0.1:8545");

    const xDAIWallet = new ethers.Wallet(process.env.PRIVATE_KEY, xDAIProvider);

    const alreadyDeployedLemmaTokenAddress = addresses.xDAIMainnet.lemmaxDAI;
    console.log("alreadyDeployedLemmaTokenAddress", alreadyDeployedLemmaTokenAddress);

    // const LemmaPerpetual = (await hre.ethers.getContractFactory("LemmaPerpetual")).connect(xDAIWallet);
    const LemmaToken = (await hre.ethers.getContractFactory("LemmaToken")).connect(xDAIWallet);
    //TODO: to make this works it requires that openzeppelin's upgrade use provider provided by the signer instead of taking it from the hardhat
    //make a custom change and use custom npm package to avoid errors
    const lemmaToken = await upgrades.upgradeProxy(alreadyDeployedLemmaTokenAddress, LemmaToken);
    await lemmaToken.deployed();
    console.log("lemmaToken", lemmaToken.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
