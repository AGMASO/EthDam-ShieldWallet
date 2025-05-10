"use client";

import type React from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronRight,
  User,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAccount, useBalance } from "wagmi";
import { useEffect, useState } from "react";
import SendTransactionPageForm from "./sendTxModal";
import AddSignatureToMetaTx from "./addSignatureToMetaTx";

// Import our own types instead
interface Network {
  id: string;
  name: string;
  icon?: string;
}

interface Signer {
  id: string;
  name: string;
  address: string;
}

interface ShieldWalletInfo {
  _id?: string;
  accountName: string;
  addressWallet: string;
  selectedNetwork: Network;
  signers: Signer[];
  threshold: number;
  creator: string;
  managementThreshold: number;
  revocationThreshold: number;
  proposer: string;
  timeLockDelay: number;
  allowedTargets: string[];
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

//!Dummy Data

interface SendTransactionPageFormProps {
  onCancel: () => void;
}

export function HomeDashboard({
  shieldWalletInfo,
}: {
  shieldWalletInfo?: ShieldWalletInfo;
}) {
  const { address, isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [metaTxsPending, setMetaTxsPending] = useState<Metatx[]>([]);
  const [metaTxs, setMetaTxs] = useState<Metatx[]>([]);
  const [selectedTx, setSelectedTx] = useState<Metatx | null>(null);

  // Add balance hook for Sepolia ETH
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: shieldWalletInfo?.addressWallet as `0x${string}`,
  });

