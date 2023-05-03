import { ethers } from "hardhat";

import { Bytes } from "ethers";
import { UserOperation } from "./interfaces";

export function getUserOperationHash(
  userOp: UserOperation,
  entryPointAddress: string,
  chainID: number
): Bytes {
  return ethers.utils.arrayify(
    ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes32", "address", "uint256"],
        [
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              [
                "address",
                "uint256",
                "bytes32",
                "bytes32",
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "uint256",
                "bytes32",
              ],
              [
                userOp.sender,
                userOp.nonce,
                ethers.utils.keccak256(userOp.initCode),
                ethers.utils.keccak256(userOp.callData),
                userOp.callGasLimit,
                userOp.verificationGasLimit,
                userOp.preVerificationGas,
                userOp.maxFeePerGas,
                userOp.maxPriorityFeePerGas,
                ethers.utils.keccak256(userOp.paymasterAndData),
              ]
            )
          ),
          entryPointAddress,
          chainID,
        ]
      )
    )
  );
}
