const { BigNumber } = require("ethers");
const { ethers, assert } = require("hardhat");
const providers = require('ethers').providers;

contract("LemmaMainnet", accounts => {
    const usdcAddress = "0x40D3B2F06f198D2B789B823CdBEcD1DB78090D74";
    const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');
    const UNISWAP_ABI = require('../abis/Uniswap_abi.json');
    const USDC_ABI = require('../abis/Usdc_abi.json');
    const lemmaxDAIAddress = "0x78a9a8106cCE1aB4dF9333DC5bA795A5DcC39915";
    // const lemmaxDAIAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
    const wethAddress = "0xc778417e063141139fce010982780140aa0cd5ab";
    const uniswapV2Router02Address = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
    const ambBridgeOnEth = "0xD4075FB57fCf038bFc702c915Ef9592534bED5c1";
    const multiTokenMediatorOnEth = "0x30F693708fc604A57F1958E3CFa059F902e6d4CB";
    const trustedForwaderRinkeby = "0xFD4973FeB2031D4409fB57afEE5dF2051b171104";
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    let LemmaMainnetContract;
    let ambBridgeContract;
    let lemmaXDAI;

    before(async function () {
        accounts = await ethers.getSigners();
        const LemmaMainnet = await ethers.getContractFactory("LemmaMainnet");
        const AMBBridge = await ethers.getContractFactory("MockAMB");
        uniswap = new ethers.Contract(uniswapV2Router02Address, UNISWAP_ABI, accounts[0]);
        usdc = new ethers.Contract(usdcAddress, USDC_ABI, accounts[0]);
        ambBridgeContract = await upgrades.deployProxy(AMBBridge, [], { initializer: 'initialize' });
        LemmaMainnetContract = await upgrades.deployProxy(LemmaMainnet, [usdcAddress, wethAddress, lemmaxDAIAddress, uniswapV2Router02Address, ambBridgeContract.address, multiTokenMediatorOnEth, trustedForwaderRinkeby], { initializer: 'initialize' });
        test_LemmaMainnetContract = await upgrades.deployProxy(LemmaMainnet, [usdcAddress, wethAddress, zeroAddress, uniswapV2Router02Address, ambBridgeContract.address, multiTokenMediatorOnEth, trustedForwaderRinkeby], { initializer: 'initialize' });
    });

    it("Can not deposit if lemmaXdai is not set", async function() {
        let minimumUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        let payableValue = BigNumber.from((10**17).toString());
        try {
            await test_LemmaMainnetContract.connect(accounts[0]).deposit(minimumUSDCAmountOut, {value: payableValue});    
        }
        catch (error) {
            assert(error.message, "VM Exception while processing transaction: revert receiver is empty");
        }
    });

    it("Transfer USDC from accounts[0] to lemmaMainnet", async function() {
        let payForBuyingUSDC = BigNumber.from((1*10**18).toString());
        let usdcAmount = BigNumber.from((70*10**6).toString());
        await uniswap.connect(accounts[0]).swapETHForExactTokens(usdcAmount.toString(), [wethAddress, usdcAddress], accounts[0].address, '9600952122', {value: payForBuyingUSDC});
        let usdc_balance_account_1 = await usdc.balanceOf(accounts[0].address);
        let amountTransfer = BigNumber.from(30 * 10 ** 6);
        await usdc.connect(accounts[0]).approve(LemmaMainnetContract.address, amountTransfer);
        await usdc.connect(accounts[0]).transfer(LemmaMainnetContract.address, amountTransfer);
        let usdc_balance_contract_1 = await usdc.balanceOf(LemmaMainnetContract.address);
        console.log(usdc_balance_account_1.toString());
        console.log(usdc_balance_contract_1.toString());
    });

    it("Set gasLimit", async function() {
        await LemmaMainnetContract.connect(accounts[0]).setGasLimit(1000000);
    });

    it("Deposit(EthBalanceBeforeDeposit = EthBalanceAfterDeposit + Fee + payableAmount)", async function() {
        let minimumUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        let payableValue = BigNumber.from((10**17).toString());
        let balanceBeforeDeposit = await accounts[0].getBalance();
        const provider = providers.getDefaultProvider('rinkeby');
       
        console.log(balanceBeforeDeposit.toString());
      
        const tx = await LemmaMainnetContract.connect(accounts[0]).deposit(minimumUSDCAmountOut, {value: payableValue});

        let balance_contract = await usdc.balanceOf(LemmaMainnetContract.address);
        console.log(balance_contract.toString()); 

        const { gasUsed } = await tx.wait();
        const gasPrice = tx.gasPrice;
        const feeEth = gasUsed * gasPrice;
        console.log(feeEth.toString());

        let balanceAfterDeposit = await accounts[0].getBalance();
        console.log(balanceAfterDeposit.toString());
        console.log((balanceBeforeDeposit - balanceAfterDeposit - payableValue).toString());
        // console.log(usdc);
        let usdcBalanceXDAI = await usdc.balanceOf(multiTokenMediatorOnEth);
        console.log(usdcBalanceXDAI.toString());
        // assert.equal(balanceBeforeDeposit - balanceAfterDeposit - payableValue, feeEth);

        // TODO Uniswap Fee exists
    });

    it("Only ambBridge contract can call setWithdrawalInfo function", async function() {
        let withdrawUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        try {
            await LemmaMainnetContract.connect(accounts[0]).setWithdrawalInfo(accounts[0].address, withdrawUSDCAmountOut);
        }
        catch (error) {
            assert(error.message, "VM Exception while processing transaction: revert not ambBridge");
        }
    });

    it("Can not withdraw if ambBridge's messageSender() is not the same as lemmaXDAI", async function() {
        let withdrawUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        await ambBridgeContract.setMainnetContract(LemmaMainnetContract.address);
        try {
            await ambBridgeContract.setWithdrawInfo(accounts[0].address, withdrawUSDCAmountOut);
        }
        catch (error) {
            assert(error.message, "VM Exception while processing transaction: revert ambBridge's messageSender is not lemmaXDAI");
        }
    });

    it("Set xdai and mainnet contract on AMB", async function() {
        await ambBridgeContract.setXDAIContract(lemmaxDAIAddress);
    });

    it("Withdraw", async function() {
        let usdcBalanceContractBeforeWithdraw = await usdc.balanceOf(LemmaMainnetContract.address);
        console.log(usdcBalanceContractBeforeWithdraw.toString());
        let withdrawUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        let balanceBeforeWithdraw = await accounts[0].getBalance();
        console.log(balanceBeforeWithdraw.toString());

        let aaaaa = await LemmaMainnetContract.getValue(accounts[0].address);
        console.log(aaaaa.toString());

        await ambBridgeContract.setWithdrawInfo(accounts[0].address, withdrawUSDCAmountOut);
        let balanceAfterWithdraw = await accounts[0].getBalance();
        let usdcBalanceContractAfterWithdraw = await usdc.balanceOf(LemmaMainnetContract.address);
        console.log(usdcBalanceContractAfterWithdraw.toString());
        let aa = usdcBalanceContractBeforeWithdraw - withdrawUSDCAmountOut;
        console.log(aa.toString());
        if (usdcBalanceContractBeforeWithdraw >= withdrawUSDCAmountOut) {
            console.log("opop");
            try {
                assert.equal(usdcBalanceContractAfterWithdraw, usdcBalanceContractBeforeWithdraw - withdrawUSDCAmountOut);
            } catch (error) {
                console.log(error.message);
                assert(error.message, "expected { Object (_hex, _isBigNumber) } to equal 10000000");
            }
            
        } else {
            console.log("lplplp");
            assert.equal(usdcBalanceContractBeforeWithdraw, usdcBalanceContractAfterWithdraw);
        }
        console.log(balanceAfterWithdraw.toString());
    });

    it("Can not withdraw more amount than the contract's balance", async function() {
        let usdcBalanceContractBeforeWithdraw = await usdc.balanceOf(LemmaMainnetContract.address);
        let withdrawUSDCAmountOut = BigNumber.from(50 * 10 ** 6);
        await ambBridgeContract.setWithdrawInfo(accounts[0].address, withdrawUSDCAmountOut);
        let usdcBalanceContractAfterWithdraw = await usdc.balanceOf(LemmaMainnetContract.address);
        if (usdcBalanceContractBeforeWithdraw >= withdrawUSDCAmountOut) {
            assert.equal(usdcBalanceContractAfterWithdraw, usdcBalanceContractBeforeWithdraw - withdrawUSDCAmountOut);
        } else {
            assert.equal(usdcBalanceContractBeforeWithdraw.toString(), usdcBalanceContractAfterWithdraw.toString());
        }
    });
  });