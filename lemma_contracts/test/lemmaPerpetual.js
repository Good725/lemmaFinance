

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
  const getAmountToSellForReInvestinFundingPayment = (amount, tollRatio, spreadRatio) => {
    return (amount.mul(ONE)).div(ONE.sub(tollRatio.add(spreadRatio)));
  };
  const convertWeiAmountToUSDC = (amount) => {
    //(amount ) / 10^18-6
    return (amount).div(ethers.BigNumber.from("10").pow(ethers.BigNumber.from("12")));
  };

  const convertUSDCAmountInWei = (amount) => {
    //amount * 10^18-6
    return amount.mul(ethers.BigNumber.from("10").pow(ethers.BigNumber.from("12")));
  };

  it("initializations correctly", async function () {
    expect(await this.lemmaPerpetual.owner()).to.equal(owner.address);
    expect(await this.lemmaPerpetual.clearingHouse()).to.equal(clearingHouseAddress);
    expect(await this.lemmaPerpetual.clearingHouseViewer()).to.equal(clearingHouseViewerAddress);
    expect(await this.lemmaPerpetual.amm()).to.equal(ammAddress);
    expect(await this.lemmaPerpetual.collateral()).to.equal(usdcAddress);
    expect(await this.lemmaPerpetual.lemmaToken()).to.equal(lemmaToken.address);
    expect(await this.usdc.allowance(this.lemmaPerpetual.address, clearingHouseAddress)).to.equal(ethers.constants.MaxUint256);
  });


  it("should open position correctly", async function () {
    //transfer USDC to lemmaPerpetual first

    const amount = ethers.utils.parseUnits("1000", "6");
    expect(amount).to.be.lte((await this.usdc.balanceOf(hasUSDC._address)));
    // console.log(amount.toString());
    // console.log((await this.usdc.balanceOf(hasUSDC._address)).toString());
    await this.usdc.connect(hasUSDC).transfer(this.lemmaPerpetual.address, amount);

    //should revert if open position is called by an address other than lemmaToken
    await expect(this.lemmaPerpetual.connect(someAccount).open(amount)).to.be.revertedWith("Lemma: only lemma token allowed");

    await this.lemmaPerpetual.connect(lemmaToken).open(amount);

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
    // console.log("spreadFees from perp", fees[1].d.toString());
    expect(perpFees).to.be.closeTo(fees[0].d.add(fees[1].d), 1);
    expect(fees[0].d.add(fees[1].d).add(amountToOpenPositionWith)).to.be.closeTo(usdcAmountInWei, 1);
    // console.log(fees);

    const totalUSDCNeeded = convertWeiAmountToUSDC(amountToOpenPositionWith).add(convertWeiAmountToUSDC(perpFees));

    // console.log("totalUSDCNeed", totalUSDCNeeded.toString());
    expect(totalUSDCNeeded).to.be.closeTo(amount, 1);
    const position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
      ammAddress,
      this.lemmaPerpetual.address,
    );
    //since leverage == 1
    expect(position.openNotional.d).to.equal(amountToOpenPositionWith);

    // console.log("position of lemmaPerpetual: size", position.size.d.toString());
    // console.log("position of lemmaPerpetual: margin", position.margin.d.toString());
    // console.log("position of lemmaPerpetual: openNotional", position.openNotional.d.toString());
    // console.log("position of lemmaPerpetual: lastUpdatedCumulativePremiumFraction", position.lastUpdatedCumulativePremiumFraction.d.toString());
    // console.log("position of lemmaPerpetual: liquidityHistoryIndex", position.liquidityHistoryIndex.toString());
    // console.log((await this.usdc.balanceOf(this.lemmaPerpetual.address)).toString());
  });


  it("should close the entire position correctly", async function () {
    //transfer USDC to lemmaPerpetual first

    const amount = ethers.utils.parseUnits("1000", "6");
    expect(amount).to.be.lte((await this.usdc.balanceOf(hasUSDC._address)));
    // console.log(amount.toString());
    // console.log((await this.usdc.balanceOf(hasUSDC._address)).toString());
    await this.usdc.connect(hasUSDC).transfer(this.lemmaPerpetual.address, amount);

    //should revert if open position is called by an address other than lemmaToken
    await expect(this.lemmaPerpetual.connect(someAccount).open(amount)).to.be.revertedWith("Lemma: only lemma token allowed");

    await this.lemmaPerpetual.connect(lemmaToken).open(amount);
    const totalCollateral = await this.lemmaPerpetual.getTotalCollateral();

    //close position when totalCollateral is given as input
    await this.lemmaPerpetual.connect(lemmaToken).close(totalCollateral);


    const position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
      ammAddress,
      this.lemmaPerpetual.address,
    );
    //since leverage == 1
    expect(position.openNotional.d).to.equal(ZERO);
    expect(position.margin.d).to.equal(ZERO);
    expect(position.size.d).to.equal(ZERO);
    expect((await this.usdc.balanceOf(this.lemmaPerpetual.address))).to.equal(ZERO);
    //TODO: check the balance of lemmaToken
    //should be amountInwei - fees1 -fees2


  });

  it("should close partial position correctly", async function () {
    //transfer USDC to lemmaPerpetual first
    const amount = ethers.utils.parseUnits("1000", "6");
    expect(amount).to.be.lte((await this.usdc.balanceOf(hasUSDC._address)));
    await this.usdc.connect(hasUSDC).transfer(this.lemmaPerpetual.address, amount);

    await this.lemmaPerpetual.connect(lemmaToken).open(amount);
    const balanceOfLemmaTokenBefore = await this.usdc.balanceOf(lemmaToken.address);
    //close position when totalCollateral is given as input
    const closingAmount = amount.div(10);
    await this.lemmaPerpetual.connect(lemmaToken).close(closingAmount);

    const tollRatio = await this.amm.tollRatio();
    const spreadRatio = await this.amm.spreadRatio();
    expect((await this.usdc.balanceOf(this.lemmaPerpetual.address))).to.equal(ZERO);
    const balanceOfLemmaTokenAfter = await this.usdc.balanceOf(lemmaToken.address);
    const collateralThatLemmaTokenGot = balanceOfLemmaTokenAfter.sub(balanceOfLemmaTokenBefore);
    expect(collateralThatLemmaTokenGot).to.be.closeTo(getAmountToOpenPositionWith(closingAmount, tollRatio.d, spreadRatio.d), 1);
  });


  it("should re invest funding payments correctly", async function () {
    //transfer USDC to lemmaPerpetual first
    const amount = ethers.utils.parseUnits("100000", "6");
    expect(amount).to.be.lte((await this.usdc.balanceOf(hasUSDC._address)));
    //open the long position
    console.log((await this.usdc.balanceOf(hasUSDC._address)).toString());
    await this.usdc.connect(hasUSDC).transfer(this.lemmaPerpetual.address, amount);
    await this.lemmaPerpetual.connect(lemmaToken).open(amount);


    const tollRatio = await this.amm.tollRatio();
    const spreadRatio = await this.amm.spreadRatio();

    //go forward in time to be able to distribute the fundingPayments
    await hre.network.provider.request({
      method: "evm_increaseTime",
      params: [3600]
    }
    );
    await hre.network.provider.request({
      method: "evm_mine",
    }
    );
    //distribute the funding payments
    await this.clearingHouse.payFunding(ammAddress);

    position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
      ammAddress,
      this.lemmaPerpetual.address,
    );
    const marginBeforeReInvestingWithFundingPayment = position.margin;
    const positionWOFundingPayment = await this.clearingHouse.getPosition(ammAddress, this.lemmaPerpetual.address);
    const marginBeforeReInvestingWOFundingPayment = positionWOFundingPayment.margin;
    const fundingPayment = marginBeforeReInvestingWithFundingPayment.d.sub(marginBeforeReInvestingWOFundingPayment.d);
    console.log("fundingPayment in test", fundingPayment.toString());

    //re invest the funding payments
    await this.lemmaPerpetual.connect(lemmaToken).reInvestFundingPayment();

    position = await this.clearingHouseViewer.getPersonalPositionWithFundingPayment(
      ammAddress,
      this.lemmaPerpetual.address,
    );
    const currentMargin = position.margin;


    //make sure that openNotional == margin 
    //this means that it got reInvested properly (fundingPayment negative or positive does not matter)
    expect(position.margin.d).to.equal(position.openNotional.d);
    //below marginBeforeReInvesting already has the fundingPayment added (since we are calling getPersonalPositionWithFundingPayment() to get the position)
    console.log("marginBeforeReInvestingWithFundingPayment", marginBeforeReInvestingWithFundingPayment.d.toString());

    console.log("currentMargin", currentMargin.d.toString());
    let feesToOpenPositionForReInvestingFundingPayment;
    let amountToOpenPositionWithForReInvestingFundingPayment;
    if (fundingPayment.isNegative()) {
      amountToOpenPositionWithForReInvestingFundingPayment = getAmountToSellForReInvestinFundingPayment(fundingPayment, tollRatio.d, spreadRatio.d);
      feesToOpenPositionForReInvestingFundingPayment = await this.lemmaPerpetual.calcFee(ammAddress, [amountToOpenPositionWithForReInvestingFundingPayment.abs()]);
    }
    else {
      amountToOpenPositionWithForReInvestingFundingPayment = getAmountToOpenPositionWith(fundingPayment, tollRatio.d, spreadRatio.d);
      feesToOpenPositionForReInvestingFundingPayment = await this.lemmaPerpetual.calcFee(ammAddress, [amountToOpenPositionWithForReInvestingFundingPayment]);
    }
    console.log("feesToOpenPositionForReInvestingFundingPayment", feesToOpenPositionForReInvestingFundingPayment.d.toString());
    console.log("amountToOpenPositionWithForReInvestingFundingPayment", amountToOpenPositionWithForReInvestingFundingPayment.toString());

    //only fees to open position is subtracted from the margin with funding payment in both cases
    //in the contract the conversion will happen and that is why converting below is also necessary
    //TODO: check if closeTo 1 is necessary below
    expect(convertWeiAmountToUSDC(marginBeforeReInvestingWithFundingPayment.d).sub(convertWeiAmountToUSDC(feesToOpenPositionForReInvestingFundingPayment.d))).to.be.closeTo(convertWeiAmountToUSDC(currentMargin.d), 1);


  });




});