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

interface Props {
  formData: FormData;
  shieldWalletAddress: string;
}

const shieldWalletImplementation = SHIELD_WALLET_IMPLEMENTATION;
const shieldWalletImplementationAbi = shieldWalletAbi;
const DefaultCallbackHandler = DEFAULT_CALLBACK_HANDLER;
const shieldWalletFactoryAddress = SHIELD_WALLET_FACTORY_ADDRESS;
const shieldWalletFactoryAbi = factoryAbi;

export default async function propExecution({
  formData,
  shieldWalletAddress,
}: Props) {
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
      address: shieldWalletAddress as `0x${string}`,
      abi: shieldWalletImplementationAbi,
      client: walletClient,
    });

    //!Preparing parameters for the method
    const execType = formData.execType;
    console.log("execType check", execType);
    console.log("formData check", formData);

    let hash;
    if (execType === "0x00") {
      // Single call
      const EXECUTIONTYPE_CALL =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      const { target, amount, calldata } = formData.proposalParams[0];
      const executionData = encodePacked(
        ["address", "uint256", "bytes"],
        [target, BigInt(amount), calldata as `0x${string}`]
      );

      hash = await contract.write.propExecution(
        [EXECUTIONTYPE_CALL, executionData],
        {
          account: address,
          chain: chain,
        }
      );
    } else {
      // Batch call
      const EXECUTIONTYPE_BATCH =
        "0x0100000000000000000000000000000000000000000000000000000000000000";
      const params = formData.proposalParams.map((param) => ({
        target: param.target,
        value: BigInt(param.amount),
        callData: param.calldata as `0x${string}`,
      }));

      const encodedData = encodeAbiParameters(
        parseAbiParameters("(address target, uint256 value, bytes callData)[]"),
        [params]
      );

      hash = await contract.write.propExecution(
        [EXECUTIONTYPE_BATCH, encodedData],
        {
          account: address,
          chain: chain,
        }
      );
    }

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
