// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface IPerpetualProtocol {
    function open(uint256 amount) external returns (uint256 collateralAmount);

    function close(uint256 amount) external returns (uint256 collateralAmount);

    function getTotalCollateral() external view returns (uint256);

    function reInvestFundingPayment() external;

    function getFundingPaymentNotReInvestedWithFees()
        external
        view
        returns (int256 fundingPaymentNotReInvested);
}
