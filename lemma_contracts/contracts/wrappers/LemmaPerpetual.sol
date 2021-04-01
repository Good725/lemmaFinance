// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

import {IPerpetualProtocol} from '../interfaces/IPerpetualProtocol.sol';
import {IAmm, Decimal, IERC20} from '../interfaces/IAmm.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SignedDecimal} from '../utils/SignedDecimal.sol';

import 'hardhat/console.sol';

interface IClearingHouse {
    enum Side {BUY, SELL}

    function openPosition(
        IAmm _amm,
        Side _side,
        Decimal.decimal calldata _quoteAssetAmount,
        Decimal.decimal calldata _leverage,
        Decimal.decimal calldata _baseAssetAmountLimit
    ) external;

    function removeMargin(IAmm _amm, Decimal.decimal calldata _removedMargin)
        external;
}

interface IClearingHouseViewer {
    /// @notice This struct records personal position information
    /// @param size denominated in amm.baseAsset
    /// @param margin isolated margin
    /// @param openNotional the quoteAsset value of position when opening position. the cost of the position
    /// @param lastUpdatedCumulativePremiumFraction for calculating funding payment, record at the moment every time when trader open/reduce/close position
    /// @param liquidityHistoryIndex
    /// @param blockNumber the block number of the last position
    struct Position {
        SignedDecimal.signedDecimal size;
        Decimal.decimal margin;
        Decimal.decimal openNotional;
        SignedDecimal.signedDecimal lastUpdatedCumulativePremiumFraction;
        uint256 liquidityHistoryIndex;
        uint256 blockNumber;
    }

    function getPersonalBalanceWithFundingPayment(
        IERC20 _quoteToken,
        address _trader
    ) external view returns (Decimal.decimal memory margin);

    function getPersonalPositionWithFundingPayment(IAmm _amm, address _trader)
        external
        view
        returns (Position memory position);
}

interface IERC20WithDecimalsMethod {
    function decimals() external view returns (uint256);
}

