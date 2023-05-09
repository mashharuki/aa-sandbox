import { ethers } from "hardhat";

import { UserOperation, getUserOperationHash } from "../lib";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const CONTROLLER_ADDRESS = "0x68C1c3028f34f6b46813bec01c6836f8862caEDd";
const CONTROLLED_ACCOUNT_ADDRESS = "0x6E67962D181477DE46c06B020543e4e1F485b091";

const VERIFICATION_GAS_LIMIT = ethers.BigNumber.from(100_000);
const PRE_VERIFICATION_GAS = ethers.BigNumber.from(21_000);
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits("3", "gwei");

(async () => {
  const network = await ethers.provider.getNetwork();

  const [owner] = await ethers.getSigners();

  const entryPoint = await ethers.getContractAt(
    "IERC4337EntryPoint",
    ENTRY_POINT_ADDRESS
  );
  const controller = await ethers.getContractAt(
    "Controller",
    CONTROLLER_ADDRESS
  );
  const controlledAccount = await ethers.getContractAt(
    "ControlledAccount",
    CONTROLLED_ACCOUNT_ADDRESS
  );

  const block = await ethers.provider.getBlock("latest");

  const callData = controller.interface.encodeFunctionData("invoke", [
    controlledAccount.address,
    owner.address,
    ethers.utils.parseEther("0.01"),
    [],
  ]);

  const userOp: UserOperation = {
    sender: controller.address,
    nonce: await entryPoint.getNonce(
      controller.address,
      controlledAccount.address
    ),
    initCode: [],
    callData: callData,
    callGasLimit: await ethers.provider.estimateGas({
      from: entryPoint.address,
      to: controller.address,
      data: callData,
    }),
    verificationGasLimit: VERIFICATION_GAS_LIMIT,
    preVerificationGas: PRE_VERIFICATION_GAS,
    maxFeePerGas: block.baseFeePerGas!.add(MAX_PRIORITY_FEE_PER_GAS),
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
    paymasterAndData: [],
    signature: [],
  };

  const userOpHash = getUserOperationHash(
    userOp,
    entryPoint.address,
    network.chainId
  );

  userOp.signature = await owner.signMessage(userOpHash);

  const tx = await entryPoint.handleOps([userOp], owner.address);

  console.log(tx.hash);
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
