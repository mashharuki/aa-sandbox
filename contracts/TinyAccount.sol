// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./IAccount.sol";

contract TinyAccount is IAccount, Ownable {
    address public immutable entryPoint;

    constructor(address entryPoint_) {
        entryPoint = entryPoint_;
    }

    modifier onlyOwnerOrEntryPoint() {
        require(
            msg.sender == owner() || msg.sender == entryPoint,
            "TA: caller must be the owner or the entry point"
        );
        _;
    }

    function validateUserOp(
        UserOperation calldata,
        bytes32,
        uint256
    ) external pure returns (uint256) {
        return 0;
    }

    function execute(
        address to_,
        uint256 value_,
        bytes calldata data_
    ) external onlyOwnerOrEntryPoint {
        (bool success, bytes memory result) = to_.call{value: value_}(data_);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }
}
