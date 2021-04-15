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
    function addDepositInfo(address account, uint256 amount) external;

    // temp methods just to test

    function totalCollateralDeposited() external returns (uint256);

    function mint(uint256 _amount) external;
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

    function deposit(uint256 _amount, uint256 _minimumETHAmountOut) external {
        // console.log('amount', _amount);

        USDC.transferFrom(msg.sender, address(this), _amount);

        totalUSDCDeposited += _amount / 2;
        //buy ETH with half amount and send the other half to perpetual protocol
        USDC.approve(address(uniswapV2Router02), _amount / 2);
        address[] memory path = new address[](2);
        path[0] = address(USDC);
        path[1] = address(WETH);
        // console.log('swapping');
        uniswapV2Router02.swapExactTokensForTokens(
            _amount / 2,
            _minimumETHAmountOut,
            path,
            address(this),
            type(uint256).max
        );
        // console.log('relaying');
        multiTokenTransfer(USDC, address(lemmaXDAI), _amount / 2);

        //now realy the depositInfo to lemmaXDAI
        bytes4 functionSelector = ILemmaxDAI.addDepositInfo.selector;
        bytes memory data =
            abi.encodeWithSelector(functionSelector, msg.sender, _amount / 2);
        callBridge(address(lemmaXDAI), data, gasLimit);
    }

    function setWithdrwalInfo(address _account, uint256 _amount) external {
        require(msg.sender == address(ambBridge));
        require(ambBridge.messageSender() == address(lemmaXDAI));
        withdrawalInfo[_account] = _amount;
    }

    function withdraw(address _account) external {
        uint256 amount = withdrawalInfo[_account];
        uint256 totalUnderlyingAssetBought = WETH.balanceOf(address(this));
        uint256 userShareOfUnserlyingAsset =
            (totalUnderlyingAssetBought * amount) / totalUSDCDeposited;

        WETH.approve(address(uniswapV2Router02), userShareOfUnserlyingAsset);
        address[] memory path = new address[](2);
        path[0] = address(WETH);
        path[1] = address(USDC);
        uint256[] memory amounts =
            uniswapV2Router02.swapExactTokensForTokens(
                userShareOfUnserlyingAsset,
                0, //TODO: figure out a way to get this from user
                path,
                address(this),
                type(uint256).max
            );
        USDC.transfer(_account, amounts[1] + amount);
    }

    //
    // INTERNAL
    //
    function multiTokenTransfer(
        IERC20 _token,
        address _receiver,
        uint256 _amount
    ) internal virtual {
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
    ) internal virtual returns (bytes32 messageId) {
        // server can check event, `UserRequestForAffirmation(bytes32 indexed messageId, bytes encodedData)`,
        // emitted by amb bridge contract
        messageId = ambBridge.requireToPassMessage(
            _contractOnOtherSide,
            _data,
            _gasLimit
        );
    }
}
