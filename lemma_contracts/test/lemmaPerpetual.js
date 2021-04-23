

const { expect } = require('chai');
const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');

describe("LemmaPerpetual", () => {
  const clearingHouseAddress = "0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd";
  const clearingHouseViewerAddress = "0xef8093561D193d24b7677F784e41A10714E7FE25";
  const ammAddress = "0x8d22F1a9dCe724D8c1B4c688D75f17A2fE2D32df";
  const usdcAddress = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83";
  const ONE = ethers.utils.parseUnits("1", "18");
  const USDC_DECIMALS = 6;



  let owner, lemmaToken, someAccount, hasUSDC;


  beforeEach(async function () {

    [owner, lemmaToken, someAccount] = await ethers.getSigners();
    const LemmaPerpetual = await ethers.getContractFactory("LemmaPerpetual");

    this.lemmaPerpetual = await upgrades.deployProxy(LemmaPerpetual, [clearingHouseAddress, clearingHouseViewerAddress, ammAddress, usdcAddress], { initializer: 'initialize' });
    await this.lemmaPerpetual.setLemmaToken(lemmaToken.address);

    this.clearingHouse = await ethers.getContractAt("IClearingHouse", clearingHouseAddress);
    this.amm = await ethers.getContractAt("IAmm", ammAddress);
    this.clearingHouseViewer = await ethers.getContractAt("IClearingHouseViewer", clearingHouseViewerAddress);


    this.usdc = new ethers.Contract(usdcAddress, TEST_USDC_ABI, owner);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x1A48776f436bcDAA16845A378666cf4BA131eb0F"]
    }
    );
    hasUSDC = await ethers.provider.getSigner("0x1A48776f436bcDAA16845A378666cf4BA131eb0F");

  });
  it("initializations correctly", async function () {
    expect(await this.lemmaPerpetual.owner()).to.equal(owner.address);
    expect(await this.lemmaPerpetual.clearingHouse()).to.equal(clearingHouseAddress);
    expect(await this.lemmaPerpetual.clearingHouseViewer()).to.equal(clearingHouseViewerAddress);
    expect(await this.lemmaPerpetual.ETH_USDC_AMM()).to.equal(ammAddress);
    expect(await this.lemmaPerpetual.USDC()).to.equal(usdcAddress);
    expect(await this.lemmaPerpetual.lemmaToken()).to.equal(lemmaToken.address);
    expect(await this.usdc.allowance(this.lemmaPerpetual.address, clearingHouseAddress)).to.equal(ethers.constants.MaxUint256);
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



  it("should open position correctly", async function () {
    //transfer USDC to lemmaPerpetual first

    const amount = ethers.utils.parseUnits("1000", "6");

    await this.usdc.connect(hasUSDC).transfer(this.lemmaPerpetual.address, amount);

    //should revert if open position is called by an address other than lemmaToken
    await expect(this.lemmaPerpetual.connect(someAccount).open(amount)).to.be.revertedWith("Lemma: only lemma token allowed");

    await this.lemmaPerpetual.connect(lemmaToken).open(amount);

    const tollRatio = await this.amm.tollRatio();
    const spreadRatio = await this.amm.spreadRatio();

    const usdcAmountInWei = convertUSDCAmountInWei(amount);

    const amountToOpenPositionWith = getAmountToOpenPositionWith(usdcAmountInWei, tollRatio.d, spreadRatio.d);

    const perpFees = usdcAmountInWei.sub(amountToOpenPositionWith);



    //returns {spreadFees,tradeFees}
    //totalFees = spreadFees + tradeFees
    const fees = await this.amm.calcFee([amountToOpenPositionWith]);


    expect(perpFees).to.be.closeTo(fees[0].d.add(fees[1].d), 1);
    expect(fees[0].d.add(fees[1].d).add(amountToOpenPositionWith)).to.be.closeTo(usdcAmountInWei);
    console.log(fees);

    const toalUSDCNeeded = convertWeiAmountToUSDC(amountToOpenPositionWith).add(convertWeiAmountToUSDC(perpFees));


    expect(toalUSDCNeeded).to.be.closeTo(amount, 1);
    const position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
      ammAddress,
      this.lemmaPerpetual.address,
    );
    //since leverage == 1
    expect(position.openNotional.d).to.equal(amountToOpenPositionWith);

  });


});