// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {OwnersManager} from "./OwnersManager.sol";
import {OnlySelf} from "./OnlySelf.sol";

/// @notice Executor following EIP-7579 Interface.
abstract contract CheckedExecutor is OnlySelf {
    ///  @notice Emitted when a new allowed target is added to the whitelist
    event AllowedTargetAdded(
        address indexed target,
        bytes4 indexed selector,
        uint256 maxValue
    );
    ///  @notice Emitted when a new allowed target is deleted from the whitelist
    event AllowedTargetDeleted(
        address indexed target,
        bytes4 indexed selector,
        uint256 maxValue
    );

    /// @dev Revert when an invalid execution mode is provided.
    error InvalidExecutionMode();
    /// @dev Revert when the call is not allowed.
    error CallNotAllowed();

    /// @dev Struct that defines a whitelist entry.
    struct WhitelistEntry {
        bool allowed;
        uint256 maxValue;
    }
    /// @dev Allowed Calls Whitelist.
    mapping(address to => mapping(bytes4 selector => WhitelistEntry))
        public whitelist;

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
    ) external onlySelf {
        _addEntryToWhitelist(newAllowedTarget);
        emit AllowedTargetAdded(
            newAllowedTarget.target,
            newAllowedTarget.selector,
            newAllowedTarget.maxValue
        );
    }

    /// @notice Internal function that adds an allowed target entry to the whitelist.
    /// @param newAllowedTarget The allowed target details to be added.
    function _addEntryToWhitelist(
        AllowedTarget calldata newAllowedTarget
    ) internal {
        address target = newAllowedTarget.target == address(0)
            ? address(this)
            : newAllowedTarget.target;
        whitelist[target][newAllowedTarget.selector] = WhitelistEntry({
            allowed: true,
            maxValue: newAllowedTarget.maxValue
        });
    }

    /// @notice Deletes an allowed target entry from the whitelist and emits an AllowedTargetDeleted event.
    /// @param allowedTarget The allowed target entry details to be deleted.
    function deleteEntryFromWhitelist(
        AllowedTarget calldata allowedTarget
    ) external onlySelf {
        delete whitelist[allowedTarget.target][allowedTarget.selector];
        emit AllowedTargetDeleted(
            allowedTarget.target,
            allowedTarget.selector,
            allowedTarget.maxValue
        );
    }

    /// @notice Validates the execution data and determines the execution ID and required threshold.
    /// @dev For single calls the target, value and callData are packed via abi.encodePacked;
    ///      for batch calls, an array of Call structs is decoded.
    /// @param mode The execution mode encoded as a bytes32 value.
    /// @param executionData The calldata containing the execution instructions.
    /// @return executionId The computed execution ID.
    /// @return threshold The required threshold from OwnersManager.
    function _validateExecution(
        bytes32 mode,
        bytes calldata executionData
    )
        internal
        view
        returns (bytes32 executionId, OwnersManager.ThresholdType threshold)
    {
        bytes10 m = _getExecutionMode(mode);
        threshold = OwnersManager.ThresholdType.EXECUTION;
        if (m == EXECUTIONTYPE_CALL) {
            Call memory call;
            // EIP-7579: For single calls, the target, value and callData are packed in this order (ie abi.encodePacked in Solidity).
            call.to = address(uint160(bytes20(executionData[0:20])));
            call.value = uint256(bytes32(executionData[20:52]));
            call.data = executionData[52:];
            _checkCall(call);
            if (call.to == address(this))
                threshold = OwnersManager.ThresholdType.MANAGEMENT;
        } else if (m == EXECUTIONTYPE_BATCH) {
            // EIP-7579: For batch calls, the targets, values and callDatas are put into an array of Execution structs that includes these fields in this order (ie Execution(address target, uint256 value, bytes memory callData))
            Call[] memory calls = abi.decode(executionData, (Call[]));
            uint256 callsLength = calls.length;
            for (uint256 i = 0; i < callsLength; ++i) {
                _checkCall(calls[i]);
                if (calls[i].to == address(this))
                    threshold = OwnersManager.ThresholdType.MANAGEMENT;
            }
        } else {
            revert InvalidExecutionMode();
        }
        executionId = getExecutionId(
            mode,
            executionData,
            threshold,
            block.timestamp
        );
    }

    /// @notice Checks whether a call is allowed per the whitelist.
    /// @dev Reverts if the call is not allowed or its value exceeds the maximum.
    /// @param call The call details to be validated.
    function _checkCall(Call memory call) internal view {
        bytes4 selector = bytes4(call.data);
        WhitelistEntry memory entry = whitelist[call.to][selector];
        require(entry.allowed, CallNotAllowed());
        require(call.value <= entry.maxValue, CallNotAllowed());
    }

    /// @notice Executes the provided execution data in the specified mode.
    /// @dev TODO: Implement the execution logic.
    /// @param mode The execution mode.
    /// @param executionData The data encoding the execution instructions.
    function _execute(bytes32 mode, bytes memory executionData) internal {
        bytes10 m = _getExecutionMode(mode);
        if (m == EXECUTIONTYPE_CALL) {
            Call memory call;
            _executeCall(call);
        } else if (m == EXECUTIONTYPE_BATCH) {
            Call[] memory calls = abi.decode(executionData, (Call[]));
            uint256 callsLength = calls.length;
            for (uint256 i = 0; i < callsLength; ++i) {
                _executeCall(calls[i]);
            }
        } else {
            revert InvalidExecutionMode();
        }
    }

    /// @notice Executes a single call using a low-level call.
    /// @dev Bubbles up the revert reason if the call fails.
    /// @param call The call object to be executed.
    function _executeCall(Call memory call) internal {
        (bool success, bytes memory result) = call.to.call{value: call.value}(
            call.data
        );
        if (success) return;
        assembly {
            // Bubble up the revert if the call reverts.
            revert(add(result, 0x20), mload(result))
        }
    }

    /// @notice Returns a unique execution ID based on inputs.
    /// @dev The execution ID is keccak256(abi.encode(mode, executionData, threshold, timestamp)).
    /// @param mode The execution mode.
    /// @param executionData The execution data.
    /// @param threshold The threshold required from OwnersManager.
    /// @param timestamp The block timestamp.
    /// @return id The computed execution ID.
    function getExecutionId(
        bytes32 mode,
        bytes calldata executionData,
        OwnersManager.ThresholdType threshold,
        uint256 timestamp
    ) public pure returns (bytes32 id) {
        id = keccak256(abi.encode(mode, executionData, threshold, timestamp));
    }

    /// @notice Checks if the provided execution mode is supported.
    /// @param mode The execution mode.
    /// @return result True if supported, false otherwise.
    function supportsExecutionMode(
        bytes32 mode
    ) public pure returns (bool result) {
        bytes10 m = _getExecutionMode(mode);
        return m == EXECUTIONTYPE_CALL || m == EXECUTIONTYPE_BATCH;
    }

    /// @notice Extracts the execution mode from a bytes32 value.
    /// @dev Shifts and masks the input to extract a 10-byte execution mode.
    /// @param mode The complete mode data.
    /// @return m The extracted execution mode.
    function _getExecutionMode(bytes32 mode) internal pure returns (bytes10 m) {
        m = bytes10(
            uint80((uint256(mode) >> (22 * 8)) & 0xffff00000000ffffffff)
        );
    }
}
