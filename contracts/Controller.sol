// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./IAccount.sol";
import "./IController.sol";
import "./UserOperation.sol";

contract Controller is IController {
    using ECDSA for bytes32;

    address public immutable entryPoint;

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "C: caller must be the entry point");
        _;
    }

    constructor(address entryPoint_) {
        entryPoint = entryPoint_;
    }

    function validateUserOp(
        UserOperation calldata userOp_,
        bytes32 userOpHash_,
        uint256 missingAccountFunds_
    ) external onlyEntryPoint returns (uint256 validationData_) {
        (address account, , , ) = abi.decode(
            userOp_.callData[4:],
            (address, address, uint256, bytes)
        );

        try
            IAccount(account).isValidSignature(
                userOpHash_.toEthSignedMessageHash(),
                userOp_.signature
            )
        returns (bytes4 result) {
            if (result == IERC1271.isValidSignature.selector) {
                validationData_ = 0;
            } else {
                validationData_ = 1;
            }
        } catch {
            validationData_ = 1;
        }

        if (missingAccountFunds_ > 0) {
            IAccount(account).deposit(missingAccountFunds_);
        }
    }

    function invoke(
        address account_,
        address to_,
        uint256 value_,
        bytes calldata data_
    ) external onlyEntryPoint {
        IAccount(account_).execute(to_, value_, data_);
    }
}
