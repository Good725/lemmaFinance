// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

import {IPerpetualProtocol} from '../interfaces/IPerpetualProtocol.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import {
    SafeERC20
} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {IAmm, Decimal} from '../interfaces/IAmm.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {SignedDecimal} from '../utils/SignedDecimal.sol';
import {
    IERC20WithDecimalsMethod
} from '../interfaces/IERC20WithDecimalsMethod.sol';
import {IClearingHouse} from '../interfaces/IClearingHouse.sol';
import {IClearingHouseViewer} from '../interfaces/IClearingHouseViewer.sol';

/// @title Lemma Perpetual contract for interacting with perpetual protocol.
/// @author yashnaman
/// @dev All function calls are currently implemented.
contract LemmaPerpetual is OwnableUpgradeable, IPerpetualProtocol {
    using SafeERC20 for IERC20;
    using Decimal for Decimal.decimal;
    using SignedDecimal for SignedDecimal.signedDecimal;

    IClearingHouse public clearingHouse;
    IClearingHouseViewer public clearingHouseViewer;
    IAmm public amm; //ETH-USDC
    IERC20 public collateral; //USDC
    address public lemmaToken; //lemmaXDAI and lemmaToken are interchangable
    //yield is denominated in ETH that is why every fundingPayment collected/paid in USDC needs to converted to ETH
    //below updates everytime fundingPayment gets converted to ETH
    //not neccesarily same as clearingHouse.getPosition(amm,address(this)).lastUpdatedCumulativePremiumFraction
    SignedDecimal.signedDecimal public lastUpdatedCumulativePremiumFraction;
    uint256 public maxSizeLimit;

    modifier onlyLemmaToken() {
        require(msg.sender == lemmaToken, 'Lemma: only lemma token allowed');
        _;
    }

    /// @notice Initialize proxy
    /// @param _clearingHouse Perpetual protocol's clearingHouse proxy contract address.
    /// @param _clearingHouseViewer Perpetual protocol's clearingHouseViewer proxy contract address.
    /// @param _amm undelryingAsset_collateral (ETH_USDC) AMM address.
    /// @param _collateral collateral address.
    function initialize(
        IClearingHouse _clearingHouse,
        IClearingHouseViewer _clearingHouseViewer,
        IAmm _amm,
        IERC20 _collateral,
        uint256 _maxSizeLimit
    ) public initializer {
        __Ownable_init();
        clearingHouse = _clearingHouse;
        clearingHouseViewer = _clearingHouseViewer;
        amm = _amm;
        collateral = _collateral;
        require(amm.quoteAsset() == _collateral, 'invalid collateral or amm');
        require(amm.open(), 'amm not open');
        setMaxSizeLimit(_maxSizeLimit);
        _collateral.safeApprove(address(_clearingHouse), type(uint256).max);
    }

    /// @notice set lemma token deployed on xdai network.
    /// @dev Only owner can call this function.
    /// @param _lemmaToken LemmaToken address of xdai network.
    function setLemmaToken(address _lemmaToken) external onlyOwner {
        lemmaToken = _lemmaToken;
    }

    /// @notice set Maximum size (ETH limit)
    /// @dev Only owner can call this function.
    /// @param _maxSizeLimit maximum size
    function setMaxSizeLimit(uint256 _maxSizeLimit) public onlyOwner {
        maxSizeLimit = _maxSizeLimit;
    }

    /// @notice go long on ETH
    /// @dev This function can be called through lemma token contract
    /// @param _amount The number of collateral to open perpetual protocol.
    function open(uint256 _amount)
        public
        override
        onlyLemmaToken
        returns (uint256 collateralAmount)
    {
        (
            Decimal.decimal memory assetAmount,
            Decimal.decimal memory leverage,
            Decimal.decimal memory baseAssetAmountLimit
        ) = calcInputsToPerp(_amount);

        clearingHouse.openPosition(
            amm,
            IClearingHouse.Side.BUY,
            assetAmount,
            leverage,
            baseAssetAmountLimit
        );

        collateralAmount = convert18DecimalsToCollateralAmount(
            address(collateral),
            assetAmount
        );

        IClearingHouse.Position memory position =
            clearingHouse.getPosition(amm, address(this));
        require(
            position.size.abs().toUint() <= maxSizeLimit,
            'maximum size Limit reached'
        );

        //if amm is not open then just let the transaction fail
        //do not do anything with it
    }

    /// @notice short ETH ,remove margin and give it back to lemmaToken
    /// @dev This function can be called through lemma token contract.
    /// @param _amount The number of collateral to be closed from perpetual protocol.
    function close(uint256 _amount)
        public
        override
        onlyLemmaToken
        returns (uint256 collateralAmount)
    {
        (
            Decimal.decimal memory assetAmount,
            Decimal.decimal memory leverage,
            Decimal.decimal memory baseAssetAmountLimit
        ) = calcInputsToPerp(_amount);
        if (amm.open()) {
            if (getTotalCollateral() == _amount) {
                clearingHouse.closePosition(amm, Decimal.zero());
                lastUpdatedCumulativePremiumFraction = SignedDecimal.zero();
            } else {
                clearingHouse.removeMargin(amm, calcFee(amm, assetAmount));
                clearingHouse.openPosition(
                    amm,
                    IClearingHouse.Side.SELL,
                    assetAmount,
                    leverage,
                    baseAssetAmountLimit
                );
                clearingHouse.removeMargin(amm, assetAmount);
            }
            collateralAmount = collateral.balanceOf(address(this));
        } else {
            ///after amm is closed clearing will transfer collateral here (once settle position is called)
            collateralAmount = _amount;
        }
        collateral.safeTransfer(lemmaToken, collateralAmount);
    }

    ///@notice reInvest the funding payment
    ///@param _baseAssetAmountLimit baseAssetAmountLimit
    function reInvestFundingPayment(uint256 _baseAssetAmountLimit)
        public
        override
        onlyLemmaToken
    {
        SignedDecimal.signedDecimal memory latestCumulativePremiumFraction =
            clearingHouse.getLatestCumulativePremiumFraction(amm);

        IClearingHouse.Position memory position =
            clearingHouse.getPosition(amm, address(this));

        //if it's the first reInvesting (or first time after entire position is closed) and lastUpdatedCumulativePremiumFraction is not updated yet
        if (lastUpdatedCumulativePremiumFraction.toInt() == 0) {
            lastUpdatedCumulativePremiumFraction = position
                .lastUpdatedCumulativePremiumFraction;
        }
        SignedDecimal.signedDecimal memory fundingPayment =
            getFundingPayment(position, latestCumulativePremiumFraction);

        if (fundingPayment.toInt() != 0) {
            if (!fundingPayment.isNegative()) {
                //remove the collateral equal to funding payment
                clearingHouse.removeMargin(amm, fundingPayment.abs());
                //open position with the funding Payments
                uint256 collateralFromFundingPayment =
                    collateral.balanceOf(address(this));
                (
                    Decimal.decimal memory assetAmount,
                    Decimal.decimal memory leverage,

                ) = calcInputsToPerp(collateralFromFundingPayment);

                clearingHouse.openPosition(
                    amm,
                    IClearingHouse.Side.BUY,
                    assetAmount,
                    leverage,
                    Decimal.decimal(_baseAssetAmountLimit)
                );
            } else {
                //in case of positive funding rate,increase the margin by fundingPayment.abs()
                Decimal.decimal memory assetAmount =
                    fundingPayment.abs().divD(
                        (
                            Decimal.one().subD(
                                (amm.tollRatio().addD(amm.spreadRatio()))
                            )
                        )
                    );
                clearingHouse.removeMargin(amm, calcFee(amm, assetAmount));

                //here levarage = 1 meaning quoteAssetAmount  = assetAmount * levarage = assetAmount
                Decimal.decimal memory leverage = Decimal.one();
                clearingHouse.openPosition(
                    amm,
                    IClearingHouse.Side.SELL,
                    assetAmount,
                    leverage,
                    Decimal.decimal(_baseAssetAmountLimit)
                );
            }
            lastUpdatedCumulativePremiumFraction = latestCumulativePremiumFraction;
        }
    }

    ///@notice will be called when AMM is closed to settle lemmaPerpetual's position
    function settlePosition() public {
        require(!amm.open(), 'amm is not closed');
        clearingHouse.settlePosition(amm);
    }

    ///@notice calculates input paramets for opening position on perpetual protcol
    ///@param _amount amount
    function calcInputsToPerp(uint256 _amount)
        internal
        view
        returns (
            Decimal.decimal memory assetAmount,
            Decimal.decimal memory leverage,
            Decimal.decimal memory baseAssetAmountLimit
        )
    {
        Decimal.decimal memory amount =
            convertCollteralAmountTo18Decimals(address(collateral), _amount);
        //following equation makes sure that amount = assetAmount + assetAmount * fees (fees = tollRatio + spreadRatio)
        assetAmount = amount.divD(
            (Decimal.one().addD((amm.tollRatio().addD(amm.spreadRatio()))))
        );
        //here levarage = 1 meaining quoteAssetAmount  = assetAmount * levarage = assetAmount
        leverage = Decimal.one();
        baseAssetAmountLimit = Decimal.zero();
    }

    /// @dev Convert collteral amount to 18 decimals
    /// @param _collateral The address of collateral.
    /// @param _amount The number of collateral to be converted to 18 decimals.
    function convertCollteralAmountTo18Decimals(
        address _collateral,
        uint256 _amount
    ) internal view returns (Decimal.decimal memory) {
        //_amount * 10^18 /10^collateralDecimals
        return
            (Decimal.decimal(_amount)).divD(
                Decimal.decimal(
                    10**IERC20WithDecimalsMethod(_collateral).decimals()
                )
            );
    }

    /// @dev Convert 18 decimals to amount according to collateral.
    /// @param _collateral The address of collateral.
    function convert18DecimalsToCollateralAmount(
        address _collateral,
        Decimal.decimal memory _decimalAmount
    ) internal view returns (uint256) {
        //same as perpetual protocol calulations
        // https://github.com/perpetual-protocol/perpetual-protocol/blob/master/src/utils/DecimalERC20.sol#L103

        return
            _decimalAmount.toUint() /
            (10**(18 - IERC20WithDecimalsMethod(_collateral).decimals()));
    }

    function convertUint256ToDecimal(uint256 _d)
        internal
        pure
        returns (Decimal.decimal memory)
    {
        return Decimal.decimal(_d);
    }

    /// @dev Return total collateral amount.
    function getTotalCollateral() public view override returns (uint256) {
        if (amm.open()) {
            return
                convert18DecimalsToCollateralAmount(
                    address(collateral),
                    clearingHouseViewer
                        .getPersonalPositionWithFundingPayment(
                        amm,
                        address(this)
                    )
                        .margin
                );
        } else {
            uint256 collateralBalance = collateral.balanceOf(address(this));
            //requires that someone has called settlePosition before trying to withdraw
            //because of below require statement the withdraw will fail if someone has not called settlePosition
            require(collateralBalance > 0, 'settlePosition not called');
            return collateralBalance;
        }
    }

    ///@notice calculates fees that will taken by perpetual protocol
    ///@param _amm AMM (ETH-USDC in this case)
    ///@param _positionNotional amount to put up as collateral * leverage
    function calcFee(IAmm _amm, Decimal.decimal memory _positionNotional)
        public
        view
        returns (Decimal.decimal memory)
    {
        (Decimal.decimal memory toll, Decimal.decimal memory spread) =
            _amm.calcFee(_positionNotional);
        return toll.addD(spread);
    }

    //recreated the equation to caclculate fundingPayment from from https://github.com/perpetual-protocol/perpetual-protocol/blob/ca394d424c7d34cbd7e193cf1f763327d0acb0fd/src/ClearingHouseViewer.sol#L109
    function getFundingPayment(
        IClearingHouse.Position memory _position,
        SignedDecimal.signedDecimal memory _latestCumulativePremiumFraction
    ) public view returns (SignedDecimal.signedDecimal memory) {
        return
            _position.size.toInt() == 0
                ? SignedDecimal.zero()
                : _latestCumulativePremiumFraction
                    .subD(lastUpdatedCumulativePremiumFraction)
                    .mulD(_position.size)
                    .mulScalar(-1);
    }

    function getFundingPaymentNotReInvestedWithFees()
        external
        view
        override
        returns (int256 fundingPaymentNotReInvestedWithFees)
    {
        SignedDecimal.signedDecimal memory latestCumulativePremiumFraction =
            clearingHouse.getLatestCumulativePremiumFraction(amm);

        IClearingHouse.Position memory position =
            clearingHouse.getPosition(amm, address(this));


            SignedDecimal.signedDecimal
                memory lastUpdatedCumulativePremiumFractionToConsider
         = lastUpdatedCumulativePremiumFraction;

        //if it's the first reInvesting (or first time after entire position is closed) and lastUpdatedCumulativePremiumFraction is not updated yet
        if (lastUpdatedCumulativePremiumFraction.toInt() == 0) {
            lastUpdatedCumulativePremiumFractionToConsider = position
                .lastUpdatedCumulativePremiumFraction;
        }

        SignedDecimal.signedDecimal memory fundingPaymentNotReInvested =
            position.size.toInt() == 0
                ? SignedDecimal.zero()
                : latestCumulativePremiumFraction
                    .subD(lastUpdatedCumulativePremiumFractionToConsider)
                    .mulD(position.size)
                    .mulScalar(-1);

        //fees to open position with on the position
        //fees would be substracted from the fundingPayment
        Decimal.decimal memory fees =
            calcFee(amm, fundingPaymentNotReInvested.abs());

        fundingPaymentNotReInvestedWithFees = (
            fundingPaymentNotReInvested.subD(
                SignedDecimal.signedDecimal(int256(fees.toUint()))
            )
        )
            .toInt();
    }
}
