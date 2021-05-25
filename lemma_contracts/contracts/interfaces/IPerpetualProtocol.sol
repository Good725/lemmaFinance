// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

interface IPerpetualProtocol {
    function open(uint256 amount) external returns (uint256 collateralAmount);

    function close(uint256 amount) external returns (uint256 collateralAmount);

    function getTotalCollateral() external view returns (uint256);

    function getFundingPaymentNotReInvestedWithFees()
        external
        view
        returns (int256 fundingPaymentNotReInvested);

    function reInvestFundingPayment() external;
}
