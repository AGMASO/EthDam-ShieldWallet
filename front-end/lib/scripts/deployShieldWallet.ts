import {
  createWalletClient,
  custom,
  encodeFunctionData,
  getContract,
  encodeAbiParameters,
  parseAbiParameters,
  toHex,
  parseGwei,
} from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { sepolia, mainnet, goerli, sapphireTestnet } from "viem/chains";
import { parseEther } from "viem/utils";
import { factoryAbi } from "@/lib/abis/factoryAbi";
import { shieldWalletAbi } from "@/lib/abis/shieldWalletAbi";
import { SHIELD_WALLET_IMPLEMENTATION } from "@/lib/abis/addressConstants";
import { SHIELD_WALLET_FACTORY_ADDRESS } from "@/lib/abis/addressConstants";
import { DEFAULT_CALLBACK_HANDLER } from "@/lib/abis/addressConstants";

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
interface Signer {
  id: string;
  name: string;
  address: string;
}
interface Network {
  id: string;
  name: string;
  icon: string;
}
interface FormData {
  accountName: string;
  addressWallet: string;
  selectedNetwork: Network;
  signers: Signer[];
  threshold: number;
  managementThreshold: number;
  revocationThreshold: number;
  proposer: string;
  timeLockDelay: number;
  creator: string;
  allowedTargets: {
    target: string;
    selector: string;
    maxValue: string;
  }[];
}
//!Hardcoded address and abi
const shieldWalletImplementation = SHIELD_WALLET_IMPLEMENTATION;
const shieldWalletImplementationAbi = shieldWalletAbi;
const DefaultCallbackHandler = DEFAULT_CALLBACK_HANDLER;
const shieldWalletFactoryAddress = SHIELD_WALLET_FACTORY_ADDRESS;
const shieldWalletFactoryAbi = factoryAbi;
// const {
//     shieldWalletFactory,
//     defaultCallbackHandler,
//     shieldWalletImplementation,
//     publicClient,
//   } = await loadFixture(deployShieldWalletFactoryFixture);
// const [owner1, owner2, owner3, owner4, proposer] =
//     await hre.viem.getWalletClients();
export default async function deployShieldWallet(props: FormData) {
  try {
    console.log("allowedTargets", props.allowedTargets);
    console.log("signers", props.signers);
    console.log("threshold", props.threshold);
    console.log("managementThreshold", props.managementThreshold);
    console.log("revocationThreshold", props.revocationThreshold);
    console.log("proposer", props.proposer);
    console.log("timeLockDelay", props.timeLockDelay);
    const signersAddresses = props.signers.map((signer) => signer.address);
    console.log("signersAddresses", signersAddresses);
    // Combine DEFAULT_ALLOWED_TARGETS with props.allowedTargets
    const combinedAllowedTargets = [
      ...DEFAULT_ALLOWED_TARGETS,
      ...(props.allowedTargets?.map((target) => ({
        target: target.target,
        selector: target.selector,
        maxValue: BigInt(target.maxValue),
      })) || []),
    ];

    const initData = encodeFunctionData({
      abi: shieldWalletImplementationAbi,
      functionName: "initialize",
      args: [
        signersAddresses,
        BigInt(props.managementThreshold),
        BigInt(props.threshold),
        BigInt(props.revocationThreshold),
        DefaultCallbackHandler,
        props.proposer,
        BigInt(props.timeLockDelay),
        combinedAllowedTargets,
      ],
    });
    console.log("initData", initData);
    // Initialize Viem
    const walletClient = createWalletClient({
      transport: custom(window.ethereum!),
    });

    const [address] = await walletClient.requestAddresses();
    const chainId = await walletClient.getChainId();
    const chain =
      [sepolia, mainnet, goerli, sapphireTestnet].find(
        (c) => c.id === chainId
      ) || sapphireTestnet;

    if (!shieldWalletFactoryAddress) return;

    const shieldWalletFactory = getContract({
      address: shieldWalletFactoryAddress,
      abi: shieldWalletFactoryAbi,
      client: walletClient,
    });

    //!Falta incluir el shieldWalletImplementation
    const tx = await shieldWalletFactory.write.deployShieldWallet(
      [shieldWalletImplementation, initData],
      { account: address, chain: chain }
    );

    return {
      success: true,
      transactionHash: tx,
    };
  } catch (error: any) {
    console.error("Error deploying Shield Wallet:", error);
    return {
      success: false,
      error: error.message || "Failed to deploy Shield Wallet",
    };
  }
}
