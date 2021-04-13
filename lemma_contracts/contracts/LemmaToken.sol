// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

// import {
//     ERC20Upgradeable
// } from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
// import 'hardhat/console.sol';

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IPerpetualProtocol} from './interfaces/IPerpetualProtocol.sol';
import {IDEX} from './interfaces/IDEX.sol';
import {IERC677Receiver} from './interfaces/IERC677Receiver.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
// import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
// import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

//TODO: decide what contracts need to be upgradeable
// contract LemmaToken is ERC20Upgradeable {
contract LemmaToken is ERC20Upgradeable, OwnableUpgradeable {
    // IERC20Upgradeable public collateral =
    //     IERC20Upgradeable(0xe0B887D54e71329318a036CF50f30Dbe4444563c);
    // IERC20Upgradeable public underlyingAsset =
    //     IERC20Upgradeable(0x359eaF429cd6114c6fcb263dB04586Ad59177CAc); //WETH for testing //has faucet(uint256) method
    IERC20Upgradeable public collateral;
    IERC20Upgradeable public underlyingAsset;
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

    function initialize(
        IERC20Upgradeable _collateral,
        IERC20Upgradeable _underlyingAsset,
        IPerpetualProtocol _perpetualProtocol,
        IDEX _dex
    ) public initializer {
        __Ownable_init();
        __ERC20_init('LemmaUSDT', 'LUSDT');
        collateral = _collateral;
        underlyingAsset = _underlyingAsset;
        perpetualProtocol = _perpetualProtocol;
        dex = _dex;
    }

    function mint(uint256 _amount) external {
        collateral.transferFrom(msg.sender, address(this), _amount);

        // totalCollateralDeposited += _amount;

        //totalSupply is equal to the total USDC deposited

        uint256 halfAmount = _amount / 2;

        uint256 toMint;
        if (totalSupply() != 0) {
            toMint =
                (totalSupply() * halfAmount) /
                perpetualProtocol.getTotalCollateral();
        } else {
            //  just so that leUSDC minted is ~USDC deposited
            toMint = halfAmount * 2 * (10**(12)); //12 = 18 -6 = decimals of LUSDC - decimals of USDC
        }

        _mint(msg.sender, toMint);
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
    ) external returns (bool) {}
}
