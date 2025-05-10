// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {OnlySelf} from "./OnlySelf.sol";

/// @title Timelock
/// @dev Uses a delay mechanism stored in a dedicated storage slot and provides methods to schedule and query execution states.
abstract contract Timelock is OnlySelf {
    /// @notice Enumeration of possible execution states.
    enum ExecutionState {
        Unset,   // Execution is not scheduled.
        Waiting, // Execution is scheduled but delay has not yet elapsed.
        Ready,   // Delay elapsed; execution is ready.
        Done     // Execution has been completed.
    }

    /// @notice Emitted when the delay for scheduling executions is changed.
    /// @param newDelay The new delay value in seconds.
    event ChangedDelay(uint256 newDelay);

    /// @notice Error thrown when an execution with the same id has already been proposed.
    error ExecutionAlreadyProposed(bytes32 id);


    /// @dev Mapping from execution identifier to its scheduled timestamp.
    mapping(bytes32 id => uint256) private _timestamps;

    /// keccak256("delay_manager.delay.uint256")
    bytes32 internal constant DELAY_STORAGE_SLOT =
        0x8ae618cad2a2faa0603d54fba1a4c04474a4b669e4072855c6ccf687dc536a4c;

    /// @dev Constant used to mark an execution as completed.
    uint256 internal constant _DONE_TIMESTAMP = uint256(1);

    /// @notice Sets the delay used for scheduling executions.
    /// @param _delay The delay in seconds.
    function setDelay(uint256 _delay) public onlySelf {
        _setDelay(_delay);
        emit ChangedDelay(_delay);
    }

    /// @dev Internal function to store the delay value using low-level assembly.
    /// @param _delay The delay in seconds.
    function _setDelay(uint256 _delay) internal {
        assembly {
            sstore(DELAY_STORAGE_SLOT, _delay)
        }
    }

    /// @notice Schedules an execution by assigning a timestamp that is the sum of the current block time and the delay.
    /// @param id The unique identifier for the execution.
    function _schedule(bytes32 id) internal {
        if (isExecution(id)) {
            revert ExecutionAlreadyProposed(id);
        }
        _timestamps[id] = block.timestamp + getDelay();
    }

    // TODO: Add _done(id) internal

    /// @notice Retrieves the scheduled timestamp for a given execution id.
    /// @param id The execution identifier.
    /// @return The timestamp when the execution is scheduled.
    function getTimestamp(bytes32 id) public view virtual returns (uint256) {
        return _timestamps[id];
    }

    /// @notice Determines the current execution state of the given id.
    /// @param id The execution identifier.
    /// @return The execution state as an enum value.
    function getExecutionState(
        bytes32 id
    ) public view virtual returns (ExecutionState) {
        uint256 timestamp = _timestamps[id];
        if (timestamp == 0) {
            return ExecutionState.Unset;
        } else if (timestamp == _DONE_TIMESTAMP) {
            return ExecutionState.Done;
        } else if (timestamp > block.timestamp) {
            return ExecutionState.Waiting;
        } else {
            return ExecutionState.Ready;
        }
    }

    /// @notice Checks whether an execution is scheduled for the specified id.
    /// @param id The execution identifier.
    /// @return True if the execution is scheduled; false otherwise.
    function isExecution(bytes32 id) public view returns (bool) {
        return getExecutionState(id) != ExecutionState.Unset;
    }

    /// @notice Retrieves the delay value used for scheduling executions.
    /// @dev Reads the value from a specific storage slot using low-level assembly.
    /// @return _delay The delay in seconds.
    function getDelay() internal view returns (uint256 _delay) {
        assembly {
            _delay := sload(DELAY_STORAGE_SLOT)
        }
    }

    // TODO: Add Gap for upgradability or EIP 7201 namespace (if we add Gap  there is no need to go low levelish to store the proposer)
}
