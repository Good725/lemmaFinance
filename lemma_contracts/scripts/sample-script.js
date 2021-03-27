// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fetch = require("cross-fetch");
const { constants } = require("ethers");
const { defaultAccounts } = require("@ethereum-waffle/provider");

const tokenTransfers = require("truffle-token-test-utils");//just to visulize token transfers in a transaction

async function main() {
  const perpMetadataUrl = "https://metadata.perp.exchange/staging.json";
  const perpMetadata = await fetch(perpMetadataUrl).then(res => res.json());

  // console.log(perpMetadata);

  const collateral = perpMetadata.layers.layer2.externalContracts.usdc;//USDC
  const underlyingAsset = "0x359eaF429cd6114c6fcb263dB04586Ad59177CAc";//fake WETH which has pair on honeyswap tp test with





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

  const uniswapV2Router02 = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77";
  const LemmaHoneySwap = await hre.ethers.getContractFactory("LemmaHoneySwap");
  const lemmaHoneySwap = await LemmaHoneySwap.deploy(uniswapV2Router02);

  await lemmaHoneySwap.deployed();

  console.log("LemmaHoneySwap deployed to:", lemmaHoneySwap.address);


  const LemmaPerpetual = await hre.ethers.getContractFactory("LemmaPerpetual");
  const lemmaPerpetual = await LemmaPerpetual.deploy(perpMetadata.layers.layer2.contracts.ClearingHouse.address, perpMetadata.layers.layer2.contracts.ETHUSDC.address, collateral);

  await lemmaPerpetual.deployed();

  console.log("LemmaPerpetual deployed to:", lemmaPerpetual.address);

  const LemmaToken = await hre.ethers.getContractFactory("LemmaToken");
  const lemmaToken = await LemmaToken.deploy(collateral, underlyingAsset, lemmaPerpetual.address, lemmaHoneySwap.address);

  await lemmaToken.deployed();

  // await lemmaToken.initlialize();


  await lemmaHoneySwap.setLemmaToken(lemmaToken.address);
  await lemmaPerpetual.setLemmaToken(lemmaToken.address);



  console.log(await lemmaToken.name());
  console.log("LemmaToken deployed to:", lemmaToken.address);

  //Do the things

  const usdc = lemmaToken.attach(collateral);
  await usdc.approve(lemmaToken.address, constants.MaxUint256);

  const theAccount = await lemmaHoneySwap.owner();
  console.log((await usdc.balanceOf(theAccount)).toString());

  // console.log(hre.network);
  tokenTransfers.setCurrentProvider(hre.network.provider);

  let tx = await lemmaToken.mint(1000000);
  tx.wait();
  // // tx = await lemmaToken.mint(1000000);
  // // tx.wait();


  // await tokenTransfers.print(tx.hash);

  // tx = await lemmaToken.redeem(1000000);
  // tx.wait();

  // await tokenTransfers.print(tx.hash);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
