// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./IERC4337Account.sol";

contract TinyAccount is IERC4337Account, Ownable {
    using ECDSA for bytes32;

    address public immutable entryPoint;

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "TA: caller must be the entry point");
        _;
    }

    modifier onlyOwnerOrEntryPoint() {
        require(
            msg.sender == owner() || msg.sender == entryPoint,
            "TA: caller must be the owner or the entry point"
        );
        _;
    }

    constructor(address entryPoint_) {
        entryPoint = entryPoint_;
    }

    receive() external payable {}

    function validateUserOp(
        UserOperation calldata userOp_,
        bytes32 userOpHash_,
        uint256 missingAccountFunds_
    ) external onlyEntryPoint returns (uint256 validationData_) {
        if (
            userOpHash_.toEthSignedMessageHash().recover(userOp_.signature) ==
            owner()
        ) {
            validationData_ = 0;
        } else {
            validationData_ = 1;
        }

        if (missingAccountFunds_ > 0) {
            (bool success, ) = msg.sender.call{value: missingAccountFunds_}("");
            (success);
        }
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
