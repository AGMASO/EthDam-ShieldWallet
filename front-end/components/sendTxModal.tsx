// Refactored SendTransactionPageForm with support for batch and single transaction modes.
"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Info,
  Plus,
  Trash2,
  ChevronLeft,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useAccount, useWatchContractEvent } from "wagmi";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "./ui/card";
import { parseEther } from "viem";
import propExecution from "@/lib/scripts/propExecution";
import { shieldWalletAbi } from "@/lib/abis/shieldWalletAbi";

interface Network {
  id: string;
  name: string;
  icon?: string;
}

interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  address?: string;
}

interface ShieldWalletInfo {
  _id?: string;
  accountName: string;
  addressWallet: string;
  selectedNetwork: Network;
  signers: Signer[];
  threshold: number;
  creator: string;
}

interface Signer {
  id: string;
  name: string;
  address: string;
}

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

interface SendTransactionPageFormProps {
  onCancel: () => void;
  shieldWalletInfo?: ShieldWalletInfo;
}

export default function SendTransactionPageForm({
  onCancel,
  shieldWalletInfo,
}: SendTransactionPageFormProps) {
  const { address, chain } = useAccount();

  const [step, setStep] = useState(1);
  const [selectedToken, setSelectedToken] = useState(0);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    proposalParams: [
      { target: "", amount: "", calldata: "", displayAmount: "" },
    ],
    tokenSymbol: "ETH",
    execType: "0x00",
  });

  //!listen to the event
  useWatchContractEvent({
    address: shieldWalletInfo?.addressWallet as `0x${string}`,
    abi: shieldWalletAbi,
    eventName: "ExecutionProposed",

    onLogs(logs) {
      //!log is the event data
      console.log("New logs!", logs);
      //!add the event info to DB
      const handleMetaTx = async () => {
        // Prepare data for MetaTx
        const dataToSign = formData.proposalParams.map((param) => ({
          target: param.target,
          value: param.amount,
          callData: param.calldata,
        }));

        const executionId = logs[0].args.id;
        const mode = logs[0].args.mode;
        const threshold = logs[0].args.threshold;
        const blockTimestamp = logs[0].args.timestamp;
        const executionData = logs[0].args.executionData;
        console.log("Address", shieldWalletInfo?.addressWallet);
        console.log("executionId", executionId);
        console.log("mode", mode);
        console.log("threshold", threshold);
        console.log("blockTimestamp", blockTimestamp);
        console.log("executionData", executionData);
        // Create MetaTx
        const response = await fetch(
          `/api/shieldwallet/${shieldWalletInfo?.addressWallet}/metatx`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              executionId: executionId,
              mode: mode,
              executionData: executionData,
              threshold: threshold,
              blockTimestamp: Number(blockTimestamp),
              dataToSign: dataToSign,
              signatures: [], // Will be populated by signers
              createdBy: address, // Current user's address
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to create MetaTx");
        }

        const result = await response.json();
        console.log("MetaTx created:", result);

        setShowConfirmDialog(false);
        resetForm();
        onCancel();
      };
      handleMetaTx();
    },
  });

  const tokens: Token[] = [
    {
      id: "eth",
      name: "Oasis Test",
      symbol: "TEST",
      icon: "/chain_logo.png",
      decimals: 18,
    },
  ];

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    console.log("Form data updated:", formData);
  };

  const handleAmountChange = (displayAmount: string, index = 0) => {
    try {
      const amountInWei = parseEther(displayAmount);
      const newParams = [...formData.proposalParams];
      newParams[index] = {
        ...newParams[index],
        displayAmount,
        amount: amountInWei.toString(),
      };
      updateFormData({ proposalParams: newParams });
    } catch {
      const newParams = [...formData.proposalParams];
      newParams[index] = {
        ...newParams[index],
        displayAmount,
        amount: "0",
      };
      updateFormData({ proposalParams: newParams });
    }
  };

  const handleTokenSelect = (index: number) => {
    setSelectedToken(index);
    const token = tokens[index];
    updateFormData({
      tokenSymbol: token.symbol,
      proposalParams: formData.proposalParams.map((p) => ({
        ...p,
        amount: "",
        displayAmount: "",
      })),
    });
    setIsTokenDropdownOpen(false);
  };

  const calculateTransactionHashes = async () => {
    try {
      setIsCalculating(true);
      // TODO: Implement calculation logic
      setIsCalculating(false);
    } catch (e) {
      console.error("Hash calculation error", e);
      setIsCalculating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      if (step === 1) await calculateTransactionHashes();
      setStep((prev) => prev + 1);
      return;
    }

    try {
      // Execute onchain transaction
      const txHash = await propExecution({
        formData,
        shieldWalletAddress: shieldWalletInfo?.addressWallet || "",
      });
      console.log("txHash check", txHash);

      setShowConfirmDialog(false);
      resetForm();
      onCancel();
    } catch (e) {
      console.error("Transaction creation failed", e);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      proposalParams: [
        { target: "", amount: "", calldata: "", displayAmount: "" },
      ],
      tokenSymbol: "ETH",
      execType: "0x00",
    });
    setSelectedToken(0);
  };

  const handleCloseAttempt = () => {
    if (
      formData.proposalParams[0].target ||
      formData.proposalParams[0].amount ||
      step > 1
    ) {
      setShowConfirmDialog(true);
    } else {
      resetForm();
      onCancel();
    }
  };

  const handleConfirmClose = () => {
    resetForm();
    onCancel();
    setShowConfirmDialog(false);
  };

  const renderStepIndicator = () => {
    const progress = (step / 3) * 100;
    return (
      <div className='w-full h-1 bg-gray-200 mb-6 rounded-full overflow-hidden'>
        <div
          className='h-full bg-[#1184B6]'
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  const renderInputGroup = (param: ProposalParams, index: number) => (
    <div key={index} className='mb-6 border-b pb-4'>
      <Label className='text-gray-500'>Recipient {index + 1}</Label>
      <Input
        value={param.target}
        placeholder='Recipient address'
        onChange={(e) => {
          const updated = [...formData.proposalParams];
          updated[index].target = e.target.value;
          updateFormData({ proposalParams: updated });
        }}
      />
      <Label className='text-gray-500 mt-2'>Amount {index + 1}</Label>
      <Input
        value={param.displayAmount}
        placeholder='0'
        onChange={(e) => handleAmountChange(e.target.value, index)}
      />
      <Label className='text-gray-500 mt-2'>Calldata {index + 1}</Label>
      <Input
        value={param.calldata}
        placeholder='0x'
        onChange={(e) => {
          const updated = [...formData.proposalParams];
          updated[index].calldata = e.target.value;
          updateFormData({ proposalParams: updated });
        }}
      />
      {formData.execType === "0x01" && (
        <Button
          variant='destructive'
          className='mt-2'
          onClick={() => {
            const updated = formData.proposalParams.filter(
              (_, i) => i !== index
            );
            updateFormData({ proposalParams: updated });
          }}
        >
          <Trash2 className='mr-2 h-4 w-4' /> Remove
        </Button>
      )}
    </div>
  );

  const renderStepContent = (): ReactNode => {
    switch (step) {
      case 1:
        return (
          <div className='max-w-3xl mx-auto p-1'>
            <Card className='p-4'>
              <Label className='mb-2 block text-gray-500'>Execution Type</Label>
              <div className='flex space-x-4'>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='execType'
                    value='0x00'
                    checked={formData.execType === "0x00"}
                    onChange={(e) =>
                      updateFormData({
                        execType: e.target.value as "0x00" | "0x01",
                        proposalParams: [
                          {
                            target: "",
                            amount: "",
                            calldata: "",
                            displayAmount: "",
                          },
                        ],
                      })
                    }
                    className='mr-2'
                  />{" "}
                  Call
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='execType'
                    value='0x01'
                    checked={formData.execType === "0x01"}
                    onChange={(e) =>
                      updateFormData({
                        execType: e.target.value as "0x00" | "0x01",
                        proposalParams: [
                          {
                            target: "",
                            amount: "",
                            calldata: "",
                            displayAmount: "",
                          },
                        ],
                      })
                    }
                    className='mr-2'
                  />{" "}
                  Batch Call
                </label>
              </div>

              {formData.proposalParams.map(renderInputGroup)}

              {formData.execType === "0x01" && (
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() =>
                    updateFormData({
                      proposalParams: [
                        ...formData.proposalParams,
                        {
                          target: "",
                          amount: "",
                          calldata: "",
                          displayAmount: "",
                        },
                      ],
                    })
                  }
                >
                  <Plus className='mr-2 h-4 w-4' /> Add Transaction
                </Button>
              )}
            </Card>
          </div>
        );

      case 2:
        return (
          <div className='max-w-3xl mx-auto p-1'>
            <Card className='p-4'>
              <div className='flex flex-col'>
                <div className='flex flex-col items-center text-center mb-6'>
                  <h2 className='text-xl font-bold mb-4'>Review Transaction</h2>
                  <div className='rounded-full bg-gray-100 p-6 mb-6'>
                    <ArrowUpRight className='h-12 w-12 text-emerald-600' />
                  </div>
                  <h3 className='font-semibold text-lg'>
                    {formData.execType === "0x00" ? (
                      <>
                        Sending {formData.proposalParams[0].displayAmount}{" "}
                        {formData.tokenSymbol}
                      </>
                    ) : (
                      <>Sending {formData.proposalParams.length} transactions</>
                    )}
                  </h3>
                </div>

                {isCalculating ? (
                  <div className='flex justify-center items-center py-12'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500'></div>
                    <span className='ml-3 text-gray-600'>
                      Calculating transaction details...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className='space-y-4 border-t border-b py-6 px-2'>
                      {formData.proposalParams.map((param, index) => (
                        <div key={index} className='space-y-4'>
                          <h3 className='font-semibold'>
                            Transaction {index + 1}
                          </h3>
                          <div className='flex justify-between items-center'>
                            <span className='text-gray-500'>to:</span>
                            <div className='flex items-center gap-2'>
                              <div className='font-medium'>{param.target}</div>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                              >
                                <Copy className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>

                          <div className='flex justify-between items-center'>
                            <span className='text-gray-500'>value:</span>
                            <div className='font-medium'>
                              {param.displayAmount} {formData.tokenSymbol}
                            </div>
                          </div>

                          <div className='flex justify-between items-center'>
                            <span className='text-gray-500'>data:</span>
                            <div className='flex items-center gap-2'>
                              <div className='font-medium'>
                                {param.calldata || "0x"}
                              </div>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-6 w-6'
                              >
                                <Copy className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className='mt-6 text-left w-full px-2'>
                      <p className='text-gray-500 text-sm'>
                        This transaction requires confirmation from your
                        connected wallet. Please review all details carefully
                        before proceeding.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='px-4 py-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Send Transaction</h1>
        <Button
          variant='outline'
          className='gap-2 border-gray-300'
          onClick={handleCloseAttempt}
        >
          Cancel
        </Button>
      </div>
      {renderStepIndicator()}
      <form onSubmit={handleSubmit}>
        {renderStepContent()}
        <div className='p-6 flex justify-between'>
          {step > 1 ? (
            <Button
              type='button'
              variant='outline'
              className='border-gray-300'
              onClick={() => setStep(step - 2)}
            >
              <ChevronLeft className='w-4 h-4 mr-2' /> Back
            </Button>
          ) : (
            <Button
              variant='outline'
              className='gap-2 border-gray-300'
              onClick={handleCloseAttempt}
            >
              Cancel
            </Button>
          )}
          <Button
            type='submit'
            className='bg-black text-white hover:bg-gray-800'
          >
            {step === 1 ? "Next" : "Create Transaction"}
          </Button>
        </div>
      </form>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to close?</AlertDialogTitle>
            <AlertDialogDescription>
              All your form data will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className='bg-red-600 hover:bg-red-700'
            >
              Close & Delete Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* <div className='flex justify-center mb-4'>
        <Image
          src='/shieldLogo.png'
          alt='Shield Logo'
          width={40}
          height={40}
          priority
          className='rounded-full'
        />
      </div> */}
    </div>
  );
}
