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
  encodePacked,
  encodeFunctionData,
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";

// Default allowed targets for whitelist operations in the wallet contract.
const DEFAULT_ALLOWED_TARGETS = [
  // Function: addEntryToWhitelist (selector: 0xeae04d1b)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0xeae04d1b",
    maxValue: 0n,
  },
  // Function: deleteEntryFromWhitelist (selector: 0xd3975216)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0xd3975216",
    maxValue: 0n,
  },
  // Function: addOwnerWithThreshold (selector: 0x878df11b)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0x878df11b",
    maxValue: 0n,
  },
  // Function: removeOwnerWithThreshold (selector: 0x4cde890b)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0x4cde890b",
    maxValue: 0n,
  },
  // Function: swapOwner (selector: 0xe318b52b)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0xe318b52b",
    maxValue: 0n,
  },
  // Function: changeThresholds (selector: 0xdac7ed25)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0xdac7ed25",
    maxValue: 0n,
  },
  // Function: upgradeToAndCall (selector: 0x4f1ef286)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0x4f1ef286",
    maxValue: 0n,
  },
  // Function: setProposer (selector: 0x1fb4a228)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0x1fb4a228",
    maxValue: 0n,
  },
  // Function: setDelay (selector: 0xe177246e)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0xe177246e",
    maxValue: 0n,
  },
  // Function: setFallbackHandler (selector: 0xf08a0323)
  {
    target: "0x0000000000000000000000000000000000000000",
    selector: "0xf08a0323",
    maxValue: 0n,
  },
];

const EXECUTIONTYPE_CALL =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const EXECUTIONTYPE_BATCH =
  "0x0100000000000000000000000000000000000000000000000000000000000000";

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
        DEFAULT_ALLOWED_TARGETS,
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
      shieldWalletImplementation,
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
    it("Transaction not whitelisted should fail when being proposed", async function () {
      const { shieldWallet, proposer } = await loadFixture(deployShieldWallet);

      const executionData = encodePacked(
        ["address", "uint256", "bytes"],
        ["0x0000000000000000000000000000000000000000", 0n, "0x"]
      );
      expect(
        shieldWallet.write.propExecution([EXECUTIONTYPE_CALL, executionData], {
          address: proposer.account.address,
        })
      ).to.be.reverted;
    });
    it("Proposer should be able to propose transaction", async function () {
      const { shieldWallet, shieldWalletImplementation, proposer } =
        await loadFixture(deployShieldWallet);

      const calldata = encodeFunctionData({
        abi: shieldWalletImplementation.abi,
        functionName: "setDelay",
        args: [
          BigInt(120), // 10 blocks delay
        ],
      });

      const executionData = encodePacked(
        ["address", "uint256", "bytes"],
        ["0x0000000000000000000000000000000000000000", 0n, calldata]
      );

      await shieldWallet.write.propExecution(
        [EXECUTIONTYPE_CALL, executionData],
        {
          address: proposer.account.address,
        }
      );
    });

    it("Owner should be able to propose transaction", async function () {
      const { shieldWallet, shieldWalletImplementation, owner1 } =
        await loadFixture(deployShieldWallet);

      const calldata = encodeFunctionData({
        abi: shieldWalletImplementation.abi,
        functionName: "setDelay",
        args: [
          BigInt(120), // 10 blocks delay
        ],
      });

      const executionData = encodePacked(
        ["address", "uint256", "bytes"],
        ["0x0000000000000000000000000000000000000000", 0n, calldata]
      );

      await shieldWallet.write.propExecution(
        [EXECUTIONTYPE_CALL, executionData],
        {
          address: owner1.account.address,
        }
      );
    });
    it("Proposer should be able to propose transaction batched", async function () {
      const { shieldWallet, shieldWalletImplementation, proposer } =
        await loadFixture(deployShieldWallet);

      const calldata = encodeFunctionData({
        abi: shieldWalletImplementation.abi,
        functionName: "setDelay",
        args: [
          BigInt(120), // 10 blocks delay
        ],
      });

      const executionData = encodeAbiParameters(
        parseAbiParameters("(address target, uint256 value, bytes callData)[]"),
        [
          [
            {
              target: "0x0000000000000000000000000000000000000000",
              value: 0n,
              callData: calldata,
            },
            {
              target: "0x0000000000000000000000000000000000000000",
              value: 0n,
              callData: calldata,
            },
          ],
        ]
      );

      await shieldWallet.write.propExecution(
        [EXECUTIONTYPE_CALL, executionData],
        {
          address: proposer.account.address,
        }
      );
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