  // Use safeAddress if provided
  const displayAddress =
    shieldWalletInfo?.addressWallet || "No Shield address found";
  useEffect(() => {
    const getPendingMetaTx = async () => {
      if (!shieldWalletInfo?.addressWallet) {
        console.log("No shield wallet address available");
        return;
      }

      try {
        const response = await fetch(
          `/api/shieldwallet/${shieldWalletInfo.addressWallet}/metatx/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch Metatx for that ShieldAccount");
        }

        const data = await response.json();
        // Filter only pending transactions
        const pendingTransactions = data.metaTxs.filter(
          (tx: Metatx) => tx.status === "pending"
        );
        setMetaTxsPending(pendingTransactions);
        setMetaTxs(data.metaTxs);
      } catch (error) {
        console.error("Error fetching meta transactions:", error);
        setMetaTxsPending([]);
        setMetaTxs([]);
      }
    };

    getPendingMetaTx();
  }, [shieldWalletInfo?.addressWallet]);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleTxClick = (tx: Metatx) => {
    setSelectedTx(tx);
  };

  const handleSignSuccess = () => {
    // Refresh the transactions list after successful signing
    const getPendingMetaTx = async () => {
      if (!shieldWalletInfo?.addressWallet) {
        console.log("No shield wallet address available");
        return;
      }

      try {
        const response = await fetch(
          `/api/shieldwallet/${shieldWalletInfo.addressWallet}/metatx/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: "",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch Metatx for that ShieldAccount");
        }

        const data = await response.json();
        // Filter only pending transactions
        const pendingTransactions = data.metaTxs.filter(
          (tx: Metatx) => tx.status === "pending"
        );
        setMetaTxsPending(pendingTransactions);
        setMetaTxs(data.metaTxs);
      } catch (error) {
        console.error("Error fetching meta transactions:", error);
        setMetaTxsPending([]);
        setMetaTxs([]);
      }
    };

    getPendingMetaTx();
  };

  const handleExecuteProposal = () => {
    //!Metodo de executeproposal
  };

  const handleRevokeProposal = () => {
    console.log("Revoke Proposal");
  };
  return (
    <>
      {selectedTx ? (
        <AddSignatureToMetaTx
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
          onSignSuccess={handleSignSuccess}
        />
      ) : isOpen ? (
        <div className='p-6 space-y-6'>
          <SendTransactionPageForm
            onCancel={() => setIsOpen(false)}
            shieldWalletInfo={shieldWalletInfo}
          />
        </div>
      ) : (
        <div className='p-6 space-y-6'>
          {/* Safe Address Display */}
          {shieldWalletInfo && (
            <div className='bg-gray-50 p-4 rounded-md mb-4'>
              <div className='flex justify-between items-center'>
                <div>
                  <p className='text-sm text-gray-500'>ShieldWallet Address:</p>
                  <p className='text-sm font-mono'>{displayAddress}</p>
                </div>
                {shieldWalletInfo && (
                  <Badge
                    variant='outline'
                    className='bg-purple-50 text-[] border-purple-200'
                  >
                    ShieldWallet
                  </Badge>
                )}
              </div>
              {shieldWalletInfo && (
                <div className='mt-2'>
                  <p className='text-sm text-gray-500'>
                    Threshold: {shieldWalletInfo.threshold} out of{" "}
                    {shieldWalletInfo.signers.length} owner(s)
                  </p>

                  <p className='text-sm text-gray-500'>
                    Network: {shieldWalletInfo.selectedNetwork.name}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Wallet Value and Action Buttons */}
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <div>
              <h2 className='text-sm font-medium text-muted-foreground'>
                Total asset value
              </h2>
              <div className='flex items-baseline'>
                {/* //! here has to come the value of the wallet */}
                {/* //! Mejorar para que podamos anadir mas tokens*/}

                {isBalanceLoading ? (
                  <div className='animate-pulse'>
                    <div className='h-8 w-24 bg-gray-200 rounded'></div>
                  </div>
                ) : balance ? (
                  <>
                    <span className='text-4xl font-bold'>
                      {Number(balance.formatted).toFixed(4)}
                    </span>
                    <span className='text-4xl font-bold text-muted-foreground ml-1'>
                      {balance.symbol}
                    </span>
                  </>
                ) : (
                  <span className='text-4xl font-bold text-muted-foreground'>
                    No balance
                  </span>
                )}
              </div>
            </div>

            <div className='flex flex-col md:flex-row gap-4'>
              <Button
                variant='outline'
                className='gap-2 border-[#1184B6]'
                onClick={handleOpenModal}
              >
                <ArrowUpRight className='h-4 w-4' />
                Create a New Proposal Transaction
              </Button>
              <Button
                variant='outline'
                className='gap-2 border-[#1184B6]'
                onClick={handleExecuteProposal}
              >
                <ArrowUpRight className='h-4 w-4' />
                Execute a Proposal
              </Button>
              <Button
                variant='outline'
                className='gap-2 border-[#1184B6]'
                onClick={handleRevokeProposal}
              >
                <ArrowUpRight className='h-4 w-4' />
                Revoke Proposal
              </Button>
            </div>
          </div>

          {/* Assets and Pending Transactions */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Pending Transactions Section */}
            <Card className='border-[#1184B6]'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-lg'>Pending transactions</CardTitle>
              </CardHeader>
              <CardContent className='pb-0'>
                {metaTxsPending.length === 0 ? (
                  <div className='text-center py-6 text-muted-foreground'>
                    No pending transactions
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {metaTxsPending.map((tx) => (
                      <div
                        key={tx._id}
                        onClick={() => handleTxClick(tx)}
                        className='flex items-center justify-between p-4 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white dark:bg-gray-800'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
                            <Clock className='h-5 w-5 text-purple-600 dark:text-purple-300' />
                          </div>
                          <div>
                            <div className='font-medium capitalize'>
                              Tx created by {tx.createdBy.substring(0, 6)}...
                              {tx.createdBy.substring(tx.createdBy.length - 4)}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='text-right'>
                            <div className='font-medium'>
                              {tx.signatures.length} of{" "}
                              {shieldWalletInfo?.threshold} signatures required
                            </div>
                            <Badge
                              variant='outline'
                              className='text-[10px] bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                            >
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owners Section */}
            <Card className='border-[#1184B6]'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-lg'>Owners of the Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {/* Use safeInfo.signers if available, otherwise use dummy data */}
                  {shieldWalletInfo && shieldWalletInfo.signers.length > 0 ? (
                    shieldWalletInfo.signers.map((signer, index) => (
                      <div
                        key={signer.id || index}
                        className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50'
                      >
                        <Avatar className='h-8 w-8 bg-blue-100 text-blue-600 flex items-center justify-center'>
                          <AvatarFallback>{index + 1}</AvatarFallback>
                        </Avatar>
                        <div className='flex flex-col'>
                          <span className='text-sm font-medium truncate'>
                            {signer.name || "Not found"}
                          </span>
                          <span className='text-xs font-mono text-muted-foreground'>
                            {signer.address}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='space-y-4 animate-pulse'>
                      <div className='flex items-center gap-3'>
                        <div className='h-8 w-8 rounded-full bg-gray-200'></div>
                        <div className='space-y-2'>
                          <div className='h-4 w-32 bg-gray-200 rounded'></div>
                          <div className='h-3 w-24 bg-gray-200 rounded'></div>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='h-8 w-8 rounded-full bg-gray-200'></div>
                        <div className='space-y-2'>
                          <div className='h-4 w-32 bg-gray-200 rounded'></div>
                          <div className='h-3 w-24 bg-gray-200 rounded'></div>
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='h-8 w-8 rounded-full bg-gray-200'></div>
                        <div className='space-y-2'>
                          <div className='h-4 w-32 bg-gray-200 rounded'></div>
                          <div className='h-3 w-24 bg-gray-200 rounded'></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Other Transactions Section (Completed and Cancelled) */}
            <Card className='border-[#1184B6]'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <CardTitle className='text-lg'>Other Transactions</CardTitle>
              </CardHeader>
              <CardContent className='pb-0'>
                {metaTxs.filter(
                  (tx) => tx.status === "executed" || tx.status === "cancelled"
                ).length === 0 ? (
                  <div className='text-center py-6 text-muted-foreground'>
                    No completed or cancelled transactions
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {metaTxs
                      .filter(
                        (tx) =>
                          tx.status === "executed" || tx.status === "cancelled"
                      )
                      .map((tx) => (
                        <Link
                          href={`/transactions/${tx._id}`}
                          className='block'
                        >
                          <div
                            key={tx._id}
                            className='flex items-center justify-between p-4 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white dark:bg-gray-800'
                          >
                            <div className='flex items-center gap-3'>
                              <div className='flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
                                {tx.status === "executed" ? (
                                  <ArrowUpRight className='h-5 w-5 text-green-600 dark:text-green-300' />
                                ) : (
                                  <ArrowDownLeft className='h-5 w-5 text-red-600 dark:text-red-300' />
                                )}
                              </div>
                              <div>
                                <div className='font-medium capitalize'>
                                  Tx created by {tx.createdBy.substring(0, 6)}
                                  ...
                                  {tx.createdBy.substring(
                                    tx.createdBy.length - 4
                                  )}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center gap-3'>
                              <div className='text-right'>
                                <div className='font-medium'>
                                  {tx.signatures.length} of{" "}
                                  {shieldWalletInfo?.threshold} signatures
                                  required
                                </div>
                                <Badge
                                  variant='outline'
                                  className={`text-[10px] ${
                                    tx.status === "executed"
                                      ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                                      : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                                  }`}
                                >
                                  {tx.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
