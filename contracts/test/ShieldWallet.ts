import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getContractAt } from "@nomicfoundation/hardhat-viem/types";
import { expect } from "chai";
import hre from "hardhat";
import {
  getAddress,
  parseGwei,
  encodeAbiParameters,
  parseAbiParameters,
  encodeFunctionData,
} from "viem";

describe("ShieldWallet", function () {
  async function deployShieldWalletFactoryFixture() {
    const shieldWalletFactory = await hre.viem.deployContract(
      "ShieldWalletFactory"
    );
    const defaultCallbackHandler = await hre.viem.deployContract(
      "DefaultCallbackHandler"
    );
    const shieldWalletImplementation = await hre.viem.deployContract(
      "ShieldWallet"
    );

    const publicClient = await hre.viem.getPublicClient();

    return {
      shieldWalletFactory,
      defaultCallbackHandler,
      shieldWalletImplementation,
      publicClient,
    };
  }

  async function deployShieldWallet() {
    const {
      shieldWalletFactory,
      defaultCallbackHandler,
      shieldWalletImplementation,
      publicClient,
    } = await loadFixture(deployShieldWalletFactoryFixture);

    const [owner1, owner2, owner3, owner4, proposer] =
      await hre.viem.getWalletClients();

    const initData = encodeFunctionData({
      abi: shieldWalletImplementation.abi,
      functionName: "initialize",
      args: [
        [
          owner1.account.address,
          owner2.account.address,
          owner3.account.address,
          owner4.account.address,
        ],
        BigInt(3),
        BigInt(2),
        BigInt(1),
        defaultCallbackHandler.address,
        proposer.account.address,
        BigInt(60), // 5 blocks delay
        [],
      ],
    });

    const tx = await shieldWalletFactory.write.deployShieldWallet(
      [shieldWalletImplementation.address, initData],
      { value: parseGwei("0.1") }
    );
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: tx,
    });
    const factoryLogs = receipt.logs.filter(
      (log) => log.address === shieldWalletFactory.address
    );
    const shieldWalletAddress = `0x${factoryLogs[0].topics[1]?.slice(-40)}`;
    const shieldWallet = await hre.viem.getContractAt(
      "ShieldWallet",
      shieldWalletAddress
    );

    return {
      shieldWallet,
      owner1,
      owner2,
      owner3,
      owner4,
      proposer,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Shield Wallet should be deployed correctly", async function () {
      const {
        shieldWalletFactory,
        defaultCallbackHandler,
        shieldWalletImplementation,
        publicClient,
      } = await loadFixture(deployShieldWalletFactoryFixture);

      const [owner1, owner2, owner3, owner4, proposer] =
        await hre.viem.getWalletClients();

      const initData = encodeFunctionData({
        abi: shieldWalletImplementation.abi,
        functionName: "initialize",
        args: [
          [
            owner1.account.address,
            owner2.account.address,
            owner3.account.address,
            owner4.account.address,
          ],
          BigInt(3),
          BigInt(2),
          BigInt(1),
          defaultCallbackHandler.address,
          proposer.account.address,
          BigInt(60), // 5 blocks delay
          [],
        ],
      });

      const tx = await shieldWalletFactory.write.deployShieldWallet(
        [shieldWalletImplementation.address, initData],
        { value: parseGwei("0.1") }
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });
      const factoryLogs = receipt.logs.filter(
        (log) => log.address === shieldWalletFactory.address
      );
      const shieldWalletAddress = `0x${factoryLogs[0].topics[1]?.slice(-40)}`;
      const shieldWallet = await hre.viem.getContractAt(
        "ShieldWallet",
        shieldWalletAddress
      );

      expect(await shieldWallet.read.getManagementThreshold()).to.be.equal(
        BigInt(3)
      );
      expect(await shieldWallet.read.getExecutionThreshold()).to.be.equal(
        BigInt(2)
      );
      expect(await shieldWallet.read.getRevocationThreshold()).to.be.equal(
        BigInt(1)
      );

      expect(await shieldWallet.read.getProposer()).to.be.equal(
        getAddress(proposer.account.address)
      );

      expect((await shieldWallet.read.getOwners()).sort()).to.be.deep.equal(
        [
          getAddress(owner1.account.address),
          getAddress(owner2.account.address),
          getAddress(owner3.account.address),
          getAddress(owner4.account.address),
        ].sort()
      );
    });
  });

  describe("Transaction Preparation", function () {
    it("Proposer should be able to propose transaction", async function () {
      const {
        shieldWallet,
        owner1,
        owner2,
        owner3,
        owner4,
        proposer,
        publicClient,
      } = await loadFixture(deployShieldWallet);
      // TODO implement
    });
    it("Owner should be able to propose transaction", async function () {
      const {
        shieldWallet,
        owner1,
        owner2,
        owner3,
        owner4,
        proposer,
        publicClient,
      } = await loadFixture(deployShieldWallet);
      // TODO implement
    });
  });

  describe("Fallback", function () {
    it("Should receive ETH", async function () {
      // TODO: Implement
      // const { shieldWalletFactory } = await loadFixture(
      //   deployShieldFactoryFixture
      // );
      // const initData = encodeAbiParameters(
      //   parseAbiParameters("string x, uint y, bool z"),
      //   ["wagmi", 420n, true]
      // );
    });
    it("Should receive ERC-20", async function () {
      //
      //const { shieldWalletFactory } = await loadFixture(
      //  deployShieldFactoryFixture
      //);
      //const initData = encodeAbiParameters(
      //  parseAbiParameters("string x, uint y, bool z"),
      //  ["wagmi", 420n, true]
      //);
    });
  });
});
