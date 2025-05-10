"use client";

import { useState } from "react";
import { Copy, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { custom, useAccount } from "wagmi";
import { ethers } from "ethers";
import { createWalletClient } from "viem";
import { headers } from "next/headers";
import { signTypedData } from "@wagmi/core";
import { sepolia } from "viem/chains";
import { mainnet } from "viem/chains";
import { sapphireTestnet } from "viem/chains";
import { goerli } from "viem/chains";
import execExecution from "@/lib/scripts/execExecution";

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

interface AddSignatureToMetaTxProps {
  transaction: Metatx;
  onClose: () => void;
  onSignSuccess: () => void;
}

export default function AddSignatureToMetaTx({
  transaction,
  onClose,
  onSignSuccess,
}: AddSignatureToMetaTxProps) {
  const { address } = useAccount();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log("transaction", transaction.dataToSign);

  //!handle function to add a new signature to the metaTx
  const handleSign = async () => {
    if (!address) {
      setError("Please connect your wallet first");
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      //! Sign the data using viem
      const executionIdToBeSigned = transaction.executionId;
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
      const signature = await walletClient.signTypedData({
        account: address,
        domain: {
          name: "ShieldWallet",
          version: "1",
          chainId: chain.id,
          verifyingContract: transaction.addressWallet,
        },
        types: {
          ExecutionId: [{ name: "executionId", type: "bytes32" }],
        },
        primaryType: "ExecutionId",
        message: { executionId: executionIdToBeSigned },
      });

      console.log("signature", signature);

      // 2. Send signature to backend
      const response = await fetch(
        `/api/shieldwallet/${transaction.addressWallet}/metatx/${transaction._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signature,
            signer: address,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit signature");
      }

      onSignSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to sign transaction");
    } finally {
      setIsSigning(false);
    }
  };

  const handleExecute = async () => {
    await execExecution(transaction);
    console.log("Transaction executed");
    onClose();
  };

  return (
    <div className='px-4 py-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Sign Transaction</h1>
        <Button
          variant='outline'
          className='gap-2 border-gray-300'
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>

      <div className='max-w-3xl mx-auto p-1'>
        <Card className='p-4'>
          <div className='flex flex-col'>
            <h2 className='text-xl font-bold mb-4 px-2'>Transaction Details</h2>

            <div className='space-y-4 border-t border-b py-6 px-2'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-500'>Created by:</span>
                <div className='flex items-center gap-2'>
                  <div className='font-medium'>
                    {transaction.createdBy.substring(0, 6)}...
                    {transaction.createdBy.substring(
                      transaction.createdBy.length - 4
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.createdBy);
                    }}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-gray-500'>Status:</span>
                <div className='font-medium capitalize'>
                  {transaction.status}
                </div>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-gray-500'>Created at:</span>
                <div className='font-medium'>
                  {new Date(transaction.createdAt).toLocaleString()}
                </div>
              </div>

              <div className='flex flex-col gap-2 min-h-[100px]'>
                <span className='text-gray-500'>Data to sign:</span>
                <div className='flex flex-col gap-2 bg-gray-50 p-4 rounded-lg'>
                  {Object.entries(transaction.dataToSign).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className='flex justify-between items-start'
                      >
                        <span className='text-gray-500 font-medium'>
                          {key}:
                        </span>
                        <div className='text-right font-mono text-sm break-all max-w-[70%]'>
                          {typeof value === "string"
                            ? value
                            : JSON.stringify(value)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-gray-500'>Current signatures:</span>
                <div className='font-medium'>
                  {transaction.signatures.length} signatures
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className='mt-4 text-red-500 text-sm px-2'>{error}</div>
            )}

            {/* Action Buttons */}
            <div className='mt-6 flex justify-end gap-2 px-2'>
              <Button
                variant='outline'
                className='border-gray-300'
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSign}
                disabled={isSigning}
                className='bg-black text-white hover:bg-gray-800'
              >
                {isSigning ? "Signing..." : "Sign Transaction"}
              </Button>
              <Button
                onClick={handleExecute}
                disabled={isSigning}
                className='bg-black text-white hover:bg-gray-800'
              >
                {isSigning ? "Executing..." : "Execute Proposal"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
