// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;
import {IPerpetualProtocol} from '../interfaces/IPerpetualProtocol.sol';

contract MockLemmaPerpetual is IPerpetualProtocol {
    uint256 totalCollateral;
    int256 fundingPaymentNotReInvested;

    function setTotalCollateralAndFundinPaymentWithFees(
        uint256 _totalCollateral,
        int256 _fundingPaymentNotReInvested
    ) external {
        totalCollateral = _totalCollateral;
        fundingPaymentNotReInvested = _fundingPaymentNotReInvested;
    }

    function getTotalCollateral() external view override returns (uint256) {
        return totalCollateral;
    }

    function reInvestFundingPayment(uint256 _baseAssetAmountLimit)
        external
        override
    {}

    function getFundingPaymentNotReInvestedWithFees()
        external
        view
        override
        returns (
            int256 /**fundingPaymentNotReInvested*/
        )
    {
        return fundingPaymentNotReInvested;
    }

    function open(
        uint256 /**amount*/
    )
        external
        override
        returns (
            uint256 /**collateralAmount*/
        )
    {}

    function close(
        uint256 /**amount*/
    )
        external
        override
        returns (
            uint256 /**collateralAmount*/
        )
    {}
}
