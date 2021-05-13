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
        IERC20 _collateral
    ) public initializer {
        __Ownable_init();
        clearingHouse = _clearingHouse;
        clearingHouseViewer = _clearingHouseViewer;
        amm = _amm;
        collateral = _collateral;
        _collateral.safeApprove(address(_clearingHouse), type(uint256).max);
    }

    /// @notice set lemma token deployed on xdai network.
    /// @dev Only owner can call this function.
    /// @param _lemmaToken LemmaToken address of xdai network.
    function setLemmaToken(address _lemmaToken) external onlyOwner {
        lemmaToken = _lemmaToken;
    }

    /// @notice open on which side needs to decided by rebalancer logic
    /// @dev This function can be called through lemma token contract
    /// @param _amount The number of collateral to open perpetual protocol.
    function open(uint256 _amount)
        external
        override
        onlyLemmaToken
        returns (uint256)
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
        return
            convert18DecimalsToCollateralAmount(
                address(collateral),
                assetAmount
            );
    }

    /// @notice close on which side needs to be decide by rebalacer logic
    /// @dev This function can be called through lemma token contract.
    /// @param _amount The number of collateral to be closed from perpetual protocol.
    function close(uint256 _amount)
        external
        override
        onlyLemmaToken
        returns (uint256)
    {
        (
            Decimal.decimal memory assetAmount,
            Decimal.decimal memory leverage,
            Decimal.decimal memory baseAssetAmountLimit
        ) = calcInputsToPerp(_amount);

        if (getTotalCollateral() == _amount) {
            clearingHouse.closePosition(amm, Decimal.zero());
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

        uint256 collateralBalance = collateral.balanceOf(address(this));

        collateral.safeTransfer(lemmaToken, collateralBalance);

        return collateralBalance;
    }

    ///@notice calculates input paramets for opening position on perpetual protcol
    ///@param _amount amount
    function calcInputsToPerp(uint256 _amount)
        internal
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
        return
            convert18DecimalsToCollateralAmount(
                address(collateral),
                clearingHouseViewer
                    .getPersonalPositionWithFundingPayment(amm, address(this))
                    .margin
            );
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
}
