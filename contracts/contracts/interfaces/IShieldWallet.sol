// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @dev Interface of the ShieldWallet contract.
 */
interface IShieldWallet {
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
    function initialize(
        address[] calldata owners,
        uint256 managementThreshold,
        uint256 executionThreshold,
        uint256 revocationThreshold,
        address fallbackHandler,
        address proposer,
        uint256 delay
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

    // TODO: Fix once function is defined
    function revoExecution() external;

    // TODO: Fix once function is defined
    function execExecution() external;

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

    /// @notice Removes an owner and specify a new threshold set.
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
    function setFallbackHandler(
        address fallbackHandler
    ) external;

    /// @notice Sets the proposer for the wallet.
    /// @dev This function can only be called by the contract itself.
    /// @param proposer The address of the proposer.
    function setProposer(address proposer) external;
    
    /// @notice Sets delay.
    /// @dev This function can only be called by the contract itself.
    /// @param delay The new delay for the timelock.
    function setDelay(uint256 delay) external;

    struct AllowedTarget {
        address target;
        bytes4 selector;
        uint256 maxValue;
    }

    /// @notice Sets the whitelist entry for the wallet.
    /// @dev This function can only be called by the contract itself.
    /// @param targets The list of allowed targets. 
    function setWhitelistEntries(AllowedTarget[] calldata targets) external;

    /// @notice Removes the whitelist entry for the wallet.
    /// @dev This function can only be called by the contract itself.
    /// @param targets The list of allowed targets.
    function removeWhitelistEntries(AllowedTarget[] calldata targets) external;

}
