import { factoryAbi } from "@/lib/abis/factoryAbi";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ChevronDown,
  Info,
  Plus,
  Trash2,
  ChevronLeft,
  CircleIcon as CircleInfo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useAccount, useWatchContractEvent } from "wagmi";
import deployShieldWallet from "@/lib/scripts/deployShieldWallet";
import { useRouter } from "next/navigation";
import { z } from "zod";

const shieldWalletFactoryAbi = factoryAbi;
const shieldWalletFactory = "0x408e866d994b9C71404ee4BEB258DE798c65196e"; //already deployed

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

interface Signer {
  id: string;
  name: string;
  address: string;
}

interface CreateSafeFormProps {
  onSubmit?: (data: FormData) => void;
}

interface EventData {
  proxy: string;
}

//!SCHEMA ZOD
const signerSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z
    .string()
    .min(1, "Target address is required")
    .refine(
      (val) => /^0x[0-9a-fA-F]{40}$/.test(val),
      "Must be a valid Ethereum address (0x followed by 40 hex characters)"
    ),
});

const targetSchema = z.object({
  target: z
    .string()
    .min(1, "Target address is required")
    .refine(
      (val) => /^0x[0-9a-fA-F]{40}$/.test(val),
      "Must be a valid Ethereum address (0x followed by 40 hex characters)"
    ),
  selector: z
    .string()
    .min(1, "Function selector is required")
    .refine(
      (val) => /^0x[0-9a-fA-F]{8}$/.test(val),
      "Must be a valid function selector (0x followed by 8 hex characters)"
    ),
  maxValue: z
    .string()
    .min(1, "Max value is required")
    .refine((val) => /^\d+$/.test(val), "Must be a valid number"),
});

const formSchema = z.object({
  accountName: z.string().min(1, "Name is required"),
  addressWallet: z.string().optional(),
  selectedNetwork: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
  }),
  signers: z.array(signerSchema).min(1),
  threshold: z.number().min(1),
  managementThreshold: z.number().min(1),
  revocationThreshold: z.number().min(1),
  proposer: z.string().optional(),
  timeLockDelay: z.number().min(0),
  creator: z.string().optional(),
  allowedTargets: z.array(targetSchema),
});
//!EnD

