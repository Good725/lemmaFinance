const { assert, upgrades, ethers } = require("hardhat");
const { deployProxy } = require("@openzeppelin/hardhat-upgrades");
// const LemmaHoneySwap = artifacts.require("LemmaHoneySwap");
// const LemmaPerpetual = artifacts.require("LemmaPerpetual");
// const LemmaToken = artifacts.require("LemmaToken");
contract("LemmaHoneySwap", accounts => {
    const clearingHouseAddress = "0xd1ab46526D555285E9b61f066B7673bb9b9B51b6";
    const clearingHouseViewerAddress = "0x2b53BA3d842F76e4D96FecEA77d345d237680E2e";
    const ammAddress = "0xF75C8c9EADBCA5D26dA43466aD5Be511Cb281668";
    const usdcAddress = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83";
    const wxdaiAddress = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d";
    const uniswapV2Router02 = "0x1C232F01118CB8B424793ae03F870aa7D0ac7f77";
    let LemmaHoneySwapContract;
    let LemmaTokenContract;
    
    it("deploy", async function() {
        const LemmaHoneySwap = await ethers.getContractFactory("LemmaHoneySwap");
        LemmaHoneySwapContract = await upgrades.deployProxy(LemmaHoneySwap, [uniswapV2Router02], { initializer: 'initialize' });
        console.log(await LemmaHoneySwapContract.owner());
        console.log(LemmaHoneySwapContract.address);
    });
    
    it("Set LemmaToken", async function() {
        const LemmaPerpetual = await ethers.getContractFactory("LemmaPerpetual");
        const LemmaToken = await ethers.getContractFactory("LemmaToken");
        let LemmaPerpetualContract = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ammAddress, usdcAddress], { initializer: 'initialize' });
    
        LemmaTokenContract = await upgrades.deployProxy(LemmaToken, [usdcAddress, wxdaiAddress, LemmaPerpetualContract.address, LemmaHoneySwapContract.address], { initializer: 'initialize' });
        await LemmaHoneySwapContract.setLemmaToken(LemmaTokenContract.address, {from: accounts[0]});
        console.log(await LemmaHoneySwapContract.lemmaToken());
        console.log(LemmaTokenContract.address);
        assert.equal(await LemmaHoneySwapContract.lemmaToken(), LemmaTokenContract.address);
    });
});