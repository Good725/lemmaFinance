// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.3;

//https://github.com/omni/omnibridge/tree/master/contracts
interface IMultiTokenMediator {
    function relayTokens(
        address token,
        address _receiver,
        uint256 _value
    ) external;

    function bridgeContract() external view returns (address);

    function HOME_TO_FOREIGN_FEE() external view returns (bytes32);

    function FOREIGN_TO_HOME_FEE() external view returns (bytes32);

    /**
     * @dev Calculates the amount of fee to pay for the value of the particular fee type.
     * @param _feeType type of the updated fee, can be one of [HOME_TO_FOREIGN_FEE, FOREIGN_TO_HOME_FEE].
     * @param _token address of the token contract for which fee should apply, 0x00..00 describes the initial fee for newly created tokens.
     * @param _value bridged value, for which fee should be evaluated.
     * @return amount of fee to be subtracted from the transferred value.
     */
    function calculateFee(
        bytes32 _feeType,
        address _token,
        uint256 _value
    ) external view returns (uint256);
}
