// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

import {IPerpetualProtocol, IERC20} from '../interfaces/IPerpetualProtocol.sol';
// import {IAmm, Decimal, IERC20} from '../interfaces/IAmm.sol';
// import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {IAmm, Decimal} from '../interfaces/IAmm.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import {
    IERC20WithDecimalsMethod
} from '../interfaces/IERC20WithDecimalsMethod.sol';
import {IClearingHouse} from '../interfaces/IClearingHouse.sol';
import {
    IClearingHouseViewer,
    SignedDecimal
} from '../interfaces/IClearingHouseViewer.sol';

// import 'hardhat/console.sol';

contract MockLemmaPerpetual is OwnableUpgradeable, IPerpetualProtocol {
    IClearingHouse public clearingHouse;
    IClearingHouseViewer public clearingHouseViewer;
    IAmm public ETH_USDC_AMM;
    IERC20 public collateral;
    address public lemmaToken;

    using Decimal for Decimal.decimal;
    using SignedDecimal for SignedDecimal.signedDecimal;

    uint256 public updatedStorage;

    //mapping that maps AMMs to an underlying asset
    //only one collateral for now

    modifier onlyLemmaToken() {
        require(msg.sender == lemmaToken, 'Lemma: only lemma token allowed');
        _;
    }

    // constructor(
    //     IClearingHouse _clearingHouse,
    //     IClearingHouseViewer _clearingHouseViewer,
    //     IAmm _ETH_USDC_AMM,
    //     IERC20Upgradeable _USDC
    // ) {
    //     clearingHouse = _clearingHouse;
    //     clearingHouseViewer = _clearingHouseViewer;
    //     ETH_USDC_AMM = _ETH_USDC_AMM;
    //     collateral = _USDC;
    //     _USDC.approve(address(_clearingHouse), type(uint256).max);
    // }

    function initialize(
        IClearingHouse _clearingHouse,
        IClearingHouseViewer _clearingHouseViewer,
        IAmm _ETH_USDC_AMM,
        IERC20 _USDC,
        uint256 _updatedStorage
    ) public initializer {
        __Ownable_init();
        clearingHouse = _clearingHouse;
        clearingHouseViewer = _clearingHouseViewer;
        ETH_USDC_AMM = _ETH_USDC_AMM;
        collateral = _USDC;
        updatedStorage = _updatedStorage;
        _USDC.approve(address(_clearingHouse), type(uint256).max);
    }

    function setLemmaToken(address _lemmaToken) external onlyOwner {
        lemmaToken = _lemmaToken;
    }

    //open on which side needs to decided by rebalancer logic
    //underlying asset needs to be given dynamically
    function open(uint256 _amount)
        external
        override
        onlyLemmaToken
        returns (uint256 temp)
    {
        // IERC20 quoteToken = ETH_USDC_AMM.quoteAsset();
        //open postion on perptual protcol
        Decimal.decimal memory assetAmount =
            convertCollteralAmountTo18Decimals(address(collateral), _amount);

        Decimal.decimal memory leverage = Decimal.one();
        //TODO: add calculation for baseAssetAmountLimit with slippage from user
        Decimal.decimal memory baseAssetAmount = Decimal.zero();

        // //Will need to take this into account when leverage is > 1
        // // Decimal.decimal memory positionNotional =
        // //     quoteAssetAmount.mulD(leverage);

        clearingHouse.openPosition(
            ETH_USDC_AMM,
            IClearingHouse.Side.SELL,
            assetAmount,
            leverage,
            baseAssetAmount
        );
    }

    //close on which side needs to be decide by rebalacer logic
    //underlying asset needs to be given dynamically
    function close(uint256 _amount)
        external
        override
        onlyLemmaToken
        returns (uint256 temp)
    {
        Decimal.decimal memory amount =
            convertCollteralAmountTo18Decimals(address(collateral), _amount);

        Decimal.decimal memory assetAmount =
            amount.divD(
                (
                    Decimal.one().addD(
                        (
                            ETH_USDC_AMM.tollRatio().addD(
                                ETH_USDC_AMM.spreadRatio()
                            )
                        )
                    )
                )
            );

        Decimal.decimal memory leverage = Decimal.one();
        //TODO: add calculation for baseAssetAmountLimit with slippage from user
        Decimal.decimal memory baseAssetAmount = Decimal.zero();

        // //Will need to take this into account when leverage is > 1
        // // Decimal.decimal memory positionNotional =
        // //     quoteAssetAmount.mulD(leverage);

        // if (_amount == getTotalCollateral()) {
        //     clearingHouse.removeMargin(
        //         ETH_USDC_AMM,
        //         calcFee(ETH_USDC_AMM, assetAmount)
        //     );
        //     clearingHouse.closePosition(ETH_USDC_AMM, Decimal.zero());
        // } else {
        clearingHouse.removeMargin(
            ETH_USDC_AMM,
            calcFee(ETH_USDC_AMM, assetAmount)
        );
        clearingHouse.openPosition(
            ETH_USDC_AMM,
            IClearingHouse.Side.SELL,
            assetAmount,
            leverage,
            baseAssetAmount
        );
        //If user is withdrawing then ...
        clearingHouse.removeMargin(ETH_USDC_AMM, assetAmount);
        // }

        //TODO: add require that leverage should not be greater than one

        uint256 amountGotBackAfterClosing =
            convert18DecimalsToCollateralAmount(
                address(collateral),
                assetAmount
            );
        collateral.transfer(lemmaToken, amountGotBackAfterClosing);

        // return amountGotBackAfterClosing;
    }

    function convertCollteralAmountTo18Decimals(
        address _collateral,
        uint256 _amount
    ) internal view returns (Decimal.decimal memory) {
        return
            (Decimal.decimal(_amount)).divD(
                Decimal.decimal(
                    10**IERC20WithDecimalsMethod(_collateral).decimals()
                )
            );
    }

    function convert18DecimalsToCollateralAmount(
        address _collateral,
        Decimal.decimal memory _decimalAmount
    ) internal view returns (uint256) {
        //18 decimals to collateral decimals
        return
            _decimalAmount
                .divScalar(
                10**(18 - IERC20WithDecimalsMethod(_collateral).decimals())
            )
                .toUint();
    }

    function convertUint256ToDecimal(uint256 _d)
        internal
        pure
        returns (Decimal.decimal memory)
    {
        return Decimal.decimal(_d);
    }

    function getTotalCollateral() public view override returns (uint256) {
        return
            convert18DecimalsToCollateralAmount(
                address(collateral),
                clearingHouseViewer
                    .getPersonalPositionWithFundingPayment(
                    ETH_USDC_AMM,
                    address(this)
                )
                    .margin
            );
    }

    function calcFee(IAmm _amm, Decimal.decimal memory _positionNotional)
        public
        view
        returns (Decimal.decimal memory)
    {
        (Decimal.decimal memory toll, Decimal.decimal memory spread) =
            _amm.calcFee(_positionNotional);
        return toll.addD(spread);
    }

    function getFundingPaymentNotReInvestedWithFees()
        public
        view
        override
        returns (int256 fundingPaymentNotReInvested)
    {}

    function reInvestFundingPayment(uint256) public override {}
}
