// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
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
    FallbackManager,
    EIP712Upgradeable
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
        __EIP712_init_unchained("ShieldWallet", "1");

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

        _setDelay(_delay);
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

    event ExecutionCanceled(
        bytes32 indexed id,
        bytes32 mode,
        bytes executionData,
        ThresholdType indexed threshold,
        uint256 timestamp
    );

    event ExecutionExecuted(
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
    error SignaturesNotValid();
    error InvalidSignature(address owner);

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

    /// @dev Adds an execution to the queue.
    /// See: https://eips.ethereum.org/EIPS/eip-7579
    /// ShieldWallet EIP-7579 `executionData` encodings:
    /// - `executionData` encoding (single call): abi.encodePacked of `Call` fields.
    /// - `executionData` encoding (batch): abi.encoded array of `Call` structs
    function propExecution(
        bytes32 mode,
        bytes calldata executionData
    ) external onlyProposerOrOwner {
        (bytes32 executionId, ThresholdType thresholdType) = _validateExecution(
            mode,
            executionData
        );

        _schedule(executionId);

        emit ExecutionProposed(
            executionId,
            mode,
            executionData,
            thresholdType,
            block.timestamp
        );
    }

    /// @dev Removes an execution from the queue.
    function cancExecution(
        bytes32 mode,
        bytes calldata executionData,
        ThresholdType thresholdType,
        uint256 timestamp,
        bytes calldata signatures
    ) external {
        bytes32 executionId = getExecutionId(
            mode,
            executionData,
            thresholdType,
            timestamp
        );

        checkSignatures(executionId, signatures, ThresholdType.REVOCATION);

        _cancel(executionId);

        emit ExecutionCanceled(
            executionId,
            mode,
            executionData,
            thresholdType,
            block.timestamp
        );
    }

    /// @dev Executes an execution from the queue.
    function execExecution(
        bytes32 mode,
        bytes calldata executionData,
        ThresholdType thresholdType,
        uint256 timestamp,
        bytes calldata signatures
    ) external {
        bytes32 executionId = getExecutionId(
            mode,
            executionData,
            thresholdType,
            timestamp
        );

        checkSignatures(executionId, signatures, thresholdType);

        _finalize(executionId);

        _execute(mode, executionData);

        emit ExecutionExecuted(
            executionId,
            mode,
            executionData,
            thresholdType,
            timestamp
        );
    }

    function checkSignatures(
        bytes32 executionId,
        bytes calldata signatures,
        ThresholdType thresholdType
    ) public view {
        bytes32 executionIdHash = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("ExecutionId(bytes32 execution)"),
                    executionId
                )
            )
        );

        uint256 threshold = thresholdTypeToThreshold(thresholdType);

        // TODO: Add EIP-1271 Signatures
        require(signatures.length == threshold * 65, SignaturesNotValid());

        address lastOwner = address(0);
        address currentOwner;
        uint256 v;
        bytes32 r;
        bytes32 s;
        uint256 i;

        for (i = 0; i < threshold; ++i) {
            (v, r, s) = signatureSplit(signatures, i);
            currentOwner = ecrecover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        executionIdHash
                    )
                ),
                uint8(v - 4),
                r,
                s
            );
            require(
                currentOwner >= lastOwner &&
                    owners[currentOwner] != address(0) &&
                    currentOwner == HEAD,
                InvalidSignature(currentOwner)
            );
            lastOwner = currentOwner;
        }
    }

    function signatureSplit(
        bytes memory signatures,
        uint256 pos
    ) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        assembly {
            let signaturePos := mul(0x41, pos)
            r := mload(add(signatures, add(signaturePos, 0x20)))
            s := mload(add(signatures, add(signaturePos, 0x40)))
            v := byte(0, mload(add(signatures, add(signaturePos, 0x60))))
        }
    }
}
