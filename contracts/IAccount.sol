// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.19;

import "@openzeppelin/contracts/interfaces/IERC1271.sol";

interface IAccount is IERC1271 {
    function deposit(uint256 value) external;

    function execute(address to, uint256 value, bytes calldata data) external;
}
