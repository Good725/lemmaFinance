// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

// import {
//     ERC20Upgradeable
// } from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import 'hardhat/console.sol';

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IPerpetualProtocol} from './interfaces/IPerpetualProtocol.sol';
import {IDEX} from './interfaces/IDEX.sol';
import {IERC677Receiver} from './interfaces/IERC677Receiver.sol';

//TODO: decide what contracts need to be upgradeable
// contract LemmaToken is ERC20Upgradeable {
contract LemmaToken is ERC20('LemmaUSDC', 'LUSDC'), IERC677Receiver {
    IERC20 public collateral =
        IERC20(0xe0B887D54e71329318a036CF50f30Dbe4444563c);
    IERC20 public underlyingAsset =
        IERC20(0x359eaF429cd6114c6fcb263dB04586Ad59177CAc); //WETH for testing //has faucet(uint256) method
    IPerpetualProtocol public perpetualProtocol; //at first it would be perpetual wrapper
    IDEX public dex;
    uint256 public totalCollateralDeposited;
    uint256 public totalUnderlyingAssetBought;
    uint256 private constant ONE_18 = 10**18;

    //mappping of protocols to wrappers
    //mapping of protocol to collateral
    //underlying assets supported

    // function initlialize() public initializer {
    //     __ERC20_init('LemmaUSDC', 'LUSDC');
    // }

    constructor(
        IERC20 _collateral,
        IERC20 _underlyingAsset,
        IPerpetualProtocol _perpetualProtocol,
        IDEX _dex
    ) {
        collateral = _collateral;
        underlyingAsset = _underlyingAsset;
        perpetualProtocol = _perpetualProtocol;
        dex = _dex;
    }

    function mint(uint256 _amount) external {
        collateral.transferFrom(msg.sender, address(this), _amount);

        // totalCollateralDeposited += _amount;
        _mint(msg.sender, _amount);
        //totalSupply is equal to the total USDC deposited

        uint256 halfAmount = _amount / 2;
        //fees to open position on perpetual
        uint256 feesForOpeningAPositionOnPerpetual =
            perpetualProtocol.fees(halfAmount);

        collateral.transfer(
            address(perpetualProtocol),
            halfAmount + feesForOpeningAPositionOnPerpetual
        );
        //open position on perpetual
        perpetualProtocol.open(halfAmount);
        //Is it equal to halfAmount - feesForOpeningAPositionOnPerpetual
        uint256 buyUnderlyingAssetWithAmount =
            _amount - halfAmount - feesForOpeningAPositionOnPerpetual;
        collateral.transfer(address(dex), buyUnderlyingAssetWithAmount);
        //buy underlying asset
        uint256 underlyingAssetBought =
            dex.swap(
                address(collateral),
                buyUnderlyingAssetWithAmount,
                address(underlyingAsset)
            );

        totalUnderlyingAssetBought += underlyingAssetBought;

        // //require(toMint>=minimumToMint)
    }

    function redeem(uint256 _amount) external {
        uint256 userShareAmountOfCollateral =
            (perpetualProtocol.getTotalCollateral() * _amount) / totalSupply();

        uint256 userShareAmountOfUnderlyingToken =
            (totalUnderlyingAssetBought * _amount) / totalSupply();

        _burn(msg.sender, _amount);

        totalUnderlyingAssetBought -= userShareAmountOfUnderlyingToken;
        underlyingAsset.transfer(
            address(dex),
            userShareAmountOfUnderlyingToken
        );
        //sell underlying asset
        uint256 collateralAmountFromSellingUnderlyingAsset =
            dex.swap(
                address(underlyingAsset),
                userShareAmountOfUnderlyingToken,
                address(collateral)
            );
        //close on perpetual
        uint256 perpetualProtocolFees =
            perpetualProtocol.fees(userShareAmountOfCollateral);

        collateral.transfer(address(perpetualProtocol), perpetualProtocolFees);

        perpetualProtocol.close(userShareAmountOfCollateral);

        //require(userShare>=minimumUserShare)

        //withdraw
        collateral.transfer(
            msg.sender,
            userShareAmountOfCollateral +
                collateralAmountFromSellingUnderlyingAsset -
                perpetualProtocolFees
        );
    }

    //maybe we can use this later
    function onTokenTransfer(
        address from,
        uint256 amount,
        bytes calldata data
    ) external override returns (bool) {}
}
