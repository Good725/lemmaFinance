// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;
import {IAMB} from './interfaces/AMB/IAMB.sol';
import {IMultiTokenMediator} from './interfaces/AMB/IMultiTokenMediator.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import 'hardhat/console.sol';

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function getAmountsOut(uint256 amountIn, address[] memory path)
        external
        view
        returns (uint256[] memory amounts);

    function getAmountsIn(uint256 amountOut, address[] memory path)
        external
        view
        returns (uint256[] memory amounts);
}

interface ILemmaxDAI {
    function setDepositInfo(address account, uint256 amount) external;
}

contract LemmaMainnet {
    // xDai AMB bridge contract
    IAMB public ambBridge;
    // xDai multi-tokens mediator
    IMultiTokenMediator public multiTokenMediator;

    ILemmaxDAI public lemmaXDAI;
    uint256 public gasLimit = 1000000;

    IERC20 public USDC;
    IERC20 public WETH;
    IUniswapV2Router02 public uniswapV2Router02;

    mapping(address => uint256) public withdrawalInfo;
    uint256 public totalUSDCDeposited;

    constructor(
        IERC20 _USDC,
        IERC20 _WETH,
        ILemmaxDAI _lemmaXDAI,
        IUniswapV2Router02 _uniswapV2Router02,
        IAMB _ambBridge,
        IMultiTokenMediator _multiTokenMediator
    ) {
        USDC = _USDC;
        WETH = _WETH;
        lemmaXDAI = _lemmaXDAI;
        uniswapV2Router02 = _uniswapV2Router02;
        ambBridge = _ambBridge;
        multiTokenMediator = _multiTokenMediator;
    }

    function deposit(uint256 _minimumUSDCAmountOut) external payable {
        address[] memory path = new address[](2);
        path[0] = address(WETH);
        path[1] = address(USDC);
        console.log('msg.value', msg.value);
        uint256[] memory amounts =
            uniswapV2Router02.swapExactETHForTokens{value: msg.value}(
                _minimumUSDCAmountOut,
                path,
                address(this),
                type(uint256).max
            );
        // console.log('relaying');
        multiTokenTransfer(USDC, address(lemmaXDAI), amounts[1]);

        //now realy the depositInfo to lemmaXDAI
        bytes4 functionSelector = ILemmaxDAI.setDepositInfo.selector;
        bytes memory data =
            abi.encodeWithSelector(functionSelector, msg.sender, amounts[1]);
        callBridge(address(lemmaXDAI), data, gasLimit);
    }

    function setWithdrwalInfo(address _account, uint256 _amount) external {
        require(msg.sender == address(ambBridge));
        require(ambBridge.messageSender() == address(lemmaXDAI));
        withdrawalInfo[_account] = _amount;
    }

    function withdraw(address _account) external {
        uint256 amount = withdrawalInfo[_account];
        address[] memory path = new address[](2);
        path[0] = address(USDC);
        path[1] = address(WETH);
        uint256[] memory amounts =
            uniswapV2Router02.swapTokensForExactETH(
                amount,
                0, //TODO: figure out a way to get this from user
                path,
                _account,
                type(uint256).max
            );
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
