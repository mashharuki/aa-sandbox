import { ethers } from "hardhat";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";

import { UserOperation, getUserOperationHash } from "../lib";

describe("TinyAccount", () => {
  async function fixture() {
    const network = await ethers.provider.getNetwork();

    const [owner, other] = await ethers.getSigners();

    const tinyAccountFactory = await ethers.getContractFactory("TinyAccount");
    const tinyAccount = await tinyAccountFactory.deploy(owner.address);
    await tinyAccount.deployed();

    return { network, owner, other, tinyAccount };
  }

  describe("initial state", () => {
    it("success", async () => {
      const { owner, tinyAccount } = await loadFixture(fixture);

      expect(await tinyAccount.owner()).to.equal(owner.address);
    });
  });

  describe("validateUserOp", () => {
    it("failure: caller must be the entry point", async () => {
      const { network, other, tinyAccount } = await loadFixture(fixture);

      const userOp: UserOperation = {
        sender: tinyAccount.address,
        nonce: 0,
        initCode: [],
        callData: [],
        callGasLimit: 0,
        verificationGasLimit: 0,
        preVerificationGas: 0,
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
        paymasterAndData: [],
        signature: [],
      };

      const userOpHash = getUserOperationHash(
        userOp,
        await tinyAccount.entryPoint(),
        network.chainId
      );

      await expect(
        tinyAccount.connect(other).validateUserOp(userOp, userOpHash, 0)
      ).to.be.revertedWith("TA: caller must be the entry point");
    });

    it("success", async () => {
      const { network, owner, other, tinyAccount } = await loadFixture(fixture);

      {
        const tx = await owner.sendTransaction({
          to: tinyAccount.address,
          value: ethers.utils.parseEther("1"),
        });
        await tx.wait();
      }

      const block = await ethers.provider.getBlock("latest");
      const entryPointAddress = await tinyAccount.entryPoint();

      const callData = tinyAccount.interface.encodeFunctionData("execute", [
        other.address,
        ethers.utils.parseEther("1"),
        [],
      ]);
      const maxPriorityFeePerGas = ethers.utils.parseUnits("1", "gwei");

      const userOp: UserOperation = {
        sender: tinyAccount.address,
        nonce: 0,
        initCode: [],
        callData: callData,
        callGasLimit: await ethers.provider.estimateGas({
          from: entryPointAddress,
          to: tinyAccount.address,
          data: callData,
        }),
        verificationGasLimit: 100_000,
        preVerificationGas: 21_000,
        maxFeePerGas: block.baseFeePerGas!.add(maxPriorityFeePerGas),
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        paymasterAndData: [],
        signature: [],
      };

      const userOpHash = getUserOperationHash(
        userOp,
        entryPointAddress,
        network.chainId
      );

      userOp.signature = await owner.signMessage(userOpHash);

      // valid
      expect(
        await tinyAccount.callStatic.validateUserOp(userOp, userOpHash, 0)
      ).to.equal(0);

      userOp.signature = await other.signMessage(userOpHash);

      // invalid
      expect(
        await tinyAccount.callStatic.validateUserOp(userOp, userOpHash, 0)
      ).to.equal(1);
    });
  });

  describe("execute", () => {
    it("failure: caller must be the owner or the entry point", async () => {
      const { other, tinyAccount } = await loadFixture(fixture);

      await expect(
        tinyAccount.connect(other).execute(ethers.constants.AddressZero, 0, [])
      ).to.be.revertedWith("TA: caller must be the owner or the entry point");
    });

    it("success", async () => {
      const { owner, other, tinyAccount } = await loadFixture(fixture);

      // send 1 ETH owner to tinyAccount
      {
        const tx = await owner.sendTransaction({
          to: tinyAccount.address,
          value: ethers.utils.parseEther("1"),
        });
        await tx.wait();
      }

      const otherBalanceBefore = await ethers.provider.getBalance(
        other.address
      );
      const tinyAccountBalanceBefore = await ethers.provider.getBalance(
        tinyAccount.address
      );

      expect(tinyAccountBalanceBefore).to.equal(ethers.utils.parseEther("1"));

      // send 0.1 ETH from tinyAccount to other
      {
        const tx = await tinyAccount.execute(
          other.address,
          ethers.utils.parseEther("0.1"),
          []
        );
        await tx.wait();
      }

      const otherBalanceAfter = await ethers.provider.getBalance(other.address);
      const tinyAccountBalanceAfter = await ethers.provider.getBalance(
        tinyAccount.address
      );

      expect(otherBalanceAfter).to.equal(
        otherBalanceBefore.add(ethers.utils.parseEther("0.1"))
      );
      expect(tinyAccountBalanceAfter).to.equal(ethers.utils.parseEther("0.9"));
    });
  });
});
