// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

interface IPerpetualProtocol {
    function open(uint256 amount) external returns (uint256);

    function close(uint256 amount) external returns (uint256);

    function getTotalCollateral() external view returns (uint256);
}
