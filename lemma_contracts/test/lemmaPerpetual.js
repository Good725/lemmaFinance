const LemmaPerpetual = artifacts.require("LemmaPerpetual");

contract("LemmaPerpetual", accounts => {
  it("Deploy LemmaPerpetual", async function() {
    const clearingHouseAddress = "0xd1ab46526D555285E9b61f066B7673bb9b9B51b6";
    const clearingHouseViewerAddress = "0x2b53BA3d842F76e4D96FecEA77d345d237680E2e";
    const ammAddress = "0xF75C8c9EADBCA5D26dA43466aD5Be511Cb281668";
    const usdcAddress = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83";
    let LemmaPerpetualContract = await LemmaPerpetual.new(clearingHouseAddress, clearingHouseViewerAddress, ammAddress, usdcAddress);
    console.log(LemmaPerpetualContract.address);
    let a = 8;
    let fee = await LemmaPerpetualContract.fees(a).call();
    console.log(fee);
  });
});