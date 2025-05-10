// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnersManager} from "./OwnersManager.sol";
import {ProposerManager} from "./ProposerManager.sol";
import {CheckedExecutor} from "./CheckedExecutor.sol";
import {Timelock} from "./Timelock.sol";
import {FallbackManager} from "./FallbackManager.sol";

contract ShieldWallet is
    Initializable,
    UUPSUpgradeable,
    OwnersManager,
    ProposerManager,
    CheckedExecutor,
    Timelock,
    FallbackManager
{
    constructor() {
        _disableInitializers();
        managementThreshold = 1;
        executionThreshold = 1;
        revocationThreshold = 1;
    }

    /*//////////////////////////////////////////////////////////////
                               UUPS PROXY
    //////////////////////////////////////////////////////////////*/

    function initialize(
        address[] calldata _owners,
        uint256 _managementThreshold,
        uint256 _executionThreshold,
        uint256 _revocationThreshold,
        address _fallbackHandler,
        address _proposer,
        uint256 _delay,
        AllowedTarget[] calldata _allowedTargets
    ) public initializer {
        __UUPSUpgradeable_init();

        _setupOwnersAndThresholds(
            _owners,
            _managementThreshold,
            _executionThreshold,
            _revocationThreshold
        );

        if (_fallbackHandler != address(0))
            _setFallbackHandler(_fallbackHandler);

        if (_proposer != address(0)) _setProposer(_proposer);

        for (uint256 i = 0; i < _allowedTargets.length; i++) {
            _addEntryToWhitelist(_allowedTargets[i]);
        }
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlySelf {}

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    event ExecutionProposed(
        bytes32 indexed id,
        bytes32 mode,
        bytes executionData,
        ThresholdType indexed threshold,
        uint256 timestamp
    );

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error UnauthorizedProposer();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier onlyProposerOrOwner() {
        require(
            owners[msg.sender] != address(0) || msg.sender == getProposer(),
            UnauthorizedProposer()
        );
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            EXECUTION LOGIC
    //////////////////////////////////////////////////////////////*/

    // Struct that is EIP-712 signed by the owners EOA
    struct ExecutionId {
        bytes32 executionId;
    }

    /// @dev Adds an execution to the queue.
    /// See: https://eips.ethereum.org/EIPS/eip-7579
    /// ShieldWallet EIP-7579 `executionData` encodings:
    /// - `executionData` encoding (single call): abi.encodePacked of `Call` fields.
    /// - `executionData` encoding (batch): abi.encoded array of `Call` structs
    function propExecution(
        bytes32 mode,
        bytes calldata executionData
    ) external onlyProposerOrOwner {
        (bytes32 executionId, ThresholdType threshold) = _validateExecution(
            mode,
            executionData
        );

        _schedule(executionId);

        emit ExecutionProposed(
            executionId,
            mode,
            executionData,
            threshold,
            block.timestamp
        );
    }

    /// @dev Removes an execution from the queue.
    function revoExecution() external {
        // TODO: Adjust arguments
        //TODO: Check revoker threshold
    }

    /// @dev Executes an execution from the queue.
    function execExecution(bytes calldata signatures) external {
        // TODO: Adjust arguments
        // TODO: Check executor threshold
    }
}
