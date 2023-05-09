import { ethers } from "hardhat";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

(async () => {
  const controllerFactory = await ethers.getContractFactory("Controller");
  const controller = await controllerFactory.deploy(ENTRY_POINT_ADDRESS);
  await controller.deployed();

  const controlledAccountFactory = await ethers.getContractFactory(
    "ControlledAccount"
  );
  const controlledAccount = await controlledAccountFactory.deploy(
    controller.address
  );
  await controlledAccount.deployed();

  console.log(controlledAccount.address);
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
