const { ethers } = require("hardhat");
const hre = require("hardhat");
const { BigNumber } = require("ethers");
const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');
const { expect } = require("chai");
const { EventEmitter } = require("events");
const addresses = require("../addresses.json");

contract("LemmaXDAI", accounts => {

    let LemmaPerpetualContract;
    let LemmaXDAIContract;
    const ambBridgeOnXDai = addresses.perpMainnetXDAI.layers.layer2.externalContracts.ambBridgeOnXDai;
    const multiTokenMediatorOnXDai = addresses.perpMainnetXDAI.layers.layer2.externalContracts.multiTokenMediatorOnXDai;
    const trustedForwaderXDAI = addresses.xdai.trustedForwarder;
    const lemmaMainnet = addresses.rinkeby.lemmaMainnet;

    const clearingHouseAddress = addresses.perpMainnetXDAI.layers.layer2.contracts.ClearingHouse.address;
    const clearingHouseViewerAddress = addresses.perpMainnetXDAI.layers.layer2.contracts.ClearingHouseViewer.address;
    const ammAddress = addresses.perpMainnetXDAI.layers.layer2.contracts.ETHUSDC.address;
    const testusdcAddress = addresses.perpMainnetXDAI.layers.layer2.externalContracts.usdc;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const myEmitter = new EventEmitter();
    let ambBridgeContract;
    let impersonate_account;

    before(async function () {
        accounts = await ethers.getSigners();
        const LemmaXDAI = await ethers.getContractFactory("LemmaToken");
        const LemmaPerpetual = await ethers.getContractFactory("LemmaPerpetual");
        const AMBBridge = await ethers.getContractFactory("MockLemmaXdaiAMB");

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x1A48776f436bcDAA16845A378666cf4BA131eb0F"]
        });
        impersonate_account = await ethers.provider.getSigner("0x1A48776f436bcDAA16845A378666cf4BA131eb0F");
        await accounts[0].sendTransaction({ to: impersonate_account._address, value: ethers.utils.parseEther("2") });

        ambBridgeContract = await upgrades.deployProxy(AMBBridge, [], { initializer: 'initialize' });
        LemmaPerpetualContract = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ammAddress, testusdcAddress], { initializer: 'initialize' });
        LemmaXDAIContract = await upgrades.deployProxy(LemmaXDAI, [testusdcAddress, LemmaPerpetualContract.address, ambBridgeContract.address, multiTokenMediatorOnXDai, trustedForwaderXDAI], { initializer: 'initialize' });

        await LemmaPerpetualContract.setLemmaToken(LemmaXDAIContract.address);
        await LemmaXDAIContract.setLemmaMainnet(lemmaMainnet);
        await ambBridgeContract.setXDAIContract(LemmaXDAIContract.address);
        await ambBridgeContract.setMainnetContract(lemmaMainnet);

        testusdc = new ethers.Contract(testusdcAddress, TEST_USDC_ABI, accounts[0]);
        this.clearingHouse = await ethers.getContractAt("IClearingHouse", clearingHouseAddress);
        this.amm = await ethers.getContractAt("IAmm", ammAddress);
        this.clearingHouseViewer = await ethers.getContractAt("IClearingHouseViewer", clearingHouseViewerAddress);
    });
    const getAmountToOpenPositionWith = (amount, tollRatio, spreadRatio) => {
        return (amount.mul(ONE)).div(ONE.add(tollRatio.add(spreadRatio)));
    };
    const convertWeiAmountToUSDC = (amount) => {
        //(amount ) / 10^18-6
        return (amount).div(ethers.BigNumber.from("10").pow(ethers.BigNumber.from("12")));
    };

    const convertUSDCAmountInWei = (amount) => {
        //amount * 10^18-6
        return amount.mul(ethers.BigNumber.from("10").pow(ethers.BigNumber.from("12")));
    };

    // it("Set LemmaMainnet on xdai contract", async function() {
    //     await LemmaXDAIContract.connect(accounts[0]).setLemmaMainnet(lemmaMainnet);
    //     expect(await LemmaXDAIContract.lemmaMainnet()).to.equal(lemmaMainnet);
    // });

    // it("Set LemmaMainnet on perpetual contract", async function() {
    //     await LemmaPerpetualContract.setLemmaXDAI(LemmaXDAIContract.address);
    //     expect(await LemmaPerpetualContract.LemmaXDAI()).to.equal(LemmaXDAIContract.address);
    // });

    // it("Only ambBridge contract can call setDepositInfo function", async function() {
    //     let depositUSDCAmountOut = BigNumber.from(2 * 10 ** 6);
    //     try {
    //         await LemmaXDAIContract.connect(accounts[0]).setDepositInfo(accounts[0].address, depositUSDCAmountOut);
    //     }
    //     catch (error) {
    //         expect(error.message).to.equal("VM Exception while processing transaction: revert not ambBridge");
    //     }
    // });

    // it("Can not deposit if ambBridge's messageSender() is not the same as lemmaMainnet", async function() {
    //     let depositUSDCAmountOut = BigNumber.from(2 * 10 ** 6);
    //     await ambBridgeContract.setXDAIContract(LemmaXDAIContract.address);
    //     try {
    //         await ambBridgeContract.setDepositInfo(accounts[0].address, depositUSDCAmountOut);
    //     }
    //     catch (error) {
    //         expect(error.message).to.equal("VM Exception while processing transaction: revert ambBridge's messageSender is not lemmaMainnet");
    //     }
    // });

    // it("Set xdai and mainnet contract on AMB", async function() {
    //     await ambBridgeContract.setMainnetContract(lemmaMainnet);
    //     expect(await ambBridgeContract.mainnetContract()).to.equal(lemmaMainnet);
    // });

    // it("Set gasLimit", async function() {
    //     await LemmaXDAIContract.connect(accounts[0]).setGasLimit(1000000);
    //     expect(await LemmaXDAIContract.gasLimit()).to.equal(1000000);
    // });

    // it("Set Deposit", async function() {
    //     let minimumUSDCAmountOut = BigNumber.from(1 * 10 ** 6);
    //     await accounts[0].sendTransaction({to: impersonate_account._address, value: ethers.utils.parseEther("2")});

    //     let  amountTransfer = BigNumber.from(7 * 10 ** 6);
    //     let test_usdc_balance_1 = await testusdc.balanceOf(impersonate_account._address);

    //     await testusdc.connect(impersonate_account).approve(LemmaXDAIContract.address, amountTransfer);
    //     await testusdc.connect(impersonate_account).transfer(LemmaXDAIContract.address, amountTransfer);
    //     expect(await ambBridgeContract.setDepositInfo(impersonate_account._address, minimumUSDCAmountOut)).to.emit(LemmaXDAIContract, "DepositInfoAdded").withArgs(impersonate_account._address, minimumUSDCAmountOut);
    //     expect(await ambBridgeContract.setDepositInfo(impersonate_account._address, minimumUSDCAmountOut)).to.emit(LemmaXDAIContract, "USDCDeposited").withArgs(impersonate_account._address, minimumUSDCAmountOut);
    //     let test_usdc_balance_2 = await testusdc.balanceOf(impersonate_account._address);
    //     expect(test_usdc_balance_2).to.equal(test_usdc_balance_1 - amountTransfer);
    // });

    // it("Deposit in the case of existing totalSupply", async function() {
    //     let minimumUSDCAmountOut_2 = BigNumber.from(2 * 10 ** 6);
    //     let getTotalCollateral = await LemmaPerpetualContract.getTotalCollateral();
    //     let lemmaBalance_1 = await LemmaXDAIContract.balanceOf(impersonate_account._address);
    //     await ambBridgeContract.setDepositInfo(impersonate_account._address, minimumUSDCAmountOut_2);
    //     let lemmaBalance_2 = await LemmaXDAIContract.balanceOf(impersonate_account._address);
    //     let amount_mint = lemmaBalance_1 * minimumUSDCAmountOut_2 / getTotalCollateral;
    //     expect(lemmaBalance_2 / 10000).to.equal(lemmaBalance_1 / 10000 + amount_mint / 10000);
    // }); 

    // it("Can not mint more amount than the contract's balance", async function() {
    //     let minimumUSDCAmount = BigNumber.from(10 * 10 ** 6);
    //     let test_usdc_balance_beforeDeposit = await testusdc.balanceOf(impersonate_account._address);
    //     await ambBridgeContract.setDepositInfo(impersonate_account._address, minimumUSDCAmount);
    //     let test_usdc_balance_afterDeposit = await testusdc.balanceOf(impersonate_account._address);
    //     expect(test_usdc_balance_beforeDeposit).to.equal(test_usdc_balance_afterDeposit);
    // });

    // it("Can not withdraw LemmaXDAI before setting lemmaMainnet", async function() {
    //     await LemmaXDAIContract.connect(accounts[0]).setLemmaMainnet(zeroAddress);
    //     let amountWithdraw_1 = BigNumber.from(1e18.toString());

    //     try {
    //         await LemmaXDAIContract.connect(impersonate_account).withdraw(amountWithdraw_1);
    //     } catch (error) {BigNumber.from(2e18.toString());
    //         expect(error.message).to.equal("VM Exception while processing transaction: revert receiver is empty");
    //     };
    // });

    // it("Withdraw LemmaXDAI", async function() {
    //     await LemmaXDAIContract.connect(accounts[0]).setLemmaMainnet(lemmaMainnet);
    //     let amountWithdraw = BigNumber.from(1e18.toString());
    //     let lemmabalanceBeforeWithdraw = await LemmaXDAIContract.balanceOf(impersonate_account._address);
    //     await LemmaXDAIContract.connect(impersonate_account).withdraw(amountWithdraw);

    //     let test_usdc_balance_after_withdraw = await testusdc.balanceOf(LemmaXDAIContract.address);
    //     expect(test_usdc_balance_after_withdraw).to.equal(3000000);
    // });


    // it("should mint correctly", async function () {
    //     const usdcAmountToDeposit = ethers.utils.parseUnits("1", "6");
    //     const account = accounts[0].address;
    //     await ambBridgeContract.setDepositInfo(account, usdcAmountToDeposit);
    //     expect(await LemmaXDAIContract.depositInfo(account)).to.equal(usdcAmountToDeposit);

    //     await testusdc.connect(impersonate_account).transfer(LemmaXDAIContract.address, usdcAmountToDeposit);

    //     const positionBefore = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
    //         ammAddress,
    //         LemmaPerpetualContract.address,
    //     );
    //     await LemmaXDAIContract.mint(account);
    //     const positionAfter = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
    //         ammAddress,
    //         LemmaPerpetualContract.address,
    //     );

    //     console.log("position of lemmaPerpetual: size", positionBefore.size.d.toString());
    //     console.log("position of lemmaPerpetual: margin", positionBefore.margin.d.toString());
    //     console.log("position of lemmaPerpetual: openNotional", positionBefore.openNotional.d.toString());
    //     // console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionBefore.lastUpdatedCumulativePremiumFraction.d.toString());
    //     // console.log("position of lemmaPerpetual: liquidityHistoryIndex", positionBefore.liquidityHistoryIndex.toString());

    //     console.log("position of lemmaPerpetual: size", positionAfter.size.d.toString());
    //     console.log("position of lemmaPerpetual: margin", positionAfter.margin.d.toString());
    //     console.log("position of lemmaPerpetual: openNotional", positionAfter.openNotional.d.toString());
    //     // console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionAfter.lastUpdatedCumulativePremiumFraction.d.toString());
    //     // console.log("position of lemmaPerpetual: liquidityHistoryIndex", positionAfter.liquidityHistoryIndex.toString());


    //     console.log("underlyingAssetAmountByUser", (await LemmaXDAIContract.underlyingAssetAmountByUser(account)).toString());

    //     const underlyingAssetAmountByUser = await LemmaXDAIContract.underlyingAssetAmountByUser(account);
    //     const sizeDifference = positionAfter.size.d.sub(positionBefore.size.d);
    //     expect(underlyingAssetAmountByUser).to.equal(sizeDifference);
    //     // expect(await LemmaXDAIContract.balanceOf(account)).to.equal(convertUSDCAmountInWei(usdcAmountToDeposit));
    // });

    it("should Withdraw correctly", async function () {
        const provider = accounts[0].provider;
        const usdcAmountToDeposit = ethers.utils.parseUnits("1000", "6");
        const account = accounts[0].address;
        await ambBridgeContract.setDepositInfo(account, usdcAmountToDeposit);
        await testusdc.connect(impersonate_account).transfer(LemmaXDAIContract.address, usdcAmountToDeposit);
        const positionBefore = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );
        let tx = await LemmaXDAIContract.mint(account);
        const positionAfter = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );
        console.log(provider.connection.url);

        // let txReceipt = await provider.getTransactionReceipt(tx.hash);
        // console.log(txReceipt.logs);
        // console.log(LemmaXDAIContract.)


        console.log("position of lemmaPerpetual: size", positionBefore.size.d.toString());
        console.log("position of lemmaPerpetual: margin", positionBefore.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", positionBefore.openNotional.d.toString());
        console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionBefore.lastUpdatedCumulativePremiumFraction.d.toString());

        console.log("position of lemmaPerpetual: size", positionAfter.size.d.toString());
        console.log("position of lemmaPerpetual: margin", positionAfter.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", positionAfter.openNotional.d.toString());
        console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionAfter.lastUpdatedCumulativePremiumFraction.d.toString());



        console.log("underlyingAssetAmountByUser", (await LemmaXDAIContract.underlyingAssetAmountByUser(account)).toString());

        const underlyingAssetAmountByUser = await LemmaXDAIContract.underlyingAssetAmountByUser(account);
        const sizeDifference = positionAfter.size.d.sub(positionBefore.size.d);


        console.log((await provider.getBlock('latest')).timestamp);
        await hre.network.provider.request({
            method: "evm_increaseTime",
            params: [60 * 60]
        }
        );
        await hre.network.provider.request({
            method: "evm_mine",
        }
        );
        console.log((await provider.getBlock('latest')).timestamp);

        await this.clearingHouse.payFunding(ammAddress);

        const postionAfterGettingFunding = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );
        console.log("position of lemmaPerpetual: size", postionAfterGettingFunding.size.d.toString());
        console.log("position of lemmaPerpetual: margin", postionAfterGettingFunding.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", postionAfterGettingFunding.openNotional.d.toString());
        console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", postionAfterGettingFunding.lastUpdatedCumulativePremiumFraction.d.toString());


        await LemmaPerpetualContract.reInvestFundingPayment();

        const positionAfterFundingPayment = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );
        console.log("position of lemmaPerpetual: size", positionAfterFundingPayment.size.d.toString());
        console.log("position of lemmaPerpetual: margin", positionAfterFundingPayment.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", positionAfterFundingPayment.openNotional.d.toString());
        console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionAfterFundingPayment.lastUpdatedCumulativePremiumFraction.d.toString());


        const lUSDCBalance = await LemmaXDAIContract.balanceOf(account);
        console.log("Lusdc balance", lUSDCBalance.toString());

        await LemmaXDAIContract.connect(accounts[0]).withdraw(lUSDCBalance, "0");
    });


});