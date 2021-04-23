// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.3;

import {Decimal, IAmm} from './IAmm.sol';
import {SignedDecimal} from '../utils/SignedDecimal.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

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
