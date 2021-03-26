// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.3;
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {IDEX} from '../interfaces/IDEX.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

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

contract LemmaHoneySwap is Ownable, IDEX {
    IUniswapV2Router02 public uniswapV2Router02;
    address public lemmaToken;

    modifier onlyLemmaToken() {
        require(msg.sender == lemmaToken, 'Lemma: only lemma token allowed');
        _;
    }

    constructor(IUniswapV2Router02 _uniswapV2Router02) {
        uniswapV2Router02 = _uniswapV2Router02;
    }

    function setLemmaToken(address _lemmaToken) external onlyOwner {
        lemmaToken = _lemmaToken;
    }

    function getUnderlyingTokenAmountRequired(
        address _collateral,
        uint256 _collateralAmount,
        //add some protection so that not more than needed collateral gets converted into collateral
        address _underlyingToken
    ) external view override returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = _underlyingToken;
        path[1] = _collateral;
        uint256[] memory amounts =
            uniswapV2Router02.getAmountsOut(_collateralAmount, path);
        return amounts[0];
    }

    function buyUnderlyingAsset(
        address _collateral,
        uint256 _collateralAmount,
        //add buyAmountMin
        address _underlyingToken
    ) external override onlyLemmaToken {
        IERC20(_collateral).approve(
            address(uniswapV2Router02),
            _collateralAmount
        );
        address[] memory path = new address[](2);
        path[0] = _collateral;
        path[1] = _underlyingToken;
        uniswapV2Router02.swapExactTokensForTokens(
            _collateralAmount,
            0, //take it from user
            path,
            lemmaToken,
            type(uint256).max
        );
    }

    function buyBackCollateral(
        address _collateral,
        uint256 _collateralAmount,
        //add some protection so that not more than needed collateral gets converted into collateral
        address _underlyingToken
    ) external override onlyLemmaToken {
        IERC20(_underlyingToken).approve(
            address(uniswapV2Router02),
            _collateralAmount
        );
        address[] memory path = new address[](2);
        path[0] = _underlyingToken;
        path[1] = _collateral;

        uniswapV2Router02.swapTokensForExactTokens(
            _collateralAmount,
            type(uint256).max, //need to make sure this is the fair price!
            path,
            lemmaToken,
            type(uint256).max
        );
    }
}
