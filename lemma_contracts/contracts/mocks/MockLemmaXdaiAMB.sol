// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

interface Mainnet {
    function setWithdrawalInfo(address _account, uint256 _amount) external;
}

interface XDAI {
    function setDepositInfo(address _account, uint256 _amount) external;
}

contract MockLemmaXdaiAMB is OwnableUpgradeable {
    Mainnet public mainnetContract;
    XDAI public xdaiContract;
    uint256 internal constant SEND_TO_ORACLE_DRIVEN_LANE = 0x00;

    function initialize() public initializer {
        __Ownable_init();
    }

    function setMainnetContract(Mainnet _mainnetContract) public onlyOwner {
        mainnetContract = _mainnetContract;
    }

    function setXDAIContract(XDAI _xdaiContract) public onlyOwner {
        xdaiContract = _xdaiContract;
    }

    function messageSender() public view returns (address) {
        return address(mainnetContract);
    }

    function setWithdrawInfo(address _account, uint256 _amount) public {
        mainnetContract.setWithdrawalInfo(_account, _amount);
    }

    function setDepositInfo(address _account, uint256 _amount) public {
        xdaiContract.setDepositInfo(_account, _amount);
    }

    function requireToPassMessage(
        address _contract,
        bytes calldata _data,
        uint256 _gas
    ) public returns (bytes32) {
        bytes32 _messageId;
        return _messageId;
    }
}
