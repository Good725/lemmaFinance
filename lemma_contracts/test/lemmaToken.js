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
  const usdcAddress = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83";
  const wxdaiAddress = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d";
  const uniswapV2Router02 = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77";
  
  let LemmaHoneySwapContract;
  let LemmaPerpetualContract;
  let uniswap;
  let usdc;
  let LemmaTokenContract;

  before(async function () {
    LemmaHoneySwapContract = await LemmaHoneySwap.new(uniswapV2Router02);
    LemmaPerpetualContract = await LemmaPerpetual.new(clearingHouseAddress, clearingHouseViewerAddress, ammAddress, usdcAddress);
    usdc = new web3.eth.Contract(USDC_ABI, "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83");
    uniswap = new web3.eth.Contract(UNISWAP_ABI, "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77");
  });

  it("Deploy LemmaToken", async function() {
    LemmaTokenContract = await LemmaToken.new(usdcAddress, wxdaiAddress, LemmaPerpetualContract.address, LemmaHoneySwapContract.address);
    assert.equal(await LemmaTokenContract.name(), "LemmaUSDT");
    assert.equal(await LemmaTokenContract.symbol(), "LUSDT");
  });

  it("Get 10 USDC to account1", async function() {
    let amountDeposit = web3.utils.toBN(10 * 10 ** 6);
    await uniswap.methods.swapETHForExactTokens(amountDeposit.toString(), [wxdaiAddress, usdcAddress], accounts[1], '9600952122').send({from: accounts[1], value: web3.utils.toWei("20", "ether"), gas: 3000000, gasPrice: web3.utils.toWei("1", "gwei")});
    let usdc_account_1 = await usdc.methods.balanceOf(accounts[1]).call();
    assert.equal(amountDeposit, usdc_account_1);
  });

  it("Set LemmaToken on LemmaPerpetual", async function() {
    await LemmaPerpetualContract.setLemmaToken(LemmaTokenContract.address, {from: accounts[0]});
    assert.equal(await LemmaPerpetualContract.lemmaToken(), LemmaTokenContract.address);
  });

  it("Mint LemmaToken", async function() {
    let  amountDeposit = web3.utils.toBN(10 * 10 ** 6);
    await usdc.methods.approve(LemmaTokenContract.address, amountDeposit).send({from:accounts[1], gas: 3000000, gasPrice: web3.utils.toWei("1", "gwei")});
    await LemmaTokenContract.mint(amountDeposit, {from: accounts[1]});
  });

  it("Redeem LemmaToken", async function() {
    let amountRedeem = web3.utils.toBN(5 * 10 ** 6);
    await LemmaTokenContract.redeem(amountRedeem, {from: accounts[1]});
  });
})