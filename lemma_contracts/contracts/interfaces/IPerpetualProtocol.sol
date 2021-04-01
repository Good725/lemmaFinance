// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

interface IPerpetualProtocol {
    function open(uint256 amount) external;

    function close(uint256 amount) external;

    function getTotalCollateral() external view returns (uint256);

    function fees(uint256 amount) external view returns (uint256);
}
