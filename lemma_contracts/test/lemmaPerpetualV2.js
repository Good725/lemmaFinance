const { ethers } = require("hardhat");

contract("LemmaPerpetual", accounts => {
    const clearingHouseAddress = "0xd1ab46526D555285E9b61f066B7673bb9b9B51b6";
    const clearingHouseViewerAddress = "0x2b53BA3d842F76e4D96FecEA77d345d237680E2e";
    const ammAddress = "0xF75C8c9EADBCA5D26dA43466aD5Be511Cb281668";
    const usdcAddress = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83";
  
    it("Deploy LemmaPerpetual", async function() {
      const LemmaPerpetual = await ethers.getContractFactory("LemmaPerpetual");
      const LemmaPerpetualV2 = await ethers.getContractFactory("MockLemmaPerpetual");

      let LemmaPerpetualContract = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ammAddress, usdcAddress], { initializer: 'initialize' });
      let upgraded = await upgrades.upgradeProxy(LemmaPerpetualContract.address, LemmaPerpetualV2);

      console.log(LemmaPerpetualContract.address);
      console.log(upgraded.address);
    });
  });