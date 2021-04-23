const { ethers } = require("hardhat");
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

    before(async function () {
        console.log("______________");
        accounts = await ethers.getSigners();
        console.log(accounts[0].address);
        const LemmaToken = await ethers.getContractFactory("LemmaToken");
        const LemmaPerpetual = await ethers.getContractFactory("LemmaPerpetual");
        
        LemmaPerpetualContract = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ammAddress, testusdcAddress], { initializer: 'initialize' });
        console.log(LemmaPerpetualContract.address);
        LemmaTokenContract = await upgrades.deployProxy(LemmaToken, [collateral, LemmaPerpetualContract.address, ambBridgeOnXDai, multiTokenMediatorOnXDai, trustedForwaderXDAI], { initializer: 'initialize' });
        console.log(LemmaTokenContract.address);
        // let LemmaMockContract = await upgrades.upgradeProxy(LemmaTokenContract.address, LemmaMockToken);
        // console.log(LemmaMockContract.address);
    });
  
    it("Deploy LemmaToken", async function() {
        // let LemmaMockContract = await upgrades.upgradeProxy("0x78a9a8106cCE1aB4dF9333DC5bA795A5DcC39915", LemmaToken);
        // console.log(LemmaTokenContract.address);
        
    });
    it("Set LemmaMainnet", async function() {
        await LemmaTokenContract.connect(accounts[0]).setLemmaMainnet(lemmaMainnet);
    });
    it("Withdraw LemmaToken", async function() {
        let balane = await LemmaTokenContract.balanceOf(accounts[0].address);
        console.log(balane.toString());
    })
  });