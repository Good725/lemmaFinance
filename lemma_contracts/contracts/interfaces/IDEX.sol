// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.3;

interface IDEX {
    function swap(
        address _buyToken,
        uint256 _buyAmount,
        //add buyAmountMin
        address _sellToken
    ) external returns (uint256);

    // function buyBackCollateral(
    //     address _collateral,
    //     uint256 _collateralAmount,
    //     address _underlyingToken
    // ) external;

    // function getUnderlyingTokenAmountRequired(
    //     address _collateral,
    //     uint256 _collateralAmount,
    //     //add some protection so that not more than needed collateral gets converted into collateral
    //     address _underlyingToken
    // ) external view returns (uint256);
}
