// SPDX-License-Identifier: MIT
pragma solidity =0.8.3;
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';


contract MockAMB is OwnableUpgradeable {

    address mainnetContract;
    address xdaiContract;
  
    function initialize() public initializer {
        __Ownable_init();
    }

    function setMainnetContract(address _mainnetContract) public onlyOwner {
        mainnetContract = _mainnetContract;
    }

    function setXDAIContract(address _xdaiContract) public onlyOwner {
        xdaiContract = _xdaiContract;
    }

    function messageSender() public view returns (address) {
        uint id;
        assembly {
            id := chainid()
        }
        if (id == 4) {
            return mainnetContract;
        } else {
            return xdaiContract;
        }
    }
}
