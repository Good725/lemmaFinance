const { artifacts, web3, assert } = require("hardhat");
const LemmaHoneySwap = artifacts.require("LemmaHoneySwap");
const LemmaPerpetual = artifacts.require("LemmaPerpetual");
const LemmaToken = artifacts.require("LemmaToken");
const UNISWAP_ABI = require('../abis/Uniswap_abi.json');
const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');

contract("LemmaToken", accounts => {
  const clearingHouseAddress = "0xd1ab46526D555285E9b61f066B7673bb9b9B51b6";
  const clearingHouseViewerAddress = "0x2b53BA3d842F76e4D96FecEA77d345d237680E2e";
  const ammAddress = "0xF75C8c9EADBCA5D26dA43466aD5Be511Cb281668";
  const testusdcAddress = "0xe0B887D54e71329318a036CF50f30Dbe4444563c";
  const uniswapV2Router02 = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77";
  const WETHAddress = "0x359eaF429cd6114c6fcb263dB04586Ad59177CAc";

  let LemmaHoneySwapContract;
  let LemmaPerpetualContract;
  let uniswap;
  let testusdc;
  let LemmaTokenContract;

  before(async function () {
    LemmaHoneySwapContract = await LemmaHoneySwap.new(uniswapV2Router02);
    LemmaPerpetualContract = await LemmaPerpetual.new(clearingHouseAddress, clearingHouseViewerAddress, ammAddress, testusdcAddress);
    testusdc = new web3.eth.Contract(TEST_USDC_ABI, testusdcAddress);
    uniswap = new web3.eth.Contract(UNISWAP_ABI, "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77");
  });

  it("Deploy LemmaToken", async function () {
    LemmaTokenContract = await LemmaToken.new(testusdcAddress, WETHAddress, LemmaPerpetualContract.address, LemmaHoneySwapContract.address);
    assert.equal(await LemmaTokenContract.name(), "LemmaUSDT");
    assert.equal(await LemmaTokenContract.symbol(), "LUSDT");
  });

  it("Set LemmaToken on LemmaPerpetual", async function () {
    await LemmaPerpetualContract.setLemmaToken(LemmaTokenContract.address, { from: accounts[0] });
    assert.equal(await LemmaPerpetualContract.lemmaToken(), LemmaTokenContract.address);
  });

  it("Set LemmaToken on LemmaHoneySwap", async function () {
    await LemmaHoneySwapContract.setLemmaToken(LemmaTokenContract.address, { from: accounts[0] });
    assert.equal(await LemmaHoneySwapContract.lemmaToken(), LemmaTokenContract.address);
  });

  it("Mint LemmaToken", async function () {
    let amountDeposit = web3.utils.toBN(1 * 10 ** 6);
    let test_usdc_balance_1 = await testusdc.methods.balanceOf(accounts[0]).call();
    await testusdc.methods.approve(LemmaTokenContract.address, amountDeposit).send({ from: accounts[0], gas: 3000000, gasPrice: web3.utils.toWei("1", "gwei") });
    await LemmaTokenContract.mint(amountDeposit, { from: accounts[0] });
    let test_usdc_balance_1_afterMint = await testusdc.methods.balanceOf(accounts[0]).call();
    assert.equal(test_usdc_balance_1_afterMint, test_usdc_balance_1 - amountDeposit);
  });

  it("Redeem LemmaToken", async function () {
    let amountRedeem = web3.utils.toBN(1 * 10 ** 18);
    let test_usdc_balance_1 = await testusdc.methods.balanceOf(accounts[0]).call();
    await LemmaTokenContract.redeem(amountRedeem, { from: accounts[0] });
    let test_usdc_balance_1_afterRedeem = await testusdc.methods.balanceOf(accounts[0]).call();
    assert(test_usdc_balance_1_afterRedeem > test_usdc_balance_1);
  });
});