// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

import {IPerpetualProtocol} from '../interfaces/IPerpetualProtocol.sol';
import {IAmm, Decimal, IERC20} from '../interfaces/IAmm.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {SignedDecimal} from '../utils/SignedDecimal.sol';

interface IClearingHouse {
    enum Side {BUY, SELL}

    struct Position {
        SignedDecimal.signedDecimal size;
        Decimal.decimal margin;
        Decimal.decimal openNotional;
        SignedDecimal.signedDecimal lastUpdatedCumulativePremiumFraction;
        uint256 liquidityHistoryIndex;
        uint256 blockNumber;
    }

    function openPosition(
        IAmm _amm,
        Side _side,
        Decimal.decimal calldata _quoteAssetAmount,
        Decimal.decimal calldata _leverage,
        Decimal.decimal calldata _baseAssetAmountLimit
    ) external;

    function removeMargin(IAmm _amm, Decimal.decimal calldata _removedMargin)
        external;

    function getPosition(IAmm _amm, address _trader) public returns (Struct);
}

contract LemmaPerpetual is Ownable, IPerpetualProtocol {
    IClearingHouse public clearingHouse;
    IAmm public ETH_USDC_AMM;
    IERC20 public USDC;
    address public lemmaToken;

    //mapping that maps AMMs to an underlying asset
    //only one collateral for now

    modifier onlyLemmaToken() {
        require(msg.sender == lemmaToken, 'Lemma: only lemma token allowed');
        _;
    }

    constructor(
        IClearingHouse _clearingHouse,
        IAmm _ETH_USDC_AMM,
        IERC20 _USDC
    ) {
        clearingHouse = _clearingHouse;
        ETH_USDC_AMM = _ETH_USDC_AMM;
        USDC = _USDC;
        USDC.approve(address(clearingHouse), type(uint256).max);
    }

    function setLemmaToken(address _lemmaToken) external onlyOwner {
        lemmaToken = _lemmaToken;
    }

    //open on which side needs to decided by rebalancer logic
    //underlying asset needs to be given dynamically
    function open(uint256 amount) external override onlyLemmaToken {
        // IERC20 quoteToken = ETH_USDC_AMM.quoteAsset();
        //open postion on perptual protcol
        clearingHouse.openPosition(
            ETH_USDC_AMM,
            IClearingHouse.Side.BUY,
            Decimal.decimal(amount),
            Decimal.decimal(1), //leverage
            Decimal.decimal(0) //_baseAssetAmountLimit
        );
    }

    //close on which side needs to be decide by rebalacer logic
    //underlying asset needs to be given dynamically
    function close(uint256 amount) external override onlyLemmaToken {
        //open postion on perptual protcol
        clearingHouse.openPosition(
            ETH_USDC_AMM,
            IClearingHouse.Side.SELL,
            Decimal.decimal(amount),
            Decimal.decimal(1), //leverage
            Decimal.decimal(0) //_baseAssetAmountLimit
        );

        USDC.transferFrom(address(this), lemmaToken, amount);
    }

    function getPosition() external override onlyLemmaToken {
        // get position on Perpetual protocol
        Position memory pos = clearingHouse.getPosition(ETH_USDC_AMM, address(this));
    }
}
