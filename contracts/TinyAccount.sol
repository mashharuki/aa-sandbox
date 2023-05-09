// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./IERC4337Account.sol";

contract TinyAccount is IERC4337Account, Ownable {
    using ECDSA for bytes32;

    uint256 private constant SIG_VALIDATION_FAILED = 1;

    address public immutable entryPoint;

    modifier onlyMyself() {
        require(msg.sender == address(this), "TA: caller must be myself");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "TA: caller must be the entry point");
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
    ) external onlyEntryPoint returns (uint256) {
        try this._validateUserOp(userOp_, userOpHash_) returns (
            uint256 validationData
        ) {
            if (validationData == 0 && missingAccountFunds_ > 0) {
                (bool success, ) = msg.sender.call{value: missingAccountFunds_}(
                    ""
                );
                (success);
            }

            return validationData;
        } catch {
            return SIG_VALIDATION_FAILED;
        }
    }

    function _validateUserOp(
        UserOperation calldata userOp_,
        bytes32 userOpHash_
    ) external view onlyMyself returns (uint256) {
        require(userOp_.nonce < type(uint64).max, "TA: invalid nonce");

        return
            userOpHash_.toEthSignedMessageHash().recover(userOp_.signature) ==
                owner()
                ? 0
                : SIG_VALIDATION_FAILED;
    }

    function execute(
        address to_,
        uint256 value_,
        bytes calldata data_
    ) external onlyEntryPoint {
        (bool success, bytes memory result) = to_.call{value: value_}(data_);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }
}
