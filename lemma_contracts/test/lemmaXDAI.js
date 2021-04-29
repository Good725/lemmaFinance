const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');
const { assert } = require("chai");
contract("LemmaToken", accounts => {
    let LemmaPerpetualContract;
    let LemmaTokenContract;
    const collateral = "0xe0B887D54e71329318a036CF50f30Dbe4444563c";
    const ambBridgeOnXDai = "0xc38D4991c951fE8BCE1a12bEef2046eF36b0FA4A";
    const multiTokenMediatorOnXDai = "0xA34c65d76b997a824a5E384471bBa73b0013F5DA";
    const trustedForwaderXDAI = "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8";
    const lemmaMainnet = "0xFE17F35aED616212B7670a2A73ABB674F9FAcEb0";

    const clearingHouseAddress = "0xd1ab46526D555285E9b61f066B7673bb9b9B51b6";
    const clearingHouseViewerAddress = "0x2b53BA3d842F76e4D96FecEA77d345d237680E2e";
    const ammAddress = "0xF75C8c9EADBCA5D26dA43466aD5Be511Cb281668";
    const testusdcAddress = "0xe0B887D54e71329318a036CF50f30Dbe4444563c";
    const zeroAddress = "0x0000000000000000000000000000000000000000";

    let ambBridgeContract;

    before(async function () {
        accounts = await ethers.getSigners();
        const LemmaToken = await ethers.getContractFactory("LemmaToken");
        const LemmaPerpetual = await ethers.getContractFactory("LemmaPerpetual");
        const AMBBridge = await ethers.getContractFactory("MockAMB");

        ambBridgeContract = await upgrades.deployProxy(AMBBridge, [], { initializer: 'initialize' });
        // console.log(ambBridgeContract.address);
        
        LemmaPerpetualContract = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ammAddress, testusdcAddress], { initializer: 'initialize' });
        // console.log(LemmaPerpetualContract.address);
        LemmaTokenContract = await upgrades.deployProxy(LemmaToken, [collateral, LemmaPerpetualContract.address, ambBridgeContract.address, multiTokenMediatorOnXDai, trustedForwaderXDAI], { initializer: 'initialize' });
        // console.log(LemmaTokenContract.address);
        testusdc = new ethers.Contract(testusdcAddress, TEST_USDC_ABI, accounts[0]);
    });

    it("Set LemmaMainnet on xdai contract", async function() {
        await LemmaTokenContract.connect(accounts[0]).setLemmaMainnet(lemmaMainnet);
    });

    it("Set LemmaMainnet on perpetual contract", async function() {
        await LemmaPerpetualContract.setLemmaToken(LemmaTokenContract.address);
        // console.log(await LemmaPerpetualContract.lemmaToken());
        // console.log(LemmaTokenContract.address);
        assert.equal(await LemmaPerpetualContract.lemmaToken(), LemmaTokenContract.address);
    });

    it("Only ambBridge contract can call setDepositInfo function", async function() {
        let depositUSDCAmountOut = BigNumber.from(2 * 10 ** 6);
        try {
            await LemmaTokenContract.connect(accounts[0]).setDepositInfo(accounts[0].address, depositUSDCAmountOut);
        }
        catch (error) {
            assert(error.message, "VM Exception while processing transaction: revert not ambBridge");
        }
    });

    it("Can not deposit if ambBridge's messageSender() is not the same as lemmaMainnet", async function() {
        let depositUSDCAmountOut = BigNumber.from(2 * 10 ** 6);
        await ambBridgeContract.setXDAIContract(LemmaTokenContract.address);
        try {
            await ambBridgeContract.setDepositInfo(accounts[0].address, depositUSDCAmountOut);
        }
        catch (error) {
            assert(error.message, "VM Exception while processing transaction: revert ambBridge's messageSender is not lemmaMainnet");
        }
    });

    it("Set xdai and mainnet contract on AMB", async function() {
        await ambBridgeContract.setMainnetContract(lemmaMainnet);
    });

    it("Set gasLimit", async function() {
        await LemmaTokenContract.connect(accounts[0]).setGasLimit(1000000);
    });

    it("Set Deposit", async function() {
        let minimumUSDCAmountOut = BigNumber.from(2 * 10 ** 6);
        let test_usdc_balance_1 = await testusdc.balanceOf(accounts[1].address);
        // console.log(test_usdc_balance_1.toString());
        
        let  amountTransfer = BigNumber.from(5 * 10 ** 6);
        await testusdc.connect(accounts[1]).approve(LemmaTokenContract.address, amountTransfer);
        await testusdc.connect(accounts[1]).transfer(LemmaTokenContract.address, amountTransfer);
        // let test_usdc_contract_balance_1 = await testusdc.balanceOf(LemmaTokenContract.address);
        // console.log(test_usdc_contract_balance_1.toString());
        await ambBridgeContract.setDepositInfo(accounts[1].address, minimumUSDCAmountOut);
        let test_usdc_balance_2 = await testusdc.balanceOf(accounts[1].address);

        assert.equal(test_usdc_balance_2, test_usdc_balance_1 - amountTransfer);

        let lemmaBalance = await LemmaTokenContract.balanceOf(accounts[1].address);
        // console.log(lemmaBalance.toString());
    });

    it("Deposit in the case of existing totalSupply", async function() {
        let minimumUSDCAmountOut_2 = BigNumber.from(2 * 10 ** 6);
        await ambBridgeContract.setDepositInfo(accounts[1].address, minimumUSDCAmountOut_2);
    }); 

    it("Can not mint more amount than the contract's balance", async function() {
        let minimumUSDCAmount = BigNumber.from(10 * 10 ** 6);
        let test_usdc_balance_beforeDeposit = await testusdc.balanceOf(accounts[1].address);
        await ambBridgeContract.setDepositInfo(accounts[1].address, minimumUSDCAmount);
        let test_usdc_balance_afterDeposit = await testusdc.balanceOf(accounts[1].address);
        assert(test_usdc_balance_beforeDeposit, test_usdc_balance_afterDeposit);
    });

    it("Can not withdraw LemmaToken before setting lemmaMainnet", async function() {
        await LemmaTokenContract.connect(accounts[0]).setLemmaMainnet(zeroAddress);
        let amountWithdraw_1 = BigNumber.from(1e18.toString());
        let lemmabalanceBeforeWithdraw_1 = await LemmaTokenContract.balanceOf(accounts[1].address);

        let test_usdc_balance_before_withdraw = await testusdc.balanceOf(accounts[1].address);
        // console.log(test_usdc_balance_before_withdraw.toString());
        try {
            await LemmaTokenContract.connect(accounts[1]).withdraw(amountWithdraw_1);
        } catch (error) {
            assert(error.message, "VM Exception while processing transaction: revert receiver is empty");
        };
    });

    it("Withdraw LemmaToken", async function() {
        await LemmaTokenContract.connect(accounts[0]).setLemmaMainnet(lemmaMainnet);
        let amountWithdraw = BigNumber.from(1e18.toString());
        let lemmabalanceBeforeWithdraw = await LemmaTokenContract.balanceOf(accounts[1].address);

        let test_usdc_balance_before_withdraw = await testusdc.balanceOf(accounts[1].address);
        // console.log(test_usdc_balance_before_withdraw.toString());

        await LemmaTokenContract.connect(accounts[1]).withdraw(amountWithdraw);

        let test_usdc_balance_after_withdraw = await testusdc.balanceOf(accounts[1].address);
        // console.log(test_usdc_balance_after_withdraw.toString());

        let lemmabalanceAfterWithdraw = await LemmaTokenContract.balanceOf(accounts[1].address);
        assert.equal(lemmabalanceAfterWithdraw, lemmabalanceBeforeWithdraw - amountWithdraw)
    });
  });