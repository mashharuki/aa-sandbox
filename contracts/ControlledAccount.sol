// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./IAccount.sol";

contract ControlledAccount is IAccount, Ownable {
    using ECDSA for bytes32;

    address public immutable controller;

    modifier onlyController() {
        require(msg.sender == controller, "CA: caller must be the controller");
        _;
    }

    constructor(address controller_) {
        controller = controller_;
    }

    receive() external payable {}

    function isValidSignature(
        bytes32 hash_,
        bytes memory signature_
    ) external view returns (bytes4 magicValue_) {
        require(hash_.recover(signature_) == owner(), "CA: invalid signer");

        return IERC1271.isValidSignature.selector;
    }

    function execute(
        address to_,
        uint256 value_,
        bytes calldata data_
    ) external onlyController {
        (bool success, bytes memory result) = to_.call{value: value_}(data_);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }
}
