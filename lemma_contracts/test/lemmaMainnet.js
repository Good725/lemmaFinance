const { BigNumber } = require("ethers");
const { ethers, assert } = require("hardhat");

contract("LemmaMainnet", accounts => {
    const usdcAddress = "0x40D3B2F06f198D2B789B823CdBEcD1DB78090D74";
    const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');
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
        console.log(accounts[0].address);
        const LemmaMainnet = await ethers.getContractFactory("LemmaMainnet");
        const AMBBridge = await ethers.getContractFactory("MockAMB");
        ambBridgeContract = await upgrades.deployProxy(AMBBridge, [lemmaxDAIAddress], { initializer: 'initialize' });
        LemmaMainnetContract = await upgrades.deployProxy(LemmaMainnet, [usdcAddress, wethAddress, lemmaxDAIAddress, uniswapV2Router02Address, ambBridgeContract.address, multiTokenMediatorOnEth, trustedForwaderRinkeby], { initializer: 'initialize' });
        // lemmaXDAIContract = new ethers.Contract(lemmaxDAIAddress, LEMMA_XDAI_ABI, accounts[0]);
        await ambBridgeContract.setMainnetContract(LemmaMainnetContract.address);
        console.log(LemmaMainnetContract.address);
        console.log(ambBridgeContract.address);
    });

    it("Deposit", async function() {
        let minimumUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        let payableValue = BigNumber.from(1e18.toString());
        let balance = await accounts[0].getBalance();
        console.log(balance.toString());
        await LemmaMainnetContract.connect(accounts[0]).deposit(minimumUSDCAmountOut, {value: payableValue});
        let balance2 = await accounts[0].getBalance();
        console.log(balance2.toString());
        assert(balance > balance2);
    });

    it("Withdraw", async function() {
        let minimumUSDCAmountOut = BigNumber.from(20 * 10 ** 6);
        await ambBridgeContract.setWithdrawInfo(accounts[0].address, minimumUSDCAmountOut);
    });
  });