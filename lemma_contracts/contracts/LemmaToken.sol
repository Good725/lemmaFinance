// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

import {
    ERC20Upgradeable
} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IPerpetualProtocol} from './interfaces/IPerpetualProtocol.sol';
import {IDEX} from './interfaces/IDEX.sol';

contract LemmaToken is ERC20Upgradeable {
    IERC20 public collateral =
        IERC20(0xe0B887D54e71329318a036CF50f30Dbe4444563c);
    IERC20 public underlyingAsset =
        IERC20(0x359eaF429cd6114c6fcb263dB04586Ad59177CAc); //WETH for testing //has faucet(uint256) method
    IPerpetualProtocol public perpetualProtocol; //at first it would be perpetual wrapper
    IDEX public dex;
    uint256 public totalCollateralDeposited;
    uint256 private constant ONE_18 = 10**18;

    //mappping of protocols to wrappers
    //mapping of protocol to collateral
    //underlying assets supported

    function initlialize() public initializer {
        __ERC20_init('LemmaUSDC', 'LUSDC');
    }

    function mint(uint256 _amount) external {
        collateral.transferFrom(msg.sender, address(this), _amount);

        uint256 halfAmount = _amount / 2;
        collateral.transfer(address(perpetualProtocol), halfAmount);
        perpetualProtocol.open(halfAmount);

        collateral.transfer(address(dex), halfAmount);
        dex.buyUnderlyingAsset(
            address(collateral),
            halfAmount,
            address(underlyingAsset)
        );

        uint256 toMint = (totalSupply() * _amount) / totalCollateralDeposited;

        //require(toMint>=minimumToMint)
        _mint(msg.sender, toMint);
        totalCollateralDeposited += _amount;
    }

    function redeem(uint256 _amount) external {
        _burn(msg.sender, _amount);

        uint256 userShareAmount =
            (totalCollateralDeposited * _amount) / totalSupply();

        uint256 halfUserShareAmount = userShareAmount / 2;
        //how much underlying asset to transfer to get back the halfAmount?
        uint256 underlyingTokenAmountRequired =
            dex.getUnderlyingTokenAmountRequired(
                address(collateral),
                halfUserShareAmount,
                address(underlyingAsset)
            ); //?
        underlyingAsset.transfer(address(dex), underlyingTokenAmountRequired);
        dex.buyBackCollateral(
            address(collateral),
            halfUserShareAmount,
            address(underlyingAsset)
        );

        perpetualProtocol.close(halfUserShareAmount);

        collateral.transfer(msg.sender, userShareAmount);

        //require(userShare>=minimumUserShare)
    }
}
