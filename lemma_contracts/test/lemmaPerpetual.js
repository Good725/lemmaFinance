

const { expect } = require('chai');
const TEST_USDC_ABI = require('../abis/TestUsdc_abi.json');

describe("LemmaPerpetual", () => {
  const clearingHouseAddress = "0x5d9593586b4B5edBd23E7Eba8d88FD8F09D83EBd";
  const clearingHouseViewerAddress = "0xef8093561D193d24b7677F784e41A10714E7FE25";
  const ammAddress = "0x8d22F1a9dCe724D8c1B4c688D75f17A2fE2D32df";
  const usdcAddress = "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83";
  const ONE = ethers.utils.parseUnits("1", "18");
  const ZERO = ethers.BigNumber.from("0");
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

  // it("initializations correctly", async function () {
  //   expect(await this.lemmaPerpetual.owner()).to.equal(owner.address);
  //   expect(await this.lemmaPerpetual.clearingHouse()).to.equal(clearingHouseAddress);
  //   expect(await this.lemmaPerpetual.clearingHouseViewer()).to.equal(clearingHouseViewerAddress);
  //   expect(await this.lemmaPerpetual.amm()).to.equal(ammAddress);
  //   expect(await this.lemmaPerpetual.collateral()).to.equal(usdcAddress);
  //   expect(await this.lemmaPerpetual.lemmaToken()).to.equal(lemmaToken.address);
  //   expect(await this.usdc.allowance(this.lemmaPerpetual.address, clearingHouseAddress)).to.equal(ethers.constants.MaxUint256);
  // });


  // it("should open position correctly", async function () {
  //   //transfer USDC to lemmaPerpetual first

  //   const amount = ethers.utils.parseUnits("1000", "6");
  //   expect(amount).to.be.lte((await this.usdc.balanceOf(hasUSDC._address)));
  //   // console.log(amount.toString());
  //   // console.log((await this.usdc.balanceOf(hasUSDC._address)).toString());
  //   await this.usdc.connect(hasUSDC).transfer(this.lemmaPerpetual.address, amount);

  //   //should revert if open position is called by an address other than lemmaToken
  //   await expect(this.lemmaPerpetual.connect(someAccount).open(amount)).to.be.revertedWith("Lemma: only lemma token allowed");

  //   await this.lemmaPerpetual.connect(lemmaToken).open(amount);

  //   const tollRatio = await this.amm.tollRatio();
  //   const spreadRatio = await this.amm.spreadRatio();
  //   // console.log("tollRatio", tollRatio.d.toString());
  //   // console.log("spreadRatio", spreadRatio.d.toString());

  //   const usdcAmountInWei = convertUSDCAmountInWei(amount);
  //   // console.log("usdcAmountInWei", usdcAmountInWei.toString());
  //   const amountToOpenPositionWith = getAmountToOpenPositionWith(usdcAmountInWei, tollRatio.d, spreadRatio.d);
  //   // console.log("amountToOpenPositionWith", amountToOpenPositionWith.toString());
  //   const perpFees = usdcAmountInWei.sub(amountToOpenPositionWith);
  //   // console.log("perpFees", perpFees);

  //   // const 
  //   //returns {spreadFees,tradeFees}
  //   //totalFees = spreadFees + tradeFees
  //   const fees = await this.amm.calcFee([amountToOpenPositionWith]);

  //   // console.log(fees.spreadRatio.d);
  //   // console.log(fees[0].d);
  //   // console.log(fees[1].d);
  //   // console.log("spreadFees from perp", fees[1].d.toString());
  //   expect(perpFees).to.be.closeTo(fees[0].d.add(fees[1].d), 1);
  //   expect(fees[0].d.add(fees[1].d).add(amountToOpenPositionWith)).to.be.closeTo(usdcAmountInWei, 1);
  //   // console.log(fees);

  //   const toalUSDCNeeded = convertWeiAmountToUSDC(amountToOpenPositionWith).add(convertWeiAmountToUSDC(perpFees));

  //   // console.log("totalUSDCNeed", toalUSDCNeeded.toString());
  //   expect(toalUSDCNeeded).to.be.closeTo(amount, 1);
  //   const position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
  //     ammAddress,
  //     this.lemmaPerpetual.address,
  //   );
  //   //since leverage == 1
  //   expect(position.openNotional.d).to.equal(amountToOpenPositionWith);

  //   // console.log("position of lemmaPerpetual: size", position.size.d.toString());
  //   // console.log("position of lemmaPerpetual: margin", position.margin.d.toString());
  //   // console.log("position of lemmaPerpetual: openNotional", position.openNotional.d.toString());
  //   // console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", position.lastUpdatedCumulativePremiumFraction.d.toString());
  //   // console.log("position of lemmaPerpetual: liquidityHistoryIndex", position.liquidityHistoryIndex.toString());
  //   // console.log((await this.usdc.balanceOf(this.lemmaPerpetual.address)).toString());
  // });


  // it("should close the entire position correctly", async function () {
  //   //transfer USDC to lemmaPerpetual first

  //   const amount = ethers.utils.parseUnits("1000", "6");
  //   expect(amount).to.be.lte((await this.usdc.balanceOf(hasUSDC._address)));
  //   // console.log(amount.toString());
  //   // console.log((await this.usdc.balanceOf(hasUSDC._address)).toString());
  //   await this.usdc.connect(hasUSDC).transfer(this.lemmaPerpetual.address, amount);

  //   //should revert if open position is called by an address other than lemmaToken
  //   await expect(this.lemmaPerpetual.connect(someAccount).open(amount)).to.be.revertedWith("Lemma: only lemma token allowed");

  //   await this.lemmaPerpetual.connect(lemmaToken).open(amount);
  //   const totalCollateral = await this.lemmaPerpetual.getTotalCollateral();

  //   //close position when totalCollateral is given as input
  //   await this.lemmaPerpetual.connect(lemmaToken).close(totalCollateral);


  //   const position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
  //     ammAddress,
  //     this.lemmaPerpetual.address,
  //   );
  //   //since leverage == 1
  //   expect(position.openNotional.d).to.equal(ZERO);
  //   expect(position.margin.d).to.equal(ZERO);
  //   expect(position.size.d).to.equal(ZERO);
  //   expect((await this.usdc.balanceOf(this.lemmaPerpetual.address))).to.equal(ZERO);
  //   //check the balance of lemmaTOken
  //   //should be amountInwei - fees1 -fees2


  // });

  //TODO: add tests for partial close

  it("should open position correctly", async function () {
    //transfer USDC to lemmaPerpetual first


    const amount = ethers.utils.parseUnits("1000", "6");
    expect(amount).to.be.lte((await this.usdc.balanceOf(hasUSDC._address)));
    // console.log(amount.toString());
    console.log((await this.usdc.balanceOf(hasUSDC._address)).toString());
    await this.usdc.connect(hasUSDC).transfer(this.lemmaPerpetual.address, await this.usdc.balanceOf(hasUSDC._address));

    //should revert if open position is called by an address other than lemmaToken
    // await expect(this.lemmaPerpetual.connect(someAccount).open(amount)).to.be.revertedWith("Lemma: only lemma token allowed");

    for (let i = 0; i < 12; i++) {
      await this.lemmaPerpetual.connect(lemmaToken).open(amount);
    }

    const tollRatio = await this.amm.tollRatio();
    const spreadRatio = await this.amm.spreadRatio();
    // console.log("tollRatio", tollRatio.d.toString());
    // console.log("spreadRatio", spreadRatio.d.toString());

    const usdcAmountInWei = convertUSDCAmountInWei(amount);
    // console.log("usdcAmountInWei", usdcAmountInWei.toString());
    const amountToOpenPositionWith = getAmountToOpenPositionWith(usdcAmountInWei, tollRatio.d, spreadRatio.d);
    // console.log("amountToOpenPositionWith", amountToOpenPositionWith.toString());
    const perpFees = usdcAmountInWei.sub(amountToOpenPositionWith);
    // console.log("perpFees", perpFees);

    // const 
    //returns {spreadFees,tradeFees}
    //totalFees = spreadFees + tradeFees
    const fees = await this.amm.calcFee([amountToOpenPositionWith]);

    // console.log(fees.spreadRatio.d);
    // console.log(fees[0].d);
    // console.log(fees[1].d);
    // // console.log("spreadFees from perp", fees[1].d.toString());
    // expect(perpFees).to.be.closeTo(fees[0].d.add(fees[1].d), 1);
    // expect(fees[0].d.add(fees[1].d).add(amountToOpenPositionWith)).to.be.closeTo(usdcAmountInWei, 1);
    // console.log(fees);

    const toalUSDCNeeded = convertWeiAmountToUSDC(amountToOpenPositionWith).add(convertWeiAmountToUSDC(perpFees));

    // console.log("totalUSDCNeed", toalUSDCNeeded.toString());
    // expect(toalUSDCNeeded).to.be.closeTo(amount, 1);
    let position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
      ammAddress,
      this.lemmaPerpetual.address,
    );
    //since leverage == 1
    // expect(position.openNotional.d).to.equal(amountToOpenPositionWith);
    console.log("position of lemmaPerpetual: size", position.size.d.toString());
    console.log("position of lemmaPerpetual: margin", position.margin.d.toString());
    console.log("position of lemmaPerpetual: openNotional", position.openNotional.d.toString());
    console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", position.lastUpdatedCumulativePremiumFraction.d.toString());
    console.log("position of lemmaPerpetual: liquidityHistoryIndex", position.liquidityHistoryIndex.toString());
    console.log((await this.usdc.balanceOf(this.lemmaPerpetual.address)).toString());

    await hre.network.provider.request({
      method: "evm_increaseTime",
      params: [60 * 60]
    }
    );

    await this.clearingHouse.payFunding(ammAddress);

    await this.lemmaPerpetual.reInvestFundingPayment();

    position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
      ammAddress,
      this.lemmaPerpetual.address,
    );

    console.log("position of lemmaPerpetual: size", position.size.d.toString());
    console.log("position of lemmaPerpetual: margin", position.margin.d.toString());
    console.log("position of lemmaPerpetual: openNotional", position.openNotional.d.toString());
    console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", position.lastUpdatedCumulativePremiumFraction.d.toString());
    console.log("position of lemmaPerpetual: liquidityHistoryIndex", position.liquidityHistoryIndex.toString());
    console.log((await this.usdc.balanceOf(this.lemmaPerpetual.address)).toString());
  });




});