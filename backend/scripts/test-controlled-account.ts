import { ethers } from "hardhat";

import { UserOperation, getUserOperationHash } from "../lib";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const CONTROLLER_ADDRESS = "0x23c58DdE1842161fbC157A28f936Cb30518E4CfA"; // goerli
const CONTROLLED_ACCOUNT_ADDRESS = "0x53ECcD5eb46Edf90e678c0D0b59cade9F8a41572"; // goerli

const VERIFICATION_GAS_LIMIT = ethers.BigNumber.from(100_000);
const PRE_VERIFICATION_GAS = ethers.BigNumber.from(21_000);
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits("3", "gwei");

(async () => {
  const network = await ethers.provider.getNetwork();

  const [owner] = await ethers.getSigners();
  // 各コントラクトのオブジェクトを生成
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
  // invokeメソッドのcallデータを作成
  const callData = controller.interface.encodeFunctionData("invoke", [
    controlledAccount.address,
    owner.address,
    ethers.utils.parseEther("0.01"),
    [],
  ]);
  // ユーザーオペレーションデータを作成
  const userOp: UserOperation = {
    sender: controller.address,
    nonce: await entryPoint.getNonce(
      controller.address,
      controlledAccount.address
    ),
    initCode: [],
    callData: callData, // calldataを詰め込む
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
  // ユーザーオペレーションに対して署名実施
  userOp.signature = await owner.signMessage(userOpHash);
  // handleOpsメソッドを呼び出してトランザクションをブロックチェーンに流し込む
  const tx = await entryPoint.handleOps([userOp], owner.address);

  console.log(tx.hash);
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
