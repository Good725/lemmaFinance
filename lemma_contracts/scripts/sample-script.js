// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Greeter = await hre.ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Hardhat!");

  await greeter.deployed();

  console.log("Greeter deployed to:", greeter.address);

  // const uniswapV2Router02 = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77";
  // const LemmaHoneySwap = await hre.ethers.getContractFactory("LemmaHoneySwap");
  // const lemmaHoneySwap = await Greeter.deploy("Hello, Hardhat!");

  // await LemmaHoneySwap.deployed();

  // console.log("LemmaHoneySwap deployed to:", lemmaHoneySwap.address);

  // const LemmaPerpetual = await hre.ethers.getContractFactory("LemmaPerpetual");
  // const lemmaPerpetual = await LemmaPerpetual.deploy("Hello, Hardhat!");

  // await lemmaPerpetual.deployed();

  // console.log("LemmaPerpetual deployed to:", lemmaPerpetual.address);

  // const LemmaToken = await hre.ethers.getContractFactory("LemmaToken");
  // const lemmaToken = await Greeter.deploy("Hello, Hardhat!");

  // await lemmaToken.deployed();

  // console.log("LemmaToken deployed to:", lemmaToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
