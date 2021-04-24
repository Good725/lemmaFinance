const { BigNumber } = require("ethers");
const { ethers, assert } = require("hardhat");
const { TASK_NODE } = require("hardhat/builtin-tasks/task-names");
const providers = require('ethers').providers;

contract("LemmaMainnet", accounts => {
    const usdcAddress = "0x40D3B2F06f198D2B789B823CdBEcD1DB78090D74";
    const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');
    const USDC_ABI = require('../abis/Usdc_abi.json');
    const lemmaxDAIAddress = "0x78a9a8106cCE1aB4dF9333DC5bA795A5DcC39915";
    // const lemmaxDAIAddress = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0";
    const wethAddress = "0xc778417e063141139fce010982780140aa0cd5ab";
    const uniswapV2Router02Address = "0x7a250d5630b4cf539739df2c5dacb4c659f2488d";
    const ambBridgeOnEth = "0xD4075FB57fCf038bFc702c915Ef9592534bED5c1";
    const multiTokenMediatorOnEth = "0x30F693708fc604A57F1958E3CFa059F902e6d4CB";
    const trustedForwaderRinkeby = "0xFD4973FeB2031D4409fB57afEE5dF2051b171104";
    let LemmaMainnetContract;
    let ambBridgeContract;
    let lemmaXDAI;

    before(async function () {
        accounts = await ethers.getSigners();
        const LemmaMainnet = await ethers.getContractFactory("LemmaMainnet");
        const AMBBridge = await ethers.getContractFactory("MockAMB");
        usdc = new ethers.Contract(usdcAddress, USDC_ABI, accounts[0]);
        ambBridgeContract = await upgrades.deployProxy(AMBBridge, [lemmaxDAIAddress], { initializer: 'initialize' });
        LemmaMainnetContract = await upgrades.deployProxy(LemmaMainnet, [usdcAddress, wethAddress, lemmaxDAIAddress, uniswapV2Router02Address, ambBridgeContract.address, multiTokenMediatorOnEth, trustedForwaderRinkeby], { initializer: 'initialize' });
        // lemmaXDAIContract = new ethers.Contract(lemmaxDAIAddress, LEMMA_XDAI_ABI, accounts[0]);
        await ambBridgeContract.setMainnetContract(LemmaMainnetContract.address);
    });

    it("Deposit(EthBalanceBeforeDeposit = EthBalanceAfterDeposit + Fee + payableAmount)", async function() {
        let minimumUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        let payableValue = BigNumber.from((10**17).toString());
        let balanceBeforeDeposit = await accounts[0].getBalance();
        const provider = providers.getDefaultProvider('rinkeby');
       
        console.log(balanceBeforeDeposit.toString());
      
        const tx = await LemmaMainnetContract.connect(accounts[0]).deposit(minimumUSDCAmountOut, {value: payableValue});
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
        assert.equal(balanceBeforeDeposit - balanceAfterDeposit - payableValue, feeEth);
    });

    it("Withdraw", async function() {
        let minimumUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        await ambBridgeContract.setWithdrawInfo(accounts[0].address, minimumUSDCAmountOut);
    });
  });