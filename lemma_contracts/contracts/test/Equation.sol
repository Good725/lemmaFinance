// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

import {IPerpetualProtocol} from '../interfaces/IPerpetualProtocol.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import {
    SafeERC20
} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
// import {IAmm, Decimal, IERC20} from '../interfaces/IAmm.sol';
// import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';
import {IAmm, Decimal} from '../interfaces/IAmm.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {SignedDecimal} from '../utils/SignedDecimal.sol';
import {
    IERC20WithDecimalsMethod
} from '../interfaces/IERC20WithDecimalsMethod.sol';
import {IClearingHouse} from '../interfaces/IClearingHouse.sol';
import {IClearingHouseViewer} from '../interfaces/IClearingHouseViewer.sol';

contract Equation{
    function testEquation(uint256 _inoutAmount) public returns (uint256 _outputAmount){
// Decimal.decimal memory assetAmount =
//             amount.divD(
//                 (
//                     Decimal.one().addD(
//                         (
//                             ETH_USDC_AMM.tollRatio().addD(
//                                 ETH_USDC_AMM.spreadRatio()
//                             )
//                         )
//                     )
//                 )
//             );
    } 
}