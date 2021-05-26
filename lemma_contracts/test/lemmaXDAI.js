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
    const trustedForwarderXDAI = addresses.xdai.trustedForwarder;
    const lemmaMainnet = addresses.rinkeby.lemmaMainnet;

    const clearingHouseAddress = addresses.perpMainnetXDAI.layers.layer2.contracts.ClearingHouse.address;
    const clearingHouseViewerAddress = addresses.perpMainnetXDAI.layers.layer2.contracts.ClearingHouseViewer.address;
    const ammAddress = addresses.perpMainnetXDAI.layers.layer2.contracts.ETHUSDC.address;
    const testusdcAddress = addresses.perpMainnetXDAI.layers.layer2.externalContracts.usdc;
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const lemmaVault = "0xd8D412aE452E1918352BFB1849BD1b906B672734";
    const feesFromProfit = 3000;
    const myEmitter = new EventEmitter();
    const ONE = ethers.utils.parseUnits("1", "18");
    let ambBridgeContract;
    let impersonate_account;
    let lemmaReInvestor;

    before(async function () {
        accounts = await ethers.getSigners();
        lemmaReInvestor = accounts[2];
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
        LemmaXDAIContract = await upgrades.deployProxy(LemmaXDAI, [testusdcAddress, LemmaPerpetualContract.address, ambBridgeContract.address, multiTokenMediatorOnXDai, trustedForwarderXDAI, lemmaVault, feesFromProfit, lemmaReInvestor.address], { initializer: 'initialize' });

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

    it("Set LemmaMainnet on xdai contract", async function () {
        await LemmaXDAIContract.connect(accounts[0]).setLemmaMainnet(lemmaMainnet);
        expect(await LemmaXDAIContract.lemmaMainnet()).to.equal(lemmaMainnet);
    });

    it("Set LemmaMainnet on perpetual contract", async function () {
        await LemmaPerpetualContract.setLemmaToken(LemmaXDAIContract.address);
        expect(await LemmaPerpetualContract.lemmaToken()).to.equal(LemmaXDAIContract.address);
    });

    it("Only ambBridge contract can call setDepositInfo function", async function () {
        let depositUSDCAmountOut = BigNumber.from(2 * 10 ** 6);
        try {
            await LemmaXDAIContract.connect(accounts[0]).setDepositInfo(accounts[0].address, depositUSDCAmountOut, 0);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: revert not ambBridge");
        }
    });

    it("Can not deposit if ambBridge's messageSender() is not the same as lemmaMainnet", async function () {
        let depositUSDCAmountOut = BigNumber.from(2 * 10 ** 6);
        await ambBridgeContract.setXDAIContract(LemmaXDAIContract.address);
        try {
            await ambBridgeContract.setDepositInfo(accounts[0].address, depositUSDCAmountOut, 0);
        }
        catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: revert ambBridge's messageSender is not lemmaMainnet");
        }
    });

    it("Set xdai and mainnet contract on AMB", async function () {
        await ambBridgeContract.setMainnetContract(lemmaMainnet);
        expect(await ambBridgeContract.mainnetContract()).to.equal(lemmaMainnet);
    });

    it("Set gasLimit", async function () {
        await LemmaXDAIContract.connect(accounts[0]).setGasLimit(1000000);
        expect(await LemmaXDAIContract.gasLimit()).to.equal(1000000);
    });

    it("Set Deposit", async function () {
        let depositAmount = BigNumber.from(1 * 10 ** 6);
        await accounts[0].sendTransaction({ to: impersonate_account._address, value: ethers.utils.parseEther("2") });

        let amountTransfer = BigNumber.from(7 * 10 ** 6);
        let test_usdc_balance_1 = await testusdc.balanceOf(impersonate_account._address);
        let spreadRatio = BigNumber.from(10 ** 15);
        let tollRatio = BigNumber.from(0);
        let one = BigNumber.from(1e18.toString());

        let amountAfterOpeningPosition = depositAmount.mul(one).div(one.add(spreadRatio));
        await testusdc.connect(impersonate_account).approve(LemmaXDAIContract.address, amountTransfer);
        await testusdc.connect(impersonate_account).transfer(LemmaXDAIContract.address, amountTransfer);
        expect(await ambBridgeContract.setDepositInfo(impersonate_account._address, depositAmount, 0)).to.emit(LemmaXDAIContract, "DepositInfoAdded").withArgs(impersonate_account._address, depositAmount);
        expect(await LemmaXDAIContract.mint(impersonate_account._address)).to.emit(LemmaXDAIContract, "USDCDeposited").withArgs(impersonate_account._address, amountAfterOpeningPosition);
        let test_usdc_balance_2 = await testusdc.balanceOf(impersonate_account._address);
        expect(test_usdc_balance_2).to.equal(test_usdc_balance_1 - amountTransfer);
    });

    it("Can not withdraw LemmaXDAI before setting lemmaMainnet", async function () {
        await LemmaXDAIContract.connect(accounts[0]).setLemmaMainnet(zeroAddress);
        let amountWithdraw_1 = BigNumber.from(1e18.toString());
        let balance = await LemmaXDAIContract.balanceOf(impersonate_account._address);
        let minEthOut = 0;
        let minUSDCOut = 0;
        try {
            await LemmaXDAIContract.connect(impersonate_account).withdraw(balance, minEthOut, minUSDCOut);
        } catch (error) {
            expect(error.message).to.equal("VM Exception while processing transaction: revert receiver is empty");
        };
    });

    it("Withdraw LemmaXDAI", async function () {
        await LemmaXDAIContract.connect(accounts[0]).setLemmaMainnet(lemmaMainnet);
        let amountWithdraw = await LemmaXDAIContract.balanceOf(impersonate_account._address);
        let lemmabalanceBeforeWithdraw = await LemmaXDAIContract.balanceOf(impersonate_account._address);
        let minEthOut = 0;
        let minUSDCOut = 0;
        await LemmaXDAIContract.connect(impersonate_account).withdraw(amountWithdraw, minEthOut, minUSDCOut);
        let test_usdc_balance_after_withdraw = await testusdc.balanceOf(LemmaXDAIContract.address);
        expect(test_usdc_balance_after_withdraw).to.equal(6000000);
    });

    it("should mint correctly", async function () {
        const usdcAmountToDeposit = ethers.utils.parseUnits("1", "6");
        const account = accounts[1].address;
        await ambBridgeContract.setDepositInfo(account, usdcAmountToDeposit, 0);
        expect(await LemmaXDAIContract.depositInfo(account)).to.equal(usdcAmountToDeposit);

        await testusdc.connect(impersonate_account).transfer(LemmaXDAIContract.address, usdcAmountToDeposit);

        const positionBefore = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );
        await LemmaXDAIContract.mint(account);
        const positionAfter = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );

        console.log("position of lemmaPerpetual: size", positionBefore.size.d.toString());
        console.log("position of lemmaPerpetual: margin", positionBefore.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", positionBefore.openNotional.d.toString());
        // console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionBefore.lastUpdatedCumulativePremiumFraction.d.toString());
        // console.log("position of lemmaPerpetual: liquidityHistoryIndex", positionBefore.liquidityHistoryIndex.toString());

        console.log("position of lemmaPerpetual: size", positionAfter.size.d.toString());
        console.log("position of lemmaPerpetual: margin", positionAfter.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", positionAfter.openNotional.d.toString());
        // console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionAfter.lastUpdatedCumulativePremiumFraction.d.toString());
        // console.log("position of lemmaPerpetual: liquidityHistoryIndex", positionAfter.liquidityHistoryIndex.toString());
    });

    it("should Withdraw correctly", async function () {
        const provider = accounts[0].provider;
        const usdcAmountToDeposit = ethers.utils.parseUnits("1000", "6");
        const account = accounts[0].address;
        await ambBridgeContract.setDepositInfo(account, usdcAmountToDeposit, 0);
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
        //here we are fetching the position with fundingPayment considered
        const positionAfterGettingFunding = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );
        console.log("position of lemmaPerpetual: size", positionAfterGettingFunding.size.d.toString());
        console.log("position of lemmaPerpetual: margin", positionAfterGettingFunding.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", positionAfterGettingFunding.openNotional.d.toString());
        console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionAfterGettingFunding.lastUpdatedCumulativePremiumFraction.d.toString());
        console.log("LUSDC total supply", (await LemmaXDAIContract.totalSupply()).toString());

        await LemmaXDAIContract.connect(lemmaReInvestor).reInvestFundingPayment(0);

        const positionAfterReInvestingFundingPayment = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );
        console.log("position of lemmaPerpetual: size", positionAfterReInvestingFundingPayment.size.d.toString());
        console.log("position of lemmaPerpetual: margin", positionAfterReInvestingFundingPayment.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", positionAfterReInvestingFundingPayment.openNotional.d.toString());
        console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionAfterReInvestingFundingPayment.lastUpdatedCumulativePremiumFraction.d.toString());

        let lUSDCBalance = await LemmaXDAIContract.balanceOf(account);
        console.log("Lusdc balance", lUSDCBalance.toString());

        console.log("LUSDC total supply", (await LemmaXDAIContract.totalSupply()).toString());


        await LemmaXDAIContract.connect(accounts[0]).withdraw(lUSDCBalance.div(BigNumber.from("2")), "0", "0");
        lUSDCBalance = await LemmaXDAIContract.balanceOf(account);

        //calculate the profit and make sure that 30% of it went to the lemma vault

        //we know that profit is equal to the funding rate - the fees
        //here we will get the total funding rate and just compare it with how much lemmaVault got

        // const profitWOPerpFees = positionAfterReInvestingFundingPayment.margin.d.sub(positionAfter.margin.d);
        // //because closing the position still has the 0.1% we need to take that into account too


        // const perpFeesOnProfit = await LemmaPerpetualContract.calcFee(ammAddress, [profitWOPerpFees]);
        // const profit = profitWOPerpFees.sub(perpFeesOnProfit.d);
        // console.log("profit in testing", (profit).toString());
        // if (!profit.isNegative()) {
        //     const feesFromProfit = (profit.mul(BigNumber.from("30"))).div((BigNumber.from("100")));
        //     console.log("feesFromProfit", (feesFromProfit).toString());
        // }

        const positionAfterClosing = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
            ammAddress,
            LemmaPerpetualContract.address,
        );
        console.log("position of lemmaPerpetual: size", positionAfterClosing.size.d.toString());
        console.log("position of lemmaPerpetual: margin", positionAfterClosing.margin.d.toString());
        console.log("position of lemmaPerpetual: openNotional", positionAfterClosing.openNotional.d.toString());
        console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", positionAfterClosing.lastUpdatedCumulativePremiumFraction.d.toString());

        const lUSDCBalanceEnd = await LemmaXDAIContract.balanceOf(account);
        console.log("Lusdc balance", lUSDCBalanceEnd.toString());

        console.log("LUSDC total supply", (await LemmaXDAIContract.totalSupply()).toString());

        console.log("amount of lusdc deserved by lemma", (await LemmaXDAIContract.amountOfLUSDCDeservedByLemmaVault()).toString());
        console.log("balance of lemmaVault", (await LemmaXDAIContract.balanceOf(lemmaVault)).toString());

        await hre.network.provider.request({
            method: "evm_increaseTime",
            params: [60 * 60]
        }
        );
        await hre.network.provider.request({
            method: "evm_mine",
        }
        );
        await this.clearingHouse.payFunding(ammAddress);
        await LemmaXDAIContract.connect(lemmaReInvestor).reInvestFundingPayment(0);

        console.log("LUSDC total supply", (await LemmaXDAIContract.totalSupply()).toString());

        console.log("amount of lusdc deserved by lemma", (await LemmaXDAIContract.amountOfLUSDCDeservedByLemmaVault()).toString());
        console.log("balance of lemmaVault", (await LemmaXDAIContract.balanceOf(lemmaVault)).toString());
    });
});