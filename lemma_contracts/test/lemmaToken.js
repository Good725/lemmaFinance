const { artifacts, web3, assert } = require("hardhat");
const LemmaHoneySwap = artifacts.require("LemmaHoneySwap");
const LemmaPerpetual = artifacts.require("LemmaPerpetual");
const LemmaToken = artifacts.require("LemmaToken");
const USDC_ABI = require('../abis/Usdc_abi.json');
const UNISWAP_ABI = require('../abis/Uniswap_abi.json');

contract("LemmaToken", accounts => {
  const clearingHouseAddress = "0xd1ab46526D555285E9b61f066B7673bb9b9B51b6";
  const clearingHouseViewerAddress = "0x2b53BA3d842F76e4D96FecEA77d345d237680E2e";
  const ammAddress = "0xF75C8c9EADBCA5D26dA43466aD5Be511Cb281668";
  const usdcAddress = "0xe0B887D54e71329318a036CF50f30Dbe4444563c";
  const WETHAddress = "0x359eaF429cd6114c6fcb263dB04586Ad59177CAc";
  const uniswapV2Router02 = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77";

  let LemmaHoneySwapContract;
  let LemmaPerpetualContract;
  let uniswap;
  let usdc;
  let LemmaTokenContract;

  before(async function () {
    LemmaHoneySwapContract = await LemmaHoneySwap.new(uniswapV2Router02);
    LemmaPerpetualContract = await LemmaPerpetual.new(clearingHouseAddress, clearingHouseViewerAddress, ammAddress, usdcAddress);
    usdc = new web3.eth.Contract(USDC_ABI, "0xe0B887D54e71329318a036CF50f30Dbe4444563c");
    uniswap = new web3.eth.Contract(UNISWAP_ABI, "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77");
  });

  it("Deploy LemmaToken", async function () {
    LemmaTokenContract = await LemmaToken.new(usdcAddress, WETHAddress, LemmaPerpetualContract.address, LemmaHoneySwapContract.address);
    assert.equal(await LemmaTokenContract.name(), "LemmaUSDT");
    assert.equal(await LemmaTokenContract.symbol(), "LUSDT");
  });



  it("Set LemmaToken on LemmaPerpetual", async function () {
    await LemmaPerpetualContract.setLemmaToken(LemmaTokenContract.address, { from: accounts[0] });
    assert.equal(await LemmaPerpetualContract.lemmaToken(), LemmaTokenContract.address);
  });

  it("Mint LemmaToken", async function () {
    let amountDeposit = web3.utils.toBN(10 * 10 ** 6);
    await LemmaPerpetualContract.setLemmaToken(LemmaTokenContract.address, { from: accounts[0] });
    await LemmaHoneySwapContract.setLemmaToken(LemmaTokenContract.address, { from: accounts[0] });
    await usdc.methods.approve(LemmaTokenContract.address, amountDeposit).send({ from: accounts[0], gas: 3000000, gasPrice: web3.utils.toWei("1", "gwei") });
    await LemmaTokenContract.mint(amountDeposit, { from: accounts[0] });
  });

  it("Redeem LemmaToken", async function () {
    let amountRedeem = web3.utils.toBN(10 * 10 ** 18);
    await LemmaPerpetualContract.setLemmaToken(LemmaTokenContract.address, { from: accounts[0] });
    await LemmaHoneySwapContract.setLemmaToken(LemmaTokenContract.address, { from: accounts[0] });
    await LemmaTokenContract.redeem(amountRedeem, { from: accounts[0] });
  });
});