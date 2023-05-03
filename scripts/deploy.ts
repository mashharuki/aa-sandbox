import { ethers } from "hardhat";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

(async () => {
  const tinyAccountFactory = await ethers.getContractFactory("TinyAccount");
  const tinyAccount = await tinyAccountFactory.deploy(ENTRY_POINT_ADDRESS);
  await tinyAccount.deployed();

  console.log(tinyAccount.address);
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
