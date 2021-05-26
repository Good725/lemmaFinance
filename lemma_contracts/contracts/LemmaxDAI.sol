// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {
    SafeERC20
} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

import {IPerpetualProtocol} from './interfaces/IPerpetualProtocol.sol';
import {IERC677Receiver} from './interfaces/IERC677Receiver.sol';
import {IMultiTokenMediator} from './interfaces/AMB/IMultiTokenMediator.sol';
import {IAMB} from './interfaces/AMB/IAMB.sol';

import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol';

interface ILemmaMainnet {
    function setWithdrawalInfo(
        address account,
        uint256 amount,
        uint256 minETHOut
    ) external;
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

    IERC20 public collateral;
    IPerpetualProtocol public perpetualProtocol; //at first it would be perpetual wrapper

    // mainnet AMB bridge contract
    IAMB public ambBridge;
    // mainnet multi-tokens mediator
    IMultiTokenMediator public multiTokenMediator;
    ILemmaMainnet public lemmaMainnet;
    uint256 public gasLimit;
    uint256 public feesFromProfit;
    int256 public amountOfLUSDCDeservedByLemmaVault;
    address public lemmaVault;
    address public lemmaReInvestor;
    mapping(address => uint256) public depositInfo;
    mapping(address => uint256) public minLUSDCOut;

    event USDCDeposited(address indexed account, uint256 indexed amount);
    event USDCWithdrawn(address indexed account, uint256 indexed amount);
    event DepositInfoAdded(address indexed account, uint256 indexed amount);

    /// @notice Initialize proxy
    function initialize(
        IERC20 _collateral,
        IPerpetualProtocol _perpetualProtocol,
        IAMB _ambBridge,
        IMultiTokenMediator _multiTokenMediator,
        address trustedForwarder,
        address _lemmaVault,
        uint256 _feesFromProfit, //1 per 10000
        address _lemmaReInvestor
    ) public initializer {
        __Ownable_init();
        __ERC20_init('LemmaUSDT', 'LUSDT');
        __ERC2771Context_init(trustedForwarder);
        collateral = _collateral;
        perpetualProtocol = _perpetualProtocol;
        ambBridge = _ambBridge;
        require(
            _ambBridge.sourceChainId() == block.chainid,
            'ambBridge chainId not valid'
        );
        multiTokenMediator = _multiTokenMediator;
        require(
            _multiTokenMediator.bridgeContract() == address(_ambBridge),
            'Invalid ambBridge/multiTokenMediator'
        );
        setGasLimit(1000000);
        setLemmaVault(_lemmaVault);
        setFeesFromProfit(_feesFromProfit);
        setLemmaReInvestor(_lemmaReInvestor);
    }

