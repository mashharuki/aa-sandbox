// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "./UserOperation.sol";

interface IEntryPoint {
    function getNonce(
        address sender,
        uint192 key
    ) external view returns (uint256 nonce);

    function handleOps(
        UserOperation[] calldata ops,
        address payable beneficiary
    ) external;
}
