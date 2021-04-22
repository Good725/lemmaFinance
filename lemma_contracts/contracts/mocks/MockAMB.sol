// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

interface Mainnet {
    function setWithdrawalInfo(address _account, uint256 _amount) external;
}

interface XDAI {
    function setDepositInfo(address _account, uint256 _amount) external;
}


contract MockAMB is OwnableUpgradeable {

    Mainnet public mainnetContract;
    XDAI public xdaiContract;
  
    function initialize(XDAI _xdaiContract) public initializer {
        __Ownable_init();
        xdaiContract = _xdaiContract;
    }

    function setMainnetContract(Mainnet _mainnetContract) public onlyOwner {
        mainnetContract = _mainnetContract;
    }

    function setXDAIContract(XDAI _xdaiContract) public onlyOwner {
        xdaiContract = _xdaiContract;
    }

    function messageSender() public view returns (address) {
        uint id;
        assembly {
            id := chainid()
        }
        if (id == 4) {
            return address(mainnetContract);
        } else {
            return address(xdaiContract);
        }
    }

    function setWithdrawInfo(address _account, uint _amount) public {
        mainnetContract.setWithdrawalInfo(_account, _amount);
    }

    function setDepositInfo(address _account, uint _amount) public {
        xdaiContract.setDepositInfo(_account, _amount);
    }
}
