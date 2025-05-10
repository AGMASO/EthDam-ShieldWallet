// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @dev Interface of the ShieldWallet contract.
 */
interface IShieldWallet {
    
    /**
     * @dev Enum representing the different threshold types used in the ShieldWallet.
     * @notice The threshold types specify the minimum number of approvals required for:
     *         - MANAGEMENT: Performing management actions.
     *         - EXECUTION: Executing transactions.
     *         - REVOCATION: Revoking operations.
     */
    enum ThresholdType {
        MANAGEMENT,
        EXECUTION,
        REVOCATION
    }
    // TODO: Add events

    // TODO: Add view functions

    /// @notice Initializes the ShieldWallet contract.
    /// @dev This function is called only once when the contract is deployed.
    /// @param owners The list of owners of the wallet.
    /// @param managementThreshold The threshold for management actions.
    /// @param executionThreshold The threshold for execution actions.
    /// @param revocationThreshold The threshold for revocation actions.
    /// @param fallbackHandler The address of the fallback handler.
    /// @param proposer The address of the proposer.
    /// @param delay The delay for the timelock.
    /// @param allowedTargets Array of allowed target entries.
    function initialize(
        address[] calldata owners,
        uint256 managementThreshold,
        uint256 executionThreshold,
        uint256 revocationThreshold,
        address fallbackHandler,
        address proposer,
        uint256 delay,
        AllowedTarget[] memory allowedTargets
    ) external;

    /// @notice Upgrades the contract to a new implementation.
    /// @dev This function can only be called by the contract itself.
    /// @param newImplementation The address of the new implementation.
    /// @param data The data to be sent to the new implementation.
    function upgradeToAndCall(
        address newImplementation,
        bytes calldata data
    ) external;

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

    /// @notice Checks the validity of the provided signatures for an execution.
    /// @dev Verifies that the signatures correspond to the execution id and meet the required threshold criteria.
    /// @param executionId The identifier of the execution.
    /// @param signatures The concatenated signatures to verify.
    /// @param thresholdType The threshold type against which to validate the signatures.
    function checkSignatures(
        bytes32 executionId,
        bytes calldata signatures,
        ThresholdType thresholdType
    ) external;

    /// @dev Struct that defines an allowed target, used to specify whitelist entries.
    struct AllowedTarget {
        address target;
        bytes4 selector;
        uint256 maxValue;
    }

    /// @notice Adds a new allowed target entry to the whitelist and emits an AllowedTargetAdded event.
    /// @param newAllowedTarget The allowed target details including target address, function selector, and maximum allowed value.
    function addEntryToWhitelist(
        AllowedTarget calldata newAllowedTarget
    ) external;

    /// @notice Deletes an allowed target entry from the whitelist.
    /// @param newAllowedTarget The allowed target details to be removed.
    function deleteEntryFromWhitelist(
        AllowedTarget calldata newAllowedTarget
    ) external;

    /// @notice Adds a new owner to the wallet and specifies a new threshold set.
    /// @dev This function can only be called by the contract itself.
    /// @param owner The address of the new owner.
    /// @param managementThreshold The threshold for management actions.
    /// @param executionThreshold The threshold for execution actions.
    /// @param revocationThreshold The threshold for revocation actions.
    function addOwnerWithThreshold(
        address owner,
        uint256 managementThreshold,
        uint256 executionThreshold,
        uint256 revocationThreshold
    ) external;

    /// @notice Removes an owner and specifies a new threshold set.
    /// @dev This function can only be called by the contract itself.
    /// @param prevOwner The address of the previous owner.
    /// @param owner The address of the owner to be removed.
    /// @param managementThreshold The threshold for management actions.
    /// @param executionThreshold The threshold for execution actions.
    /// @param revocationThreshold The threshold for revocation actions.
    function removeOwnerWithThreshold(
        address prevOwner,
        address owner,
        uint256 managementThreshold,
        uint256 executionThreshold,
        uint256 revocationThreshold
    ) external;

    /// @notice Swaps the owner of the wallet.
    /// @dev This function can only be called by the contract itself.
    /// @param prevOwner The address of the previous owner.
    /// @param oldOwner The address of the old owner.
    /// @param newOwner The address of the new owner.
    function swapOwner(
        address prevOwner,
        address oldOwner,
        address newOwner
    ) external;

    /// @notice Changes the thresholds for management, execution, and revocation.
    /// @dev This function can only be called by the contract itself.
    /// @param managementThreshold The new threshold for management actions.
    /// @param executionThreshold The new threshold for execution actions.
    /// @param revocationThreshold The new threshold for revocation actions.
    function changeThresholds(
        uint256 managementThreshold,
        uint256 executionThreshold,
        uint256 revocationThreshold
    ) external;

    /// @notice Sets the fallback handler for the wallet.
    /// @dev This function can only be called by the contract itself.
    /// @param fallbackHandler The address of the fallback handler.
    function setFallbackHandler(address fallbackHandler) external;

    /// @notice Sets the proposer for the wallet.
    /// @dev This function can only be called by the contract itself.
    /// @param proposer The address of the proposer.
    function setProposer(address proposer) external;

    /// @notice Sets the delay for the timelock.
    /// @dev This function can only be called by the contract itself.
    /// @param delay The new delay for the timelock.
    function setDelay(uint256 delay) external;

    /// @notice Sets the whitelist entries for the wallet.
    /// @dev This function can only be called by the contract itself.
    /// @param targets The list of allowed targets.
    function setWhitelistEntries(AllowedTarget[] calldata targets) external;

    /// @notice Removes the whitelist entries from the wallet.
    /// @dev This function can only be called by the contract itself.
    /// @param targets The list of allowed targets to remove.
    function removeWhitelistEntries(AllowedTarget[] calldata targets) external;
}
