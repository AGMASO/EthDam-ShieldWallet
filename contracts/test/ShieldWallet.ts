import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {
  getAddress,
  parseGwei,
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";

describe("ShieldWallet", function () {
  async function deployShieldFactoryFixture() {
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const shieldWalletFactory = await hre.viem.deployContract(
      "ShieldWalletFactory"
    );

    const publicClient = await hre.viem.getPublicClient();

    return {
      shieldWalletFactory,
      owner,
      otherAccount,
      publicClient,
    };
  }

  async function deployShieldWallet() {
    // TODO: Implement
    const [owner, otherAccount] = await hre.viem.getWalletClients();

    const shieldWalletFactory = await hre.viem.deployContract(
      "ShieldWalletFactory"
    );

    const publicClient = await hre.viem.getPublicClient();

    return {
      shieldWalletFactory,
      owner,
      otherAccount,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Shield Wallet should be deployed correctly", async function () {
      const { shieldWalletFactory } = await loadFixture(
        deployShieldFactoryFixture
      );

      const initData = encodeAbiParameters(
        parseAbiParameters("string x, uint y, bool z"),
        ["wagmi", 420n, true]
      );

      // TODO Deploy wallet
      // TODO Check initialization
      //expect(shieldWalletFactory).to.be.ok;
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
