// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

// import {
//     ERC20Upgradeable
// } from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
// import 'hardhat/console.sol';

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

import {IPerpetualProtocol} from './interfaces/IPerpetualProtocol.sol';
import {IDEX} from './interfaces/IDEX.sol';
import {IERC677Receiver} from './interfaces/IERC677Receiver.sol';
import {IMultiTokenMediator} from './interfaces/AMB/IMultiTokenMediator.sol';
import {IAMB} from './interfaces/AMB/IAMB.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
// import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import 'hardhat/console.sol';

// import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

//TODO: decide what contracts need to be upgradeable
// contract LemmaToken is ERC20Upgradeable {

interface ILemmaMainnet {
    function setWithdrawalInfo(address account, uint256 amount) external;
}

contract LemmaToken is ERC20Upgradeable, OwnableUpgradeable {
    // IERC20Upgradeable public collateral =
    //     IERC20Upgradeable(0xe0B887D54e71329318a036CF50f30Dbe4444563c);
    // IERC20Upgradeable public underlyingAsset =
    //     IERC20Upgradeable(0x359eaF429cd6114c6fcb263dB04586Ad59177CAc); //WETH for testing //has faucet(uint256) method
    IERC20 public collateral;
    IERC20 public underlyingAsset;
    IPerpetualProtocol public perpetualProtocol; //at first it would be perpetual wrapper

    // mainnet AMB bridge contract
    IAMB public ambBridge;
    // mainnet multi-tokens mediator
    IMultiTokenMediator public multiTokenMediator;
    ILemmaMainnet public lemmaMainnet;
    uint256 public gasLimit;

    mapping(address => uint256) public depositInfo;

    //mappping of protocols to wrappers
    //mapping of protocol to collateral
    //underlying assets supported

    // function initlialize() public initializer {
    //     __ERC20_init('LemmaUSDC', 'LUSDC');
    // }

    function initialize(
        IERC20 _collateral,
        IPerpetualProtocol _perpetualProtocol,
        IAMB _ambBridge,
        IMultiTokenMediator _multiTokenMediator,
        ILemmaMainnet _lemmaMainnet
    ) public initializer {
        __Ownable_init();
        __ERC20_init('LemmaUSDT', 'LUSDT');
        collateral = _collateral;
        perpetualProtocol = _perpetualProtocol;
        ambBridge = _ambBridge;
        multiTokenMediator = _multiTokenMediator;
        lemmaMainnet = _lemmaMainnet;
        gasLimit = 1000000;
    }

    function setDepositInfo(address _account, uint256 _amount) external {
        require(msg.sender == address(ambBridge));
        require(ambBridge.messageSender() == address(lemmaMainnet));
        depositInfo[_account] = _amount;
    }

    function mint(address _account) external {
        uint256 amount = depositInfo[_account];
        //totalSupply is equal to the total USDC deposited

        uint256 toMint;
        if (totalSupply() != 0) {
            toMint =
                (totalSupply() * amount) /
                perpetualProtocol.getTotalCollateral();
        } else {
            //  just so that leUSDC minted is ~USDC deposited
            toMint = amount * (10**(12)); //12 = 18 -6 = decimals of LUSDC - decimals of USDC
        }

        _mint(msg.sender, toMint);

        collateral.transfer(address(perpetualProtocol), amount);
        //open position on perpetual
        perpetualProtocol.open(amount);

        // //require(toMint>=minimumToMint)
    }

    function withdraw(uint256 _amount) external {
        uint256 userShareAmountOfCollateral =
            (perpetualProtocol.getTotalCollateral() * _amount) / totalSupply();
        _burn(msg.sender, _amount);

        perpetualProtocol.close(userShareAmountOfCollateral);

        //require(userShare>=minimumUserShare)

        //withdraw
        collateral.transfer(msg.sender, userShareAmountOfCollateral);

        multiTokenTransfer(
            collateral,
            address(lemmaMainnet),
            userShareAmountOfCollateral
        );

        //now realy the depositInfo to lemmaXDAI
        bytes4 functionSelector = ILemmaMainnet.setWithdrawalInfo.selector;
        bytes memory data =
            abi.encodeWithSelector(
                functionSelector,
                msg.sender,
                userShareAmountOfCollateral
            );
        callBridge(address(lemmaMainnet), data, gasLimit);
    }

    //maybe we can use this later
    function onTokenTransfer(
        address from,
        uint256 amount,
        bytes calldata data
    ) external returns (bool) {}

    //
    // INTERNAL
    //
    function multiTokenTransfer(
        IERC20 _token,
        address _receiver,
        uint256 _amount
    ) internal {
        require(_receiver != address(0), 'receiver is empty');
        // approve to multi token mediator and call 'relayTokens'
        _token.approve(address(multiTokenMediator), _amount);
        console.log('relaying');
        multiTokenMediator.relayTokens(address(_token), _receiver, _amount);
        console.log('relayed tokens successfully');
    }

    function callBridge(
        address _contractOnOtherSide,
        bytes memory _data,
        uint256 _gasLimit
    ) internal returns (bytes32 messageId) {
        // server can check event, `UserRequestForAffirmation(bytes32 indexed messageId, bytes encodedData)`,
        // emitted by amb bridge contract
        messageId = ambBridge.requireToPassMessage(
            _contractOnOtherSide,
            _data,
            _gasLimit
        );
    }
}
