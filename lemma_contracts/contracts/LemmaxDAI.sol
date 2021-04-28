// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

// import {
//     ERC20Upgradeable
// } from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
// import 'hardhat/console.sol';

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {
    SafeERC20
} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

import {IPerpetualProtocol} from './interfaces/IPerpetualProtocol.sol';
import {IDEX} from './interfaces/IDEX.sol';
import {IERC677Receiver} from './interfaces/IERC677Receiver.sol';
import {IMultiTokenMediator} from './interfaces/AMB/IMultiTokenMediator.sol';
import {IAMB} from './interfaces/AMB/IAMB.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
// import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol';

// import 'hardhat/console.sol';

interface ILemmaMainnet {
    function setWithdrawalInfo(address account, uint256 amount) external;
}

/// @title Lemma token Contract for XDai network.
/// @author yashnaman
/// @dev All function calls are currently implemented.
contract LemmaToken is
    ERC20Upgradeable,
    OwnableUpgradeable,
    ERC2771ContextUpgradeable
{
    using SafeERC20 for IERC20;
    // IERC20Upgradeable public collateral =
    //     IERC20Upgradeable(0xe0B887D54e71329318a036CF50f30Dbe4444563c);
    // IERC20Upgradeable public underlyingAsset =
    //     IERC20Upgradeable(0x359eaF429cd6114c6fcb263dB04586Ad59177CAc); //WETH for testing //has faucet(uint256) method
    IERC20 public collateral;
    IPerpetualProtocol public perpetualProtocol; //at first it would be perpetual wrapper

    // mainnet AMB bridge contract
    IAMB public ambBridge;
    // mainnet multi-tokens mediator
    IMultiTokenMediator public multiTokenMediator;
    ILemmaMainnet public lemmaMainnet;
    uint256 public gasLimit;

    mapping(address => uint256) public depositInfo;

    event USDCDeposited(address indexed account, uint256 indexed amount);
    event USDCWithdrawed(address indexed account, uint256 indexed amount);
    event DepositInfoAdded(address indexed account, uint256 indexed amount);

    //mappping of protocols to wrappers
    //mapping of protocol to collateral
    //underlying assets supported
    /// @notice Initialize proxy
    function initialize(
        IERC20 _collateral,
        IPerpetualProtocol _perpetualProtocol,
        IAMB _ambBridge,
        IMultiTokenMediator _multiTokenMediator,
        address trustedForwarder
    )
        public
        // ILemmaMainnet _lemmaMainnet
        initializer
    {
        __Ownable_init();
        __ERC20_init('LemmaUSDT', 'LUSDT');
        __ERC2771Context_init(trustedForwarder);
        collateral = _collateral;
        perpetualProtocol = _perpetualProtocol;
        ambBridge = _ambBridge;
        multiTokenMediator = _multiTokenMediator;
        // lemmaMainnet = _lemmaMainnet;
        gasLimit = 1000000;
    }

    function _msgSender()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (address sender)
    {
        //replace it with super._msgSender() after making sure that ERC2771ContextUpgradeable is the immediate parent
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (bytes calldata)
    {
        //replace it with super._msgSender() after making sure that ERC2771ContextUpgradeable is the immediate parent
        return ERC2771ContextUpgradeable._msgData();
    }

    /// @notice Set lemma contract deployed on Mainnet.
    /// @dev Only owner can call this function.
    /// @param _lemmaMainnet is lemma contract address deployed on mainnet.
    function setLemmaMainnet(ILemmaMainnet _lemmaMainnet) external onlyOwner {
        lemmaMainnet = _lemmaMainnet;
    }
    
    /// @notice Set gas limit that is used to call bridge.
    /// @dev Only owner can set gas limit.
    function setGasLimit(uint256 _gasLimit) external onlyOwner {
        gasLimit = _gasLimit;
    }

    /// @notice Set info for minting lemma token.
    /// @dev This function is called by bridge contract when depositing USDC on mainnet.
    /// @param account The account lemma token is minted to.
    /// @param amount The amount of lemma token is minted.
    function setDepositInfo(address _account, uint256 _amount) external {
        require(_msgSender() == address(ambBridge));
        require(ambBridge.messageSender() == address(lemmaMainnet));
        depositInfo[_account] += _amount;
        emit DepositInfoAdded(_account, _amount);
        //if AMB call is done after relaying of tokens
        if (collateral.balanceOf(address(this)) >= depositInfo[_account]) {
            mint(_account);
        }
    }

    /// @notice Mint lemma token on xdai network.
    /// @param account The lemma token is minted to.
    function mint(address _account) public {
        uint256 amount = depositInfo[_account];
        delete depositInfo[_account];
        //totalSupply is equal to the total USDC deposited

        uint256 toMint;
        if (totalSupply() != 0) {
            toMint =
                (totalSupply() * amount) /
                perpetualProtocol.getTotalCollateral();
        } else {
            //  just so that lUSDC minted is ~USDC deposited
            toMint = amount * (10**(12)); //12 = 18 -6 = decimals of LUSDC - decimals of USDC
        }

        _mint(_account, toMint);

        collateral.safeTransfer(address(perpetualProtocol), amount);
        //open position on perpetual
        perpetualProtocol.open(amount);

        emit USDCDeposited(_account, amount);

        // //require(toMint>=minimumToMint)
    }

    /// @notice Burn lemma tokens and set withdrawinfo to lemma contract of mainnet.
    /// @param amount The number of lemma tokens to be burned.
    function withdraw(uint256 _amount) external {
        uint256 userShareAmountOfCollateral =
            (perpetualProtocol.getTotalCollateral() * _amount) / totalSupply();
        _burn(_msgSender(), _amount);

        uint256 amountGotBackAfterClosing =
            perpetualProtocol.close(userShareAmountOfCollateral);

        //require(userShare>=minimumUserShare)

        //withdraw
        multiTokenTransfer(
            collateral,
            address(lemmaMainnet),
            amountGotBackAfterClosing
        );

        //now realy the depositInfo to lemmaXDAI
        bytes4 functionSelector = ILemmaMainnet.setWithdrawalInfo.selector;
        bytes memory data =
            abi.encodeWithSelector(
                functionSelector,
                _msgSender(),
                amountGotBackAfterClosing
            );
        callBridge(address(lemmaMainnet), data, gasLimit);

        emit USDCWithdrawed(_msgSender(), amountGotBackAfterClosing);
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
    /// @dev This function is used for sending USDC to multiTokenMediator
    function multiTokenTransfer(
        IERC20 _token,
        address _receiver,
        uint256 _amount
    ) internal {
        require(_receiver != address(0), 'receiver is empty');
        // approve to multi token mediator and call 'relayTokens'
        _token.safeApprove(address(multiTokenMediator), _amount);
        multiTokenMediator.relayTokens(address(_token), _receiver, _amount);
    }
    /// @param _contractOnOtherSide is lemma toke address deployed on mainnet network
    /// @param _data is ABI-encodes
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
