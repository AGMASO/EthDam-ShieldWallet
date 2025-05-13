# Shield Wallet
## Winner of the Best Security Project at EthDam 2025
![Shield Wallet Logo](./img/ShieldWalletLogo.png)

Shield Wallet is a POC of a next-generation multisignature meta-transaction design. It is simple but robust in its core and includes many features that have been designed by analyzing the current vulnerabilities in Gnosis Safe that led to attacks like the Bybit one.

> This is experimental software and is provided on an "as is" and "as available" basis. We do not give any warranties and will not be liable for any losses incurred through any use of this code base.

## Features

### 1. Simple Meta-transaction format and Standard EIP-7579 executor interface

Meta-transactions are expressed with a simple Solidity struct; simple and batched execution modes have been implemented to fulfill the `EIP-7579` standard and allow for composability with other wallet AA applications.

```solidity
    /// @dev Call struct for the `execute` function.
    struct Call {
        address to;
        uint256 value;
        bytes data;
    }

    // For the encoding scheme, see: https://eips.ethereum.org/EIPS/eip-7579
    // Bytes Layout:
    // - [0]      ( 1 byte )  `0x00` for single call `0x01` for batch call.
    // - [1]      ( 1 byte )  `0x00` for revert on any failure.
    // - [2..5]   ( 4 bytes)  Reserved by ERC7579 for future standardization.
    // - [6..9]   ( 4 bytes)  `0x00000000`. // Normal Execution mode.
    // - [10..31] (22 bytes)  Unused. Free for use.
    bytes10 internal constant EXECUTIONTYPE_CALL = 0x00000000000000000000;
    bytes10 internal constant EXECUTIONTYPE_BATCH = 0x01000000000000000000;
```

### 2. On-chain timelock, multistep execution with revocation

Instead of atomic execution, Shield implements an on-chain timelock that forces the meta-transaction to be committed on-chain for a certain amount of time before being executed by the smart account.

```solidity
    /// @notice Adds an execution to the queue. Can only be called by an Owner or the Proposer address.
    /// @dev See: https://eips.ethereum.org/EIPS/eip-7579
    /// ShieldWallet EIP-7579 `executionData` encodings:
    /// - `executionData` encoding (single call): abi.encodePacked of `Call` fields.
    /// - `executionData` encoding (batch): abi.encoded array of `Call` structs.
    /// @param mode The mode of the execution.
    /// @param executionData The data to be executed.
    function propExecution(bytes32 mode, bytes calldata executionData) external;

    /// @notice Cancels a scheduled execution.
    /// @dev Can only be called by an authorized entity. Reverts if cancellation is not allowed.
    /// @param mode The mode of the execution.
    /// @param executionData The data corresponding to the execution to cancel.
    /// @param thresholdType The threshold type required to cancel the execution.
    /// @param timestamp The timestamp associated with the execution.
    /// @param signatures The concatenated signatures for authorization.
    function cancExecution(
        bytes32 mode,
        bytes calldata executionData,
        ThresholdType thresholdType,
        uint256 timestamp,
        bytes calldata signatures
    ) external;


    /// @notice Executes a queued execution.
    /// @dev Executes the pending transaction if verification and timing conditions are met.
    /// @param mode The mode of the execution.
    /// @param executionData The data associated with the execution.
    /// @param thresholdType The threshold type required to execute the action.
    /// @param timestamp The timestamp at which the execution was scheduled.
    /// @param signatures The concatenated signatures for authorization.
    function execExecution(
        bytes32 mode,
        bytes calldata executionData,
        ThresholdType thresholdType,
        uint256 timestamp,
        bytes calldata signatures
    ) external;
```

By comparison, Gnosis Safe has atomic execution, meaning that once the quorum is reached and the meta-transaction is submitted on-chain, it is directly executed. This is problematic since it does not allow any simulation with committed on-chain data; simulations should be made with data that is still in the Gnosis Safe backend. Also, this adds a vendor lock layer that will prevent third parties from building monitoring solutions, since their business logic will rely on the Gnosis Safe backend's trusted data instead of immutable on-chain data.

### 3. Threshold based roles

Instead of a single threshold, Shield lets you configure three different values based on the privilege level each action requires. This lets you secure highly sensitive operations (wallet configuration, code upgrades) with a high threshold while retaining operational flexibility for other actions with a lower threshold.

```solidity
    enum ThresholdType {
        MANAGEMENT,
        EXECUTION,
        REVOCATION
    }
```

### 4. Meta-transaction templates whitelisting

Any external call is blacklisted by default in Shield Wallet; therefore, after deployment, it can only execute management operations. The management team has to identify the scope of the operations that the Shield Wallet will be meant for and whitelist them. Whitelisting meta-transactions allows for granular scoping of the actions that the wallet can execute. Whitelisted targets are specified using the `AllowedTarget` struct.

```solidity
    struct AllowedTarget {
        address target;
        bytes4 selector;
        uint256 maxValue;
    }
```

### 5. Native support of batched transactions

Shield implements at its core a standard EIP-7579 executor interface supporting both single and batched calls. Built-in batched transactions allow executing multiple calls without the need to use delegatecall or rely on external code that implements that functionality.

## Future Work

- Hooks for modularity.
- Monitoring and Response.

## Hackathon Submission Template

### PROJECT NAME

Shield Wallet

### DESCRIPTION OF THE PROJECT

Shield Wallet is a next-generation, meta-transaction, multi-signature wallet with built-in, top-notch security features meant to fill a gap that Gnosis Safe cannot: high-capital management. Shield is simple but robust in its core and includes many features that have been designed by analyzing the current vulnerabilities in Gnosis Safe that led to attacks like the Bybit one.

### DISCORD AND TELEGRAM USER NAME

Discord: gianfrancobazzani  
Telegram: @BazzaniGianfranco

### REPOSITORY WITH PROJECT'S CODE

https://github.com/AGMASO/EthDam-ShieldWallet

### VIDEO DEMO OR PRESENTATION

Slides: https://drive.google.com/file/d/1DfO8rMMnKsVJZTCEkC4Dipr-frhwjV5L/view?usp=sharing

Video: https://www.youtube.com/watch?v=29K-B5NJKMI

### DEPLOYMENTS

Deployment addresses on Sapphire testnet:

- ShieldWalletFactory: [0x408e866d994b9C71404ee4BEB258DE798c65196e](https://explorer.oasis.io/testnet/sapphire/address/0x408e866d994b9C71404ee4BEB258DE798c65196e)
- DefaultCallbackHandler: [0x2Fa2D09Ae811C016Fb717Fb77dC79c893e80E8E2](https://explorer.oasis.io/testnet/sapphire/address/0x2Fa2D09Ae811C016Fb717Fb77dC79c893e80E8E2)
- ShieldWalletImplementation: [0x2eFc8D320432c2eBcBbAA142f975089146B762Cd](https://explorer.oasis.io/testnet/sapphire/address/0x2eFc8D320432c2eBcBbAA142f975089146B762Cd)