    function _msgSender()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (address sender)
    {
        //ERC2771ContextUpgradeable._msgSender();
        return super._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (bytes calldata)
    {
        //ERC2771ContextUpgradeable._msgData();
        return super._msgData();
    }

    /// @notice Set address of lemmaReInvestor which reInvests the funding Payment (at first it will simply just reInvest every hour)
    /// @dev Only owner can call this function.
    /// @param _lemmaReInvestor the vault
    function setLemmaReInvestor(address _lemmaReInvestor) public onlyOwner {
        lemmaReInvestor = _lemmaReInvestor;
    }

    /// @notice Set lemma valut that where the fees goes
    /// @dev Only owner can call this function.
    /// @param _lemmaVault the vault
    function setLemmaVault(address _lemmaVault) public onlyOwner {
        lemmaVault = _lemmaVault;
    }

    /// @notice Set percentage of fees that will taken from the profit
    /// @dev Only owner can call this function.
    /// @param _feesFromProfit fees percentage in 1 per 10000
    function setFeesFromProfit(uint256 _feesFromProfit) public onlyOwner {
        feesFromProfit = _feesFromProfit;
    }

    /// @notice Set lemma contract deployed on Mainnet.
    /// @dev Only owner can call this function.
    /// @param _lemmaMainnet is lemma contract address deployed on mainnet.
    function setLemmaMainnet(ILemmaMainnet _lemmaMainnet) public onlyOwner {
        lemmaMainnet = _lemmaMainnet;
    }

    /// @notice Set gas limit that is used to call bridge.
    /// @dev Only owner can set gas limit.
    function setGasLimit(uint256 _gasLimit) public onlyOwner {
        gasLimit = _gasLimit;
    }

    /// @notice Set info for minting lemma token.
    /// @dev This function is called by bridge contract when depositing USDC on mainnet.
    /// @param _account The account lemma token is minted to.
    /// @param _amount The amount of lemma token is minted.
    function setDepositInfo(
        address _account,
        uint256 _amount,
        uint256 _minLUSDCAmountOut
    ) external {
        require(_msgSender() == address(ambBridge), 'not ambBridge');
        require(
            ambBridge.messageSender() == address(lemmaMainnet),
            "ambBridge's messageSender is not lemmaMainnet"
        );
        depositInfo[_account] += _amount;
        minLUSDCOut[_account] = _minLUSDCAmountOut;
        emit DepositInfoAdded(_account, _amount);
    }

    /// @notice Set minimum withdrawn eth amount per user.
    /// @param _minLUSDCAmountOut Minimum ETH user should go long on perpetual protocol
    function setMinLUSDCOut(uint256 _minLUSDCAmountOut) external {
        minLUSDCOut[_msgSender()] = _minLUSDCAmountOut;
    }

    /// @notice Mint lemma token to _account on xdai network.
    /// @param _account The lemma token is minted to.
    function mint(address _account) public {
        uint256 amount = depositInfo[_account];
        uint256 minLUSDCAmountOut = minLUSDCOut[_account];
        delete depositInfo[_account];
        collateral.safeTransfer(address(perpetualProtocol), amount);

        uint256 totalCollateral = perpetualProtocol.getTotalCollateral();
        //open position on perpetual
        uint256 amountAfterOpeningPosition = perpetualProtocol.open(amount);

        uint256 toMint;
        if (totalSupply() != 0) {
            toMint =
                (totalSupply() * amountAfterOpeningPosition) /
                totalCollateral;
        } else {
            toMint = amountAfterOpeningPosition * (10**(12)); //12 = 18 -6 = decimals of LUSDC - decimals of USDC
        }
        require(toMint >= minLUSDCAmountOut, 'insufficient LUSDC amount');
        _mint(_account, toMint);

        emit USDCDeposited(_account, amountAfterOpeningPosition);
    }

    /// @notice Burn lemma tokens from msg.sender and set withdrawinfo to lemma contract of mainnet.
    /// @param _amount The number of lemma tokens to be burned.
    ///@param _minETHOut minimum ETH user should get back to protect users from frontrunning on mainnet
    function withdraw(
        uint256 _amount,
        uint256 _minETHOut,
        uint256 _minUSDCOut
    ) external {
        require(_amount > 0, 'input is 0');
        uint256 userShareAmountOfCollateral =
            (perpetualProtocol.getTotalCollateral() * _amount) / totalSupply();

        uint256 balance = balanceOf(_msgSender());
        _burn(_msgSender(), _amount);

        uint256 amountGotBackAfterClosing =
            perpetualProtocol.close(userShareAmountOfCollateral);

        require(
            amountGotBackAfterClosing >= _minUSDCOut,
            'insufficient USDC amount'
        );

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
                amountGotBackAfterClosing,
                _minETHOut
            );
        callBridge(address(lemmaMainnet), data, gasLimit);

        emit USDCWithdrawn(_msgSender(), amountGotBackAfterClosing);
    }

    /// @notice re-invest the funding Payment
    /// @dev only lemmaReInvestor can call this function (mainly to make sure that re-Investing transaction does not get frontrun by setting the right basAssetLimit)
    ///@param _baseAssetAmountLimit
    function reInvestFundingPayment(uint256 _baseAssetAmountLimit) public {
        require(
            _msgSender() == lemmaReInvestor,
            'only lemmaReInvestor is allowed'
        );
        int256 fundingPayment =
            perpetualProtocol.getFundingPaymentNotReInvestedWithFees();

        int256 totalCollateral =
            int256(perpetualProtocol.getTotalCollateral()) -
                (fundingPayment / 10**12);

        //10**16 = 10**12 + 10**4 (10**4 is becuase the fees are in 1/10000)
        int256 feesOnfundingPayment =
            (fundingPayment * int256(feesFromProfit)) / int256(10**16);

        int256 amountOfLUSDCToMintOrBurn =
            (int256(totalSupply()) * feesOnfundingPayment) / totalCollateral;

        amountOfLUSDCDeservedByLemmaVault += amountOfLUSDCToMintOrBurn;

        if (amountOfLUSDCDeservedByLemmaVault >= 0) {
            if (amountOfLUSDCDeservedByLemmaVault != 0) {
                _mint(lemmaVault, uint256(amountOfLUSDCDeservedByLemmaVault));
                amountOfLUSDCDeservedByLemmaVault = 0;
            }
        } else {
            uint256 amountOfLUSDCToBurn =
                uint256(0 - amountOfLUSDCDeservedByLemmaVault);
            if (amountOfLUSDCToBurn <= balanceOf(lemmaVault)) {
                _burn(lemmaVault, amountOfLUSDCToBurn);
                amountOfLUSDCDeservedByLemmaVault = 0;
            }
            //else lemmaVault won't get any fees till the protocol has remade the fees
        }

        perpetualProtocol.reInvestFundingPayment(_baseAssetAmountLimit);
    }

    //
    // INTERNAL
    //
    /// @dev This function is used for sending _token as _amount to _receiver via multiTokenMediator
    /// @param _token Token address to be sent.
    /// @param _receiver The address _token is sent to via multiTokenTransfer.
    /// @param _amount The number of _token to be sent.
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
    /// @param _data is ABI-encoded function data
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
