// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fetch = require("cross-fetch");
const { constants } = require("ethers");
const { defaultAccounts } = require("@ethereum-waffle/provider");
const CHViewerArtifact = require("@perp/contract/build/contracts/src/ClearingHouseViewer.sol/ClearingHouseViewer.json");
const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');



const tokenTransfers = require("truffle-token-test-utils");//just to visulize token transfers in a transaction
const { upgrades } = require("hardhat");


async function main() {
  const provider = new ethers.providers.Web3Provider(hre.network.provider);
  tokenTransfers.setCurrentProvider(provider);
  const signer = await ethers.getSigner();

  let tx;
  const perpMetadataUrl = "https://metadata.perp.exchange/staging.json";
  const perpMetadata = await fetch(perpMetadataUrl).then(res => res.json());


  // console.log(perpMetadata);

  const collateral = perpMetadata.layers.layer2.externalContracts.usdc;//USDC
  const underlyingAsset = "0x359eaF429cd6114c6fcb263dB04586Ad59177CAc";//fake WETH which has pair on honeyswap tp test with

  let contractNames = {};





  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  const uniswapV2Router02 = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77";
  const WETH_USDC_Pair = "0xa7354668dA742BB39119546D8f160561847fBDdD";
  const clearingHouseAddress = perpMetadata.layers.layer2.contracts.ClearingHouse.address;
  const insuranceFundAddress = perpMetadata.layers.layer2.contracts.InsuranceFund.address;

  const LemmaHoneySwap = await hre.ethers.getContractFactory("LemmaHoneySwap");
  const lemmaHoneySwap = await upgrades.deployProxy(LemmaHoneySwap, [uniswapV2Router02], { initializer: 'initialize' });

  const usdcRinkeby = perpMetadata.layers.layer1.externalContracts.usdc;
  // const usdcRinkeby = "0xc7ad46e0b8a400bb3c915120d284aafba8fc4735";
  const wethRinkeby = "0xc778417e063141139fce010982780140aa0cd5ab";
  const ambBridgeOnEth = perpMetadata.layers.layer1.externalContracts.ambBridgeOnEth;
  const multiTokenMediatorOnEth = perpMetadata.layers.layer1.externalContracts.multiTokenMediatorOnEth;
  const uniswapV2Router02Rinkbey = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
  const lemmaXDAI = "0x40e414bff6543f937832e86a41de41e2df4530fc";

  const ambBridgeOnXDai = "0xc38D4991c951fE8BCE1a12bEef2046eF36b0FA4A";
  const multiTokenMediatorOnXDai = "0xA34c65d76b997a824a5E384471bBa73b0013F5DA";

  const lemmaMainnet = constants.AddressZero;

  // const LemmaMainnet = await hre.ethers.getContractFactory("LemmaMainnet");
  // const lemmaMainnet = await LemmaMainnet.deploy(usdcRinkeby, wethRinkeby, lemmaXDAI, uniswapV2Router02Rinkbey, ambBridgeOnEth, multiTokenMediatorOnEth);

  // await lemmaMainnet.deployed();
  // // console.log(lemmaMainnet.address);

  // tx = await lemmaMainnet.deposit(0, { value: ethers.utils.parseUnits("0.5", "ether") });
  // tx.wait();
  // await tokenTransfers.print(tx.hash, {});

  // const USDCRinkeby = new ethers.Contract(usdcRinkeby, TEST_USDC_ABI, signer);
  // console.log((await USDCRinkeby.balanceOf(signer.address)).toString());
  // tx = await USDCRinkeby.approve(lemmaMainnet.address, constants.MaxUint256);
  // tx.wait();

  // console.log((await USDCRinkeby.allowance(signer.address, lemmaMainnet.address)).toString());
  // tx = await lemmaMainnet.deposit(100000, 0);
  // tx.wait();


  // const LemmaHoneySwap = await hre.ethers.getContractFactory("LemmaHoneySwap");
  // const lemmaHoneySwap = await LemmaHoneySwap.deploy(uniswapV2Router02);
  const chViewerAddr = perpMetadata.layers.layer2.contracts.ClearingHouseViewer.address;
  const ammAddress = perpMetadata.layers.layer2.contracts.ETHUSDC.address;

  const LemmaPerpetual = await hre.ethers.getContractFactory("LemmaPerpetual");
  const lemmaPerpetual = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, chViewerAddr, ammAddress, collateral], { initializer: 'initialize' });
  console.log(lemmaPerpetual);
  await lemmaPerpetual.deployed();


  const LemmaToken = await hre.ethers.getContractFactory("LemmaToken");
  const lemmaToken = await upgrades.deployProxy(LemmaToken, [collateral, underlyingAsset, lemmaPerpetual.address, constants.AddressZero, ambBridgeOnXDai, multiTokenMediatorOnXDai, constants.AddressZero], { initializer: 'initialize' });

  await lemmaToken.deployed();

  console.log(lemmaToken.name());


  // // await lemmaToken.initlialize();


  // await lemmaHoneySwap.setLemmaToken(lemmaToken.address);
  // await lemmaPerpetual.setLemmaToken(lemmaToken.address);



  // console.log(await lemmaToken.name());
  // console.log("LemmaToken deployed to:", lemmaToken.address);

  // //Do the things

  // const usdc = lemmaToken.attach(collateral);
  // await usdc.approve(lemmaToken.address, constants.MaxUint256);

  // const theAccount = await lemmaHoneySwap.owner();
  // console.log(("usdc balanceOf: ", await usdc.balanceOf(theAccount)).toString());

  // // console.log(hre.network);

  // contractNames["0x1C232F01118CB8B424793ae03F870aa7D0ac7f77"] = "uniswapV2Router02";
  // contractNames[lemmaHoneySwap.address] = "lemmaHoneySwap";
  // contractNames[lemmaPerpetual.address] = "lemmaPerpetual";
  // contractNames[lemmaToken.address] = "lemmaToken";
  // contractNames[clearingHouseAddress] = "ClearingHouse";
  // contractNames[WETH_USDC_Pair] = "WETH_USDC_PAIR";
  // contractNames[insuranceFundAddress] = "Perpetual Insurance Fund";
  // // console.log(contractNames);
  // try {
  //   let tx = await lemmaToken.mint(1000000);
  //   tx.wait();

  //   await tokenTransfers.print(tx.hash, contractNames);

  //   tx = await lemmaToken.mint(500000);
  //   tx.wait();

  //   await tokenTransfers.print(tx.hash, contractNames);

  //   tx = await lemmaToken.redeem(ethers.utils.parseUnits("0.5", "ether"));//1 * 10^18
  //   tx.wait();
  //   await tokenTransfers.print(tx.hash, contractNames);



  //   tx = await lemmaToken.redeem(ethers.utils.parseUnits("1", "ether"));
  //   tx.wait();
  //   await tokenTransfers.print(tx.hash, contractNames);
  // } catch (e) {
  //   console.log(e);
  // }
  // finally {
  //   console.log("USDC balances at the end");
  //   console.log("lemmaToken :", (await usdc.balanceOf(lemmaToken.address)).toString());
  //   console.log("lemmaPerpetual :", (await usdc.balanceOf(lemmaPerpetual.address)).toString());
  //   console.log("lemmaHoneySwap :", (await usdc.balanceOf(lemmaHoneySwap.address)).toString());

  //   console.log("WETH balance at the end");
  //   const weth = usdc.attach(underlyingAsset);
  //   console.log("lemmaHoneySwap :", (await weth.balanceOf(lemmaHoneySwap.address)).toString());
  //   console.log("lemmaToken :", (await weth.balanceOf(lemmaToken.address)).toString());




  //   const clearingHouseViewer = new ethers.Contract(chViewerAddr, CHViewerArtifact.abi, provider);
  //   const position = await clearingHouseViewer.getPersonalPositionWithFundingPayment(
  //     ammAddress,
  //     lemmaPerpetual.address,
  //   );
  //   console.log("position of lemmaPerpetual: size", position.size.d.toString());
  //   console.log("position of lemmaPerpetual: margin", position.margin.d.toString());
  //   console.log("position of lemmaPerpetual: openNotional", position.openNotional.d.toString());
  //   console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", position.lastUpdatedCumulativePremiumFraction.d.toString());
  //   console.log("position of lemmaPerpetual: liquidityHistoryIndex", position.liquidityHistoryIndex.toString());

  // }
  // // tx = await lemmaToken.redeem(1000000);
  // // tx.wait();


  // // await tokenTransfers.print(tx.hash, contractNames);

}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
