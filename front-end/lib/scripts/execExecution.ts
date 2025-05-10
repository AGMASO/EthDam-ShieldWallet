//!Solo falta cambiar el abi y el addressSC

import {
  createWalletClient,
  custom,
  encodeFunctionData,
  getContract,
  encodeAbiParameters,
  parseAbiParameters,
  toHex,
  encodePacked,
} from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { sepolia, mainnet, goerli, sapphireTestnet } from "viem/chains";
import { parseEther } from "viem/utils";
import { factoryAbi } from "../abis/factoryAbi";
import { shieldWalletAbi } from "../abis/shieldWalletAbi";
import { SHIELD_WALLET_IMPLEMENTATION } from "../abis/addressConstants";
import { SHIELD_WALLET_FACTORY_ADDRESS } from "../abis/addressConstants";
import { DEFAULT_CALLBACK_HANDLER } from "../abis/addressConstants";

interface ProposalParams {
  target: string;
  amount: string;
  calldata: string;
  displayAmount: string;
}

interface FormData {
  proposalParams: ProposalParams[];
  tokenSymbol: string;
  execType: "0x00" | "0x01";
}

interface Metatx {
  _id: string;
  executionId: string;
  mode: string;
  executionData: string;
  threshold: string;
  blockTimestamp: number;
  multisigWallet: string;
  addressWallet: string;
  dataToSign: object;
  signatures: {
    signer: string;
    signature: string;
  }[];
  createdBy: string;
  status: "pending" | "executed" | "cancelled";
  executedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shieldWalletImplementation = SHIELD_WALLET_IMPLEMENTATION;
const shieldWalletImplementationAbi = shieldWalletAbi;
const DefaultCallbackHandler = DEFAULT_CALLBACK_HANDLER;
const shieldWalletFactoryAddress = SHIELD_WALLET_FACTORY_ADDRESS;
const shieldWalletFactoryAbi = factoryAbi;

export default async function execExecution(transaction: Metatx) {
  try {
    const walletClient = createWalletClient({
      transport: custom(window.ethereum!),
    });
    console.log("Estoy aqui");

    const [address] = await walletClient.requestAddresses();
    const chainId = await walletClient.getChainId();
    const chain =
      [sepolia, mainnet, goerli, sapphireTestnet].find(
        (c) => c.id === chainId
      ) || sapphireTestnet;

    if (!shieldWalletImplementation) return;
    console.log("Estoy aqui2");

    const contract = getContract({
      address: transaction.addressWallet as `0x${string}`,
      abi: shieldWalletImplementationAbi,
      client: walletClient,
    });
    // bytes32 mode,
    // bytes calldata executionData,
    // ThresholdType thresholdType,
    // uint256 timestamp,
    // bytes calldata signatures
    console.log("transaction", transaction);

    const hash = await contract.write.execExecution([transaction.signatures], {
      account: address,
      chain: chain,
    });

    console.log("Hash de la transacción:", hash);

    // Wait for transaction confirmation
    const receipt = await waitForTransactionReceipt(walletClient, {
      hash,
      confirmations: 1,
    });
    console.log("Transacción confirmada:", receipt);

    return { hashOfTx: hash };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
