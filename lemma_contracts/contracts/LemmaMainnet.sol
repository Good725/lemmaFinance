// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;
import {IAMB} from './interfaces/AMB/IAMB.sol';
import {IMultiTokenMediator} from './interfaces/AMB/IMultiTokenMediator.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {
    SafeERC20
} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol';

// import 'hardhat/console.sol';

interface IUniswapV2Router02 {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

interface ILemmaxDAI {
    function setDepositInfo(address account, uint256 amount) external;
}

contract LemmaMainnet is OwnableUpgradeable, ERC2771ContextUpgradeable {
    //USDT returns void (does not follow standard ERC20 that is why it is necessary)
    using SafeERC20 for IERC20;
    // xDai AMB bridge contract
    IAMB public ambBridge;
    // xDai multi-tokens mediator
    IMultiTokenMediator public multiTokenMediator;

    ILemmaxDAI public lemmaXDAI;
    uint256 public gasLimit;

    IERC20 public USDC;
    IERC20 public WETH;
    IUniswapV2Router02 public uniswapV2Router02;

    mapping(address => uint256) public withdrawalInfo;
    uint256 public totalUSDCDeposited;

    event ETHDeposited(address indexed account, uint256 indexed amount);
    event ETHWithdrawed(address indexed account, uint256 indexed amount);
    event WithdrawalInfoAdded(address indexed account, uint256 indexed amount);

    function initialize(
        IERC20 _USDC,
        IERC20 _WETH,
        ILemmaxDAI _lemmaXDAI,
        IUniswapV2Router02 _uniswapV2Router02,
        IAMB _ambBridge,
        IMultiTokenMediator _multiTokenMediator,
        address trustedForwarder
    ) public initializer {
        __Ownable_init();
        __ERC2771Context_init(trustedForwarder);
        USDC = _USDC;
        WETH = _WETH;
        lemmaXDAI = _lemmaXDAI;
        uniswapV2Router02 = _uniswapV2Router02;
        ambBridge = _ambBridge;
        multiTokenMediator = _multiTokenMediator;
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

    function setGasLimit(uint256 _gasLimit) external onlyOwner {
        gasLimit = _gasLimit;
    }

    function deposit(uint256 _minimumUSDCAmountOut) external payable {
        address[] memory path = new address[](2);
        path[0] = address(WETH);
        path[1] = address(USDC);

        uint256[] memory amounts =
            uniswapV2Router02.swapExactETHForTokens{value: msg.value}(
                _minimumUSDCAmountOut,
                path,
                address(this),
                type(uint256).max
            );

        multiTokenTransfer(USDC, address(lemmaXDAI), amounts[1]);

        //now realy the depositInfo to lemmaXDAI
        bytes4 functionSelector = ILemmaxDAI.setDepositInfo.selector;
        bytes memory data =
            abi.encodeWithSelector(functionSelector, _msgSender(), amounts[1]);
        callBridge(address(lemmaXDAI), data, gasLimit);
        emit ETHDeposited(_msgSender(), msg.value);
    }

    function setWithdrawalInfo(address _account, uint256 _amount) external {
        require(_msgSender() == address(ambBridge));
        require(ambBridge.messageSender() == address(lemmaXDAI));
        withdrawalInfo[_account] += _amount;
        emit WithdrawalInfoAdded(_account, _amount);
        if (USDC.balanceOf(address(this)) >= withdrawalInfo[_account]) {
            withdraw(_account);
        }
    }

    function withdraw(address _account) public {
        uint256 amount = withdrawalInfo[_account];
        delete withdrawalInfo[_account];
        address[] memory path = new address[](2);
        path[0] = address(USDC);
        path[1] = address(WETH);
        // uint256[] memory amounts =
        USDC.safeApprove(address(uniswapV2Router02), amount);
        uint256[] memory amounts =
            uniswapV2Router02.swapExactTokensForETH(
                amount,
                0, //TODO: figure out a way to get this from user
                path,
                _account,
                type(uint256).max
            );
        emit ETHWithdrawed(_account, amounts[1]);
    }

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
        _token.safeApprove(address(multiTokenMediator), _amount);
        multiTokenMediator.relayTokens(address(_token), _receiver, _amount);
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