export default function CreateSafeFormTwo({ onSubmit }: CreateSafeFormProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, any>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    accountName: "",
    addressWallet: "",
    selectedNetwork: {
      id: "",
      name: "",
      icon: "",
    },
    signers: [{ id: "1", name: "", address: address!.toLowerCase() }],
    threshold: 1,
    managementThreshold: 1,
    revocationThreshold: 1,
    proposer: "",
    timeLockDelay: 0,
    creator: address!.toLowerCase(),
    allowedTargets: [
      {
        target: "",
        selector: "",
        maxValue: "",
      },
    ],
  });
  //!listen to the event
  useWatchContractEvent({
    address: shieldWalletFactory,
    abi: shieldWalletFactoryAbi,
    eventName: "ShieldWalletCreated",
    chainId: 23295,
    onLogs(logs) {
      //!log is the event data
      console.log("New logs!", logs);
      //!add the event info to DB
      const handleEventShieldWalletCreated = async () => {
        // Prepare data for MetaTx

        const proxy = `0x${logs[0].topics[1]?.slice(-40)}`;
        const singleton = logs[0].topics[2];

        const accountName = formData.accountName;
        const addressWallet = proxy;
        const selectedNetwork = formData.selectedNetwork;
        const signers = formData.signers;
        const threshold = formData.threshold;
        const managementThreshold = formData.managementThreshold;
        const revocationThreshold = formData.revocationThreshold;
        const proposer = formData.proposer;
        const timeLockDelay = formData.timeLockDelay;
        const allowedTargets = formData.allowedTargets;
        const creator = formData.creator;

        // Create MetaTx
        const response = await fetch(`/api/shieldwallet/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountName,
            addressWallet,
            selectedNetwork,
            signers,
            threshold,
            creator,
            managementThreshold,
            revocationThreshold,
            proposer,
            timeLockDelay,
            allowedTargets,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create MetaTx");
        }

        const result = await response.json();
        console.log("ShieldWallet created:", result);
      };
      handleEventShieldWalletCreated();
      router.push("/");
    },
  });

  const networkOptions: Network[] = [
    {
      id: "Oasis Sapphire Testnet",
      name: "Oasis Sapphire Testnet",
      icon: "/chain_logo.png",
    },
  ];

  const nextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      // Validate step 1 fields
      const step1Validation = z
        .object({
          accountName: formSchema.shape.accountName,
          selectedNetwork: formSchema.shape.selectedNetwork,
        })
        .safeParse({
          accountName: formData.accountName,
          selectedNetwork: formData.selectedNetwork,
        });

      if (!step1Validation.success) {
        setFormErrors(step1Validation.error.format());
        return;
      }
    } else if (step === 2) {
      // Validate step 2 fields
      const step2Validation = z
        .object({
          signers: formSchema.shape.signers,
          threshold: formSchema.shape.threshold,
        })
        .safeParse({
          signers: formData.signers,
          threshold: formData.threshold,
        });

      if (!step2Validation.success) {
        setFormErrors(step2Validation.error.format());
        return;
      }
    }

    // If validation passes, proceed to next step
    setStep((prev) => prev + 1);
    setFormErrors({}); // Clear any previous errors
  };
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      nextStep();
    } else {
      try {
        //!VALIDATION
        const parsed = formSchema.safeParse(formData);
        if (!parsed.success) {
          setFormErrors(parsed.error.format());
          setGeneralError(
            "Please review your data. Some fields have incorrect format or are missing required information."
          );
          return;
        }
        setGeneralError(null); // Clear error if validation passes
        //!ENd
        //!Introducir method Blockchain
        const result = await deployShieldWallet(formData);

        if (result?.success) {
          console.log("Transaction hash:", result.transactionHash);
          // Aquí puedes manejar el éxito, por ejemplo redirigir o mostrar mensaje
          //router.push("/");
        } else {
          setGeneralError(result?.error || "Failed to deploy Shield Wallet");
        }
      } catch (error) {
        console.error("Error creating Safe Account:", error);
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    }
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    console.log(formData);
  };

  //! esta Fn crea un newsigner en el array
  const addSigner = () => {
    const newSigner = {
      id: `${formData.signers.length + 1}`,
      name: `Signer ${formData.signers.length + 1}`,
      address: "",
    };
    const newSigners = [...formData.signers, newSigner];
    updateFormData({
      signers: newSigners,
      threshold: Math.min(formData.threshold, newSigners.length),
    });
  };

  const removeSigner = (id: string) => {
    const newSigners = formData.signers.filter((signer) => signer.id !== id);
    updateFormData({
      signers: newSigners,
      threshold: Math.min(formData.threshold, newSigners.length),
    });
  };

  // const updateSigner = (id: string, updates: Partial<Signer>) => {
  //   updateFormData({
  //     signers: formData.signers.map((signer) =>
  //       signer.id === id ? { ...signer, ...updates } : signer
  //     ),
  //   });
  // };

  const renderStepIndicator = () => {
    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    return (
      <div className='w-full h-1 bg-gray-200 mb-6 rounded-full overflow-hidden'>
        <div
          className='h-full bg-[#1184B6]'
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  const renderThresholds = () => (
    <div className='pt-6'>
      <div className='flex items-center mb-2'>
        <h3 className='font-bold'>Thresholds</h3>
      </div>
      <p className='text-gray-600 text-sm mb-4'>
        Set the required number of confirmations for different operations:
      </p>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div>
          <label className='block text-sm text-gray-500 mb-2'>
            Transaction Threshold
          </label>
          <div className='flex items-center gap-3'>
            <div className='relative w-20'>
              <select
                className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black appearance-none'
                value={formData.threshold}
                onChange={(e) =>
                  updateFormData({
                    threshold: Number.parseInt(e.target.value),
                  })
                }
              >
                {Array.from(
                  { length: formData.signers.length },
                  (_, i) => i + 1
                ).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none' />
            </div>
            <span className='text-sm text-gray-600'>for transactions</span>
          </div>
        </div>

        <div>
          <label className='block text-sm text-gray-500 mb-2'>
            Management Threshold
          </label>
          <div className='flex items-center gap-3'>
            <div className='relative w-20'>
              <select
                className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black appearance-none'
                value={formData.managementThreshold}
                onChange={(e) =>
                  updateFormData({
                    managementThreshold: Number.parseInt(e.target.value),
                  })
                }
              >
                {Array.from(
                  { length: formData.signers.length },
                  (_, i) => i + 1
                ).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none' />
            </div>
            <span className='text-sm text-gray-600'>for management</span>
          </div>
        </div>

        <div>
          <label className='block text-sm text-gray-500 mb-2'>
            Revocation Threshold
          </label>
          <div className='flex items-center gap-3'>
            <div className='relative w-20'>
              <select
                className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black appearance-none'
                value={formData.revocationThreshold}
                onChange={(e) =>
                  updateFormData({
                    revocationThreshold: Number.parseInt(e.target.value),
                  })
                }
              >
                {Array.from(
                  { length: formData.signers.length },
                  (_, i) => i + 1
                ).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <ChevronDown className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none' />
            </div>
            <span className='text-sm text-gray-600'>for revocation</span>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
        <div>
          <label className='block text-sm text-gray-500 mb-2'>
            Proposer Address
          </label>
          <div className='flex items-center'>
            <input
              type='text'
              value={formData.proposer}
              placeholder='0x...'
              onChange={(e) =>
                updateFormData({
                  proposer: e.target.value.toLowerCase(),
                })
              }
              className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black'
            />
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            Address that can propose transactions
          </p>
        </div>

        <div>
          <label className='block text-sm text-gray-500 mb-2'>
            TimeLock Delay (seconds)
          </label>
          <div className='flex items-center'>
            <input
              type='number'
              min='0'
              value={formData.timeLockDelay}
              onChange={(e) =>
                updateFormData({
                  timeLockDelay: Number(e.target.value),
                })
              }
              className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black'
            />
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            Minimum time before a transaction can be executed
          </p>
        </div>
      </div>
    </div>
  );

  const renderStepContent = (): ReactNode => {
    switch (step) {
      case 1:
        return (
          <>
            <div className='p-6 border-b border-gray-100'>
              <div className='flex items-start gap-4'>
                <div className='flex items-center justify-center w-8 h-8 rounded-full bg-black text-white'>
                  <span>1</span>
                </div>
                <div>
                  <h2 className='text-xl font-bold'>Set up the basics</h2>
                  <p className='text-gray-600'>
                    Give a name to your account and select which networks to
                    deploy it on.
                  </p>
                </div>
              </div>
            </div>

            <div className='p-6'>
              <div className='mb-6'>
                <label
                  htmlFor='name'
                  className='block text-sm text-gray-500 mb-2'
                >
                  Name
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    id='name'
                    value={formData.accountName}
                    onChange={(e) =>
                      updateFormData({ accountName: e.target.value })
                    }
                    className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black'
                    required
                  />
                  <Info className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                </div>
              </div>

              <div>
                <h3 className='font-bold mb-1'>Select Networks</h3>
                <p className='text-gray-600 text-sm mb-4'>
                  Choose which networks you want your account to be active on.
                  You can add more networks later.
                </p>

                <div className='relative'>
                  <div
                    onClick={() => setIsOpen(!isOpen)}
                    className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black cursor-pointer flex items-center justify-between'
                  >
                    {formData.selectedNetwork.id ? (
                      <div className='flex items-center gap-2'>
                        <Image
                          src={formData.selectedNetwork.icon}
                          alt={`${formData.selectedNetwork.name} icon`}
                          width={20}
                          height={20}
                        />
                        <span>{formData.selectedNetwork.name}</span>
                      </div>
                    ) : (
                      <div className='flex items-center gap-2 text-gray-500'>
                        <span>Select Network</span>
                      </div>
                    )}
                    <ChevronDown className='text-gray-500 w-5 h-5' />
                  </div>

                  {isOpen && (
                    <div className='absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg'>
                      {networkOptions.map((network) => (
                        <div
                          key={network.id}
                          onClick={() => {
                            updateFormData({ selectedNetwork: network });
                            setIsOpen(false);
                          }}
                          className='p-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2'
                        >
                          <Image
                            src={network.icon}
                            alt={`${network.name} icon`}
                            width={20}
                            height={20}
                          />
                          <span>{network.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className='p-6 border-b border-gray-100'>
              <div className='flex items-start gap-4'>
                <div className='flex items-center justify-center w-8 h-8 rounded-full bg-black text-white'>
                  <span>2</span>
                </div>
                <div>
                  <h2 className='text-xl font-bold'>
                    Signers and confirmations
                  </h2>
                  <p className='text-gray-600'>
                    Set the signer wallets of your Safe Account and how many
                    need to confirm to execute a valid transaction.
                  </p>
                </div>
              </div>
            </div>

            <div className='p-6'>
              {formData.signers.map((signer, index) => (
                <div key={signer.id} className='mb-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-2'>
                    <div>
                      <label className='block text-sm text-gray-500 mb-2'>
                        Signer name
                      </label>
                      <input
                        type='text'
                        value={signer.name}
                        required
                        placeholder='Enter signer name'
                        minLength={2}
                        maxLength={50}
                        onChange={(e) => {
                          const newSigners = [...formData.signers];
                          newSigners[index] = {
                            ...newSigners[index],
                            name: e.target.value,
                          };
                          updateFormData({ signers: newSigners });
                        }}
                        className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black'
                      />
                      {index === 0 && (
                        <div className='text-xs text-gray-500 mt-1'>
                          Your connected wallet
                        </div>
                      )}
                    </div>
                    <div className='relative'>
                      <label className='block text-sm text-gray-500 mb-2'>
                        Signer address
                      </label>
                      <div className='flex items-center'>
                        {index === 0 ? (
                          <div className='flex-1 flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50'>
                            <div className='flex items-center gap-2'>
                              <span className='text-sm truncate'>
                                {address?.toLowerCase()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <input
                            type='text'
                            value={signer.address}
                            required
                            placeholder='Enter signer address'
                            onChange={(e) => {
                              const newSigners = [...formData.signers];
                              newSigners[index] = {
                                ...newSigners[index],
                                address: e.target.value.toLowerCase(),
                              };
                              updateFormData({ signers: newSigners });
                            }}
                            className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black'
                          />
                        )}
                        {index > 0 && (
                          <button
                            type='button'
                            className='ml-2 text-gray-500 hover:text-red-500'
                            onClick={() => removeSigner(signer.id)}
                          >
                            <Trash2 className='w-5 h-5' />
                          </button>
                        )}
                      </div>
                      {formErrors.signers?.[index]?.address && (
                        <div className='text-red-500 text-sm mt-1'>
                          {formErrors.signers[index].address._errors[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type='button'
                className='flex items-center text-black font-medium mb-8'
                onClick={addSigner}
              >
                <Plus className='w-5 h-5 mr-2' />
                Add new signer
              </button>

              {renderThresholds()}

              <div className='border-t border-gray-100 pt-6'>
                <div className='flex items-center mb-2'>
                  <h3 className='font-bold'>Allowed Targets</h3>
                </div>
                <p className='text-gray-600 text-sm mb-4'>
                  Set the allowed targets that can be called by this Safe
                  Account.
                </p>

                {formData.allowedTargets.map((target, index) => (
                  <div key={index} className='mb-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-2'>
                      <div>
                        <label className='block text-sm text-gray-500 mb-2'>
                          Target Address
                        </label>
                        <input
                          type='text'
                          value={target.target}
                          required
                          placeholder='Enter target address'
                          onChange={(e) => {
                            const newTargets = [...formData.allowedTargets];
                            newTargets[index] = {
                              ...newTargets[index],
                              target: e.target.value.toLowerCase(),
                            };
                            updateFormData({ allowedTargets: newTargets });
                          }}
                          className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black'
                        />
                        {formErrors.allowedTargets?.[index]?.target && (
                          <div className='text-red-500 text-sm mt-1'>
                            {formErrors.allowedTargets[index].target._errors[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className='block text-sm text-gray-500 mb-2'>
                          Function Selector
                        </label>
                        <input
                          type='text'
                          value={target.selector}
                          required
                          placeholder='Enter function selector'
                          onChange={(e) => {
                            const newTargets = [...formData.allowedTargets];
                            newTargets[index] = {
                              ...newTargets[index],
                              selector: e.target.value,
                            };
                            updateFormData({ allowedTargets: newTargets });
                          }}
                          className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black'
                        />
                        {formErrors.allowedTargets?.[index]?.selector && (
                          <div className='text-red-500 text-sm mt-1'>
                            {
                              formErrors.allowedTargets[index].selector
                                ._errors[0]
                            }
                          </div>
                        )}
                      </div>
                      <div className='relative'>
                        <label className='block text-sm text-gray-500 mb-2'>
                          Max Value
                        </label>
                        <div className='flex items-center'>
                          <input
                            type='text'
                            value={target.maxValue}
                            required
                            placeholder='Enter max value'
                            onChange={(e) => {
                              const newTargets = [...formData.allowedTargets];
                              newTargets[index] = {
                                ...newTargets[index],
                                maxValue: e.target.value,
                              };
                              updateFormData({ allowedTargets: newTargets });
                            }}
                            className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black'
                          />
                          {index > 0 && (
                            <button
                              type='button'
                              className='ml-2 text-gray-500 hover:text-red-500'
                              onClick={() => {
                                const newTargets =
                                  formData.allowedTargets.filter(
                                    (_, i) => i !== index
                                  );
                                updateFormData({ allowedTargets: newTargets });
                              }}
                            >
                              <Trash2 className='w-5 h-5' />
                            </button>
                          )}
                        </div>
                        {formErrors.allowedTargets?.[index]?.maxValue && (
                          <div className='text-red-500 text-sm mt-1'>
                            {
                              formErrors.allowedTargets[index].maxValue
                                ._errors[0]
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type='button'
                  className='flex items-center text-black font-medium mb-8'
                  onClick={() => {
                    const newTargets = [
                      ...formData.allowedTargets,
                      {
                        target: "",
                        selector: "",
                        maxValue: "",
                      },
                    ];
                    updateFormData({ allowedTargets: newTargets });
                  }}
                >
                  <Plus className='w-5 h-5 mr-2' />
                  Add new target
                </button>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <div className='p-6'>
            <h2 className='text-xl font-bold mb-4'>Review & Deploy</h2>
            <p className='text-gray-600 mb-6'>
              Review your Safe Account details before deployment.
            </p>

            <div className='space-y-4 mb-6'>
              <div className='p-4 border border-gray-200 rounded-lg'>
                <h3 className='font-medium mb-2'>Account Name</h3>
                <p>{formData.accountName}</p>
              </div>

              <div className='p-4 border border-gray-200 rounded-lg'>
                <h3 className='font-medium mb-2'>Network</h3>
                <div className='flex items-center gap-2'>
                  <Image
                    src={formData.selectedNetwork.icon || "/placeholder.svg"}
                    alt={formData.selectedNetwork.name}
                    width={20}
                    height={20}
                    className='rounded-full'
                  />
                  <span>{formData.selectedNetwork.name}</span>
                </div>
              </div>

              <div className='p-4 border border-gray-200 rounded-lg'>
                <h3 className='font-medium mb-2'>
                  Signers ({formData.signers.length})
                </h3>
                <ul className='space-y-2'>
                  {formData.signers.map((signer) => (
                    <li key={signer.id} className='flex items-center gap-2'>
                      <span className='font-medium'>{signer.name}:</span>
                      <span className='text-sm truncate'>
                        {signer.address || "Not set"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className='p-4 border border-gray-200 rounded-lg'>
                <h3 className='font-medium mb-2'>Threshold</h3>
                <p>
                  {formData.threshold} out of {formData.signers.length} signers
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderAccountPreview = () => {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
        <div className='flex justify-center mb-4'>
          <Image
            src='/placeholder.svg?height=32&width=32'
            alt='Safe Logo'
            width={32}
            height={32}
          />
        </div>
        <h2 className='text-xl font-bold text-center mb-6'>
          Your Safe Account preview
        </h2>

        <div className='space-y-4'>
          <div className='flex justify-between items-center border-t border-gray-100 pt-4'>
            <span className='text-gray-600'>Wallet</span>
            <div className='flex items-center gap-2'>
              <Image
                src='/placeholder.svg?height=24&width=24'
                alt='Wallet icon'
                width={24}
                height={24}
                className='rounded-full'
              />
              <span className='text-sm'>sep:0x61lb...F12e</span>
            </div>
          </div>

          {formData.accountName && (
            <div className='flex justify-between items-center border-t border-gray-100 pt-4'>
              <span className='text-gray-600'>Name</span>
              <span>{formData.accountName}</span>
            </div>
          )}

          {formData.selectedNetwork && (
            <div className='flex justify-between items-center border-t border-gray-100 pt-4'>
              <span className='text-gray-600'>Network(s)</span>
              <Image
                src={formData.selectedNetwork.icon || "/placeholder.svg"}
                alt={formData.selectedNetwork.name}
                width={24}
                height={24}
                className='rounded-full'
              />
            </div>
          )}

          {step >= 2 && (
            <div className='mt-8'>
              <div className='bg-blue-50 rounded-md p-3 mb-4'>
                <div className='flex items-center text-blue-800 text-sm font-medium mb-1'>
                  <span className='mr-2'>🔍</span>
                  Safe Account creation
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-600'>Network fee</span>
                  <ChevronDown className='w-5 h-5 text-gray-500' />
                </div>
              </div>

              {step >= 2 && (
                <div className='bg-blue-50 rounded-md p-3'>
                  <div className='flex items-center text-blue-800 text-sm font-medium mb-1'>
                    <span className='mr-2'>🔍</span>
                    Safe Account setup
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-600'>
                      1/{formData.signers.length} policy
                    </span>
                    <ChevronDown className='w-5 h-5 text-gray-500' />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='flex flex-col md:flex-row gap-6 max-w-4xl mx-auto pt-10'>
      <div className='flex-1'>
        <h1 className='text-3xl mb-6 font-montserrat font-light'>
          Create new Safe Account
        </h1>
        {renderStepIndicator()}

        <form
          className='bg-white rounded-lg shadow-sm border border-gray-100 mb-4'
          onSubmit={handleSubmit}
        >
          {generalError && (
            <div className='p-6 border-b border-gray-100'>
              <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4'>
                {generalError}
              </div>
            </div>
          )}
          {renderStepContent()}

          <div className='p-6 border-t border-gray-100'>
            {step === 1 && (
              <p className='text-sm text-gray-600 mb-6'>
                By continuing, you agree to our{" "}
                <Link href='#' className='text-black underline'>
                  terms of use
                </Link>{" "}
                and{" "}
                <Link href='#' className='text-black underline'>
                  privacy policy
                </Link>
                .
              </p>
            )}

            <div className='flex justify-between'>
              {step > 1 ? (
                <Button
                  type='button'
                  variant='outline'
                  className='border-gray-300'
                  onClick={prevStep}
                >
                  <ChevronLeft className='w-4 h-4 mr-2' />
                  Back
                </Button>
              ) : (
                <Button
                  type='button'
                  variant='outline'
                  className='border-gray-300'
                  onClick={() => router.push("/")}
                >
                  Cancel
                </Button>
              )}

              <Button
                type='submit'
                className='bg-black text-white hover:bg-gray-800'
                disabled={
                  step === 2 && formData.signers.some((s) => !s.address)
                }
              >
                {step < 3 ? "Next" : "Create Safe Account"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* <div className='w-full md:w-80'>{renderAccountPreview()}</div> */}
    </div>
  );
}