contract LemmaPerpetual is Ownable, IPerpetualProtocol {
    IClearingHouse public immutable clearingHouse;
    IClearingHouseViewer public immutable clearingHouseViewer;
    IAmm public immutable ETH_USDC_AMM;
    IERC20 public immutable USDC;
    address public lemmaToken;

    using Decimal for Decimal.decimal;
    using SignedDecimal for SignedDecimal.signedDecimal;

    //mapping that maps AMMs to an underlying asset
    //only one collateral for now

    modifier onlyLemmaToken() {
        require(msg.sender == lemmaToken, 'Lemma: only lemma token allowed');
        _;
    }

    constructor(
        IClearingHouse _clearingHouse,
        IClearingHouseViewer _clearingHouseViewer,
        IAmm _ETH_USDC_AMM,
        IERC20 _USDC
    ) {
        clearingHouse = _clearingHouse;
        clearingHouseViewer = _clearingHouseViewer;
        ETH_USDC_AMM = _ETH_USDC_AMM;
        USDC = _USDC;
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
        returns (uint256)
    {
        // IERC20 quoteToken = ETH_USDC_AMM.quoteAsset();
        //open postion on perptual protcol
        return openPosition(_amount, IClearingHouse.Side.BUY);

        // console.log('margin');
        // console.log(
        //     clearingHouseViewer
        //         .getPersonalBalanceWithFundingPayment(USDC, address(this))
        //         .d
        // );
    }

    //close on which side needs to be decide by rebalacer logic
    //underlying asset needs to be given dynamically
    function close(uint256 _amount)
        external
        override
        onlyLemmaToken
        returns (uint256 _returnedCollateral)
    {
        _returnedCollateral = openPosition(_amount, IClearingHouse.Side.SELL);
        // USDC.transferFrom(address(this), lemmaToken, _returnedCollateral);
    }

    function convertCollteralAmountTo18Decimals(
        address _collateral,
        uint256 _amount
    ) internal view returns (Decimal.decimal memory) {
        //(10 ** 18 )* _amount / 10** collateral decimals
        // return
        //     (_amount * (1 ether)) /
        //     (10**IERC20WithDecimalsMethod(_collateral).decimals());
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

    // function getPosition()
    //     external
    //     view
    //     returns (IClearingHouse.Position memory pos)
    // {
    //     // get position on Perpetual protocol
    //     pos = clearingHouse.getPosition(ETH_USDC_AMM, address(this));
    // }

    //totalCollateral that the contract can get out at the moment
    // function getTotalCollateral() external view override returns (uint256) {
    //     return
    //         clearingHouseViewer
    //             .getPersonalBalanceWithFundingPayment(USDC, address(this))
    //             .toUint();
    // }

    function openPosition(uint256 _amount, IClearingHouse.Side _side)
        internal
        returns (uint256 _depositedAmount)
    {
        Decimal.decimal memory assetAmount =
            convertCollteralAmountTo18Decimals(address(USDC), _amount);
        console.log('assetAmount', assetAmount.toUint());
        Decimal.decimal memory leverage = Decimal.one();
        Decimal.decimal memory baseAssetAmount = Decimal.zero();

        //Will need to take this into account when leverage is > 1
        // Decimal.decimal memory positionNotional =
        //     quoteAssetAmount.mulD(leverage);

        Decimal.decimal memory tollRatio = ETH_USDC_AMM.tollRatio();
        Decimal.decimal memory spreadRatio = ETH_USDC_AMM.spreadRatio();

        Decimal.decimal memory quoteAssetAmount =
            assetAmount.divD(Decimal.one().addD(tollRatio.addD(spreadRatio)));

        console.log('tollRatio', tollRatio.toUint());
        console.log('spreadRatio', spreadRatio.toUint());
        console.log('quoteAssetAmount', quoteAssetAmount.toUint());

        console.log('amount', _amount);
        console.log(
            'the actual amount should be equal to amount',
            convert18DecimalsToCollateralAmount(
                address(USDC),
                quoteAssetAmount.addD(
                    quoteAssetAmount.mulD(tollRatio.addD(spreadRatio))
                )
            )
        );

        if (_side == IClearingHouse.Side.SELL) {
            console.log('in');
            clearingHouse.openPosition(
                ETH_USDC_AMM,
                _side,
                assetAmount,
                leverage,
                baseAssetAmount
            );
            clearingHouse.removeMargin(ETH_USDC_AMM, assetAmount);
            console.log(
                'usdc balanceOf LemmaPerpetual: ',
                USDC.balanceOf(address(this))
            );
            console.log(
                'to Transfer',
                convert18DecimalsToCollateralAmount(address(USDC), assetAmount)
            );

            //TODO: add require that leverage should not be greater than one
            USDC.transfer(
                lemmaToken,
                convert18DecimalsToCollateralAmount(address(USDC), assetAmount)
            );

            console.log(
                'magin after closing',
                clearingHouseViewer
                    .getPersonalPositionWithFundingPayment(
                    ETH_USDC_AMM,
                    address(this)
                )
                    .margin
                    .toUint()
            );
            // console.log(
            //     'size after closing',
            //     clearingHouseViewer
            //         .getPersonalPositionWithFundingPayment(
            //         ETH_USDC_AMM,
            //         address(this)
            //     )
            //         .size
            //         .toInt()
            // );
            console.log(
                'openNotional after closing',
                clearingHouseViewer
                    .getPersonalPositionWithFundingPayment(
                    ETH_USDC_AMM,
                    address(this)
                )
                    .openNotional
                    .toUint()
            );
        } else {
            clearingHouse.openPosition(
                ETH_USDC_AMM,
                _side,
                quoteAssetAmount,
                leverage,
                baseAssetAmount
            );
        }
        //TODO: improve this calculations
        return
            convert18DecimalsToCollateralAmount(
                address(USDC),
                quoteAssetAmount
            );
    }

    function getTotalCollateral() external view override returns (uint256) {
        return
            convert18DecimalsToCollateralAmount(
                address(USDC),
                clearingHouseViewer
                    .getPersonalPositionWithFundingPayment(
                    ETH_USDC_AMM,
                    address(this)
                )
                    .margin
            );
    }

    function fees(uint256 _amount) external view override returns (uint256) {
        //asumes that leverage = 1
        return
            convert18DecimalsToCollateralAmount(
                address(USDC),
                calcFee(
                    ETH_USDC_AMM,
                    convertCollteralAmountTo18Decimals(address(USDC), _amount)
                )
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
}
