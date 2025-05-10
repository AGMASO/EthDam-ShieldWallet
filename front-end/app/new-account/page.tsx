"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CreateSafeFormTwo from "@/components/secondFormCreation";
import createSafeAccount from "@/lib/scripts/createSafeAccount";
interface Network {
  id: string;
  name: string;
  icon: string;
}
interface AllowedTarget {
  target: string; // address to
  selector: string; // bytes4 selector
  maxValue: string; // uint256 maxValue
}
// const formattedTarget = {
//   to: target as `0x${string}`,           // address
//   selector: selector as `0x${string}`,    // bytes4
//   maxValue: BigInt(maxValue)             // uint256
// }

interface FormData {
  accountName: string;
  addressWallet: string;
  selectedNetwork: Network;
  signers: Signer[];
  threshold: number;
  creator: string;
  allowedTargets: AllowedTarget[];
}

interface Signer {
  id: string;
  name: string;
  address: string;
}
const NewAccount = () => {
  const router = useRouter();

  const handleCreateWallet = async (formData: FormData) => {
    // Wait for blockchain creation (handled in CreateSafeFormTwo)
    // This will be called after the blockchain returns the proxy address
    if (!formData.addressWallet) {
      alert("Please enter a valid address");
      return;
    }
    const response = await fetch("/api/shieldwallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountName: formData.accountName,
        addressWallet: formData.addressWallet,
        selectedNetwork: formData.selectedNetwork,
        signers: formData.signers,
        threshold: formData.threshold,
        creator: formData.signers[0]?.address,
      }),
    });
    if (!response.ok) {
      alert("Failed to create wallet in backend");
    }

    const data = await response.json();
    console.log("This is the data created", data);
    router.push("/");
  };

  return (
    <div>
      <CreateSafeFormTwo onSubmit={handleCreateWallet}></CreateSafeFormTwo>
    </div>
  );
};

export default NewAccount;
