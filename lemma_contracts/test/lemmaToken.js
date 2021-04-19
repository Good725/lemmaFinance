const { artifacts, web3, assert, ethers } = require("hardhat");
// const LemmaHoneySwap = artifacts.require("LemmaHoneySwap");
// const LemmaPerpetual = artifacts.require("LemmaPerpetual");
// const LemmaToken = artifacts.require("LemmaToken");
const UNISWAP_ABI = require('../abis/Uniswap_abi.json');
const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');
const { BigNumber } = require("ethers");

contract("LemmaToken", accounts => {
  const clearingHouseAddress = "0xd1ab46526D555285E9b61f066B7673bb9b9B51b6";
  const clearingHouseViewerAddress = "0x2b53BA3d842F76e4D96FecEA77d345d237680E2e";
  const ammAddress = "0xF75C8c9EADBCA5D26dA43466aD5Be511Cb281668";
  const testusdcAddress = "0xe0B887D54e71329318a036CF50f30Dbe4444563c";
  const uniswapV2Router02 = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77";
  const WETHAddress = "0x359eaF429cd6114c6fcb263dB04586Ad59177CAc";
  
  let LemmaHoneySwap;
  let LemmaPerpetual;
  let LemmaToken;
  let LemmaHoneySwapContract;
  let LemmaPerpetualContract;
  // let uniswap;
  let testusdc;
  let LemmaTokenContract;

  before(async function () {
    accounts = await ethers.getSigners();
    LemmaHoneySwap = await ethers.getContractFactory("LemmaHoneySwap");
    LemmaPerpetual = await ethers.getContractFactory("LemmaPerpetual");
    LemmaToken = await ethers.getContractFactory("LemmaToken");
    LemmaHoneySwapContract = await upgrades.deployProxy(LemmaHoneySwap, [uniswapV2Router02], { initializer: 'initialize' });
    LemmaPerpetualContract = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ammAddress, testusdcAddress], { initializer: 'initialize' });
    // testusdc = new web3.eth.Contract(TEST_USDC_ABI, testusdcAddress);
    testusdc = new ethers.Contract(testusdcAddress, TEST_USDC_ABI, accounts[0]);
    // uniswap = new web3.eth.Contract(UNISWAP_ABI, "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77");
  });

  it("Deploy LemmaToken", async function() {
    // LemmaTokenContract = await LemmaToken.new(testusdcAddress, WETHAddress, LemmaPerpetualContract.address, LemmaHoneySwapContract.address);
    LemmaTokenContract = await upgrades.deployProxy(LemmaToken, [testusdcAddress, WETHAddress, LemmaPerpetualContract.address, LemmaHoneySwapContract.address], { initializer: 'initialize' });
    assert.equal(await LemmaTokenContract.name(), "LemmaUSDT");
    assert.equal(await LemmaTokenContract.symbol(), "LUSDT");
  });

  it("Set LemmaToken on LemmaPerpetual", async function() {
    await LemmaPerpetualContract.setLemmaToken(LemmaTokenContract.address, {from: accounts[0].address});
    console.log(await LemmaPerpetualContract.lemmaToken());
    console.log(LemmaTokenContract.address);
    assert.equal(await LemmaPerpetualContract.lemmaToken(), LemmaTokenContract.address);
  });

  it("Set LemmaToken on LemmaHoneySwap", async function() {
    await LemmaHoneySwapContract.setLemmaToken(LemmaTokenContract.address, {from: accounts[0].address});
    assert.equal(await LemmaHoneySwapContract.lemmaToken(), LemmaTokenContract.address);
  });

  it("Mint LemmaToken", async function() {
    let  amountDeposit = BigNumber.from(1 * 10 ** 6);
    let test_usdc_balance_1 = await testusdc.balanceOf(accounts[1].address);
    await testusdc.connect(accounts[1]).approve(LemmaTokenContract.address, amountDeposit);
    await LemmaTokenContract.connect(accounts[1]).mint(amountDeposit);
    let test_usdc_balance_1_afterMint = await testusdc.balanceOf(accounts[1].address);
    assert.equal(test_usdc_balance_1_afterMint, test_usdc_balance_1 - amountDeposit);
  });

  it("Redeem LemmaToken", async function() {
    let amountRedeem = BigNumber.from(1e18.toString());
    let test_usdc_balance_1 = await testusdc.balanceOf(accounts[1].address);
    await LemmaTokenContract.connect(accounts[1]).redeem(amountRedeem);
    let test_usdc_balance_1_afterRedeem = await testusdc.balanceOf(accounts[1].address);
    assert(test_usdc_balance_1_afterRedeem > test_usdc_balance_1);
  });
});