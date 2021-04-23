// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.3;
import {IAmm, Decimal} from './IAmm.sol';

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

    function closePosition(
        IAmm _amm,
        Decimal.decimal calldata _quoteAssetAmountLimit
    ) external;
}
