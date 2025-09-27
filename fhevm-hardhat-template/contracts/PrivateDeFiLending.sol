// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Optimized Confidential DeFi Lending using fhEVM
/// @notice This contract implements a private lending pool with encrypted borrow amounts and interest calculations.
/// The lender deposits a public amount (via msg.value) and provides an encrypted equivalent for FHE operations.
/// Separately, the lender can set an encrypted interest rate. Borrowers submit encrypted borrow requests
/// of both borrow amount and total repay, followed by pool check and fund transfer in a single callback.
/// Lender can withdraw the pool by requesting decryption. 
/// Repayments also require an encrypted amount for FHE consistency.
contract PrivateDeFiLending is SepoliaConfig {
    address public lender;
    uint256 public actualPool; // Actual balance from msg.value
    euint64 public pool; // Encrypted pool amount for FHE operations
    euint64 public rate; // Encrypted interest rate in % (e.g., 5 for 5%)

    mapping(address => euint64) private borrowAmounts;
    mapping(address => euint64) private totalRepays;
    mapping(address => uint64) public decryptedTotalRepay;
    mapping(address => bool) private agreed;
    mapping(address => uint64) private loans; // Decrypted total repay for active loans

    mapping(uint256 => address) private requestToBorrower; // For decryption requests
    uint256 private decryptionRequestIdPool; // For pool decryption in withdraw
    uint256 private decryptionRequestIdDeposit; // For deposit verification
    uint256 private decryptionRequestIdRepay; // For repay verification
    mapping(uint256 => uint256) private expectedDepositAmounts; // For verifying deposit amounts

    // Events
    event Deposit(address indexed lender, uint256 requestId);
    event RateSet(address indexed lender);
    event BorrowRequested(address indexed borrower, uint256 requestId);
    event BorrowConfirmed(address indexed borrower, uint64 amountBorrowed, uint64 totalRepay);
    event RepayRequested(address indexed borrower, uint256 requestId);
    event Repaid(address indexed borrower, uint64 amount);
    event WithdrawalRequested(address indexed lender, uint256 requestId);
    event PoolWithdrawn(address indexed lender, uint64 amount);

    modifier onlyLender() {
        require(msg.sender == lender, "Only lender can call this");
        _;
    }

    constructor() {
        lender = msg.sender;
        pool = FHE.asEuint64(0);
        rate = FHE.asEuint64(0);
        actualPool = 0;
        FHE.allowThis(pool);
        FHE.allowThis(rate);
    }

    // Lender: Deposit funds (public msg.value + encrypted equivalent)
    function deposit(
        externalEuint64 encryptedAmount,
        bytes calldata amountProof
    ) external payable onlyLender {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        actualPool += msg.value;
        pool = FHE.add(pool, FHE.fromExternal(encryptedAmount, amountProof));

        FHE.allowThis(pool);

        // Request decryption to verify encryptedAmount matches msg.value
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(FHE.fromExternal(encryptedAmount, amountProof));
        uint256 requestId = FHE.requestDecryption(cts, this.callbackVerifyDeposit.selector);
        expectedDepositAmounts[requestId] = msg.value;
        decryptionRequestIdDeposit = requestId;

        emit Deposit(lender, requestId);
    }

    // Callback to verify encrypted amount matches msg.value in deposit
    function callbackVerifyDeposit(uint256 requestId, bytes memory cleartexts, bytes memory decryptionProof) external {
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        uint64 decryptedAmount = abi.decode(cleartexts, (uint64));
        require(uint256(decryptedAmount) == expectedDepositAmounts[requestId],
                         "Encrypted amount does not match deposit");
        delete expectedDepositAmounts[requestId];
    }

    // Lender: Set encrypted interest rate
    function setRate(
        externalEuint64 encryptedRate,
        bytes calldata rateProof
    ) external onlyLender {
        rate = FHE.fromExternal(encryptedRate, rateProof);
        FHE.allowThis(rate);
        emit RateSet(lender);
    }

    // Borrower: Request to borrow an encrypted amount and trigger decryption
    function requestBorrow(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        require(FHE.isInitialized(pool), "No funds in pool");
        require(!agreed[msg.sender], "Active loan exists");

        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 interest = FHE.div(FHE.mul(amount, rate), 100);
        euint64 total = FHE.add(amount, interest);

        borrowAmounts[msg.sender] = amount;
        totalRepays[msg.sender] = total;

        FHE.allowThis(borrowAmounts[msg.sender]);
        FHE.allowThis(totalRepays[msg.sender]);

        // Request decryption of both amount and total repay
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(amount);
        cts[1] = FHE.toBytes32(total);
        uint256 requestId = FHE.requestDecryption(cts, this.callbackBorrow.selector);
        requestToBorrower[requestId] = msg.sender;

        emit BorrowRequested(msg.sender, requestId);
    }

    // Callback for borrow: decrypt amount and total, check pool, and transfer
    function callbackBorrow(uint256 requestId, bytes memory cleartexts, bytes memory decryptionProof) external {
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        address borrower = requestToBorrower[requestId];
        require(borrower != address(0), "Invalid request ID");

        // Decode both amount and total repay
        (uint64 amount, uint64 totalRepay) = abi.decode(cleartexts, (uint64, uint64));

        // Request decryption of pool to check sufficiency
        bytes32[] memory ctsPool = new bytes32[](1);
        ctsPool[0] = FHE.toBytes32(pool);
        uint256 poolRequestId = FHE.requestDecryption(ctsPool, this.callbackCheckAndTransfer.selector);

        // Store amount and total temporarily
        loans[borrower] = amount; // Temp store amount
        decryptedTotalRepay[borrower] = totalRepay;
        requestToBorrower[poolRequestId] = borrower;
    }

    // Callback for checking pool and completing transfer
    function callbackCheckAndTransfer(uint256 requestId, bytes memory cleartexts,
                                            bytes memory decryptionProof) external {
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        address borrower = requestToBorrower[requestId];
        require(borrower != address(0), "Invalid request ID");

        uint64 poolAmount = abi.decode(cleartexts, (uint64));
        uint64 amount = loans[borrower]; // Retrieve temp stored amount
        require(amount <= poolAmount, "Insufficient funds in pool");
        require(amount <= actualPool, "Insufficient actual funds");

        // Update pools
        pool = FHE.sub(pool, FHE.asEuint64(amount));
        actualPool -= amount;
        FHE.allowThis(pool);

        // Complete loan setup
        loans[borrower] = decryptedTotalRepay[borrower]; // Store total repay
        agreed[borrower] = true;
        payable(borrower).transfer(amount);

        // Reset encrypted variables
        borrowAmounts[borrower] = FHE.asEuint64(0);
        totalRepays[borrower] = FHE.asEuint64(0);
        FHE.allowThis(borrowAmounts[borrower]);
        FHE.allowThis(totalRepays[borrower]);
        decryptedTotalRepay[borrower] = 0;
        delete requestToBorrower[requestId];

        emit BorrowConfirmed(borrower, amount, loans[borrower]);
    }

    // Borrower: Repay the loan with encrypted amount
    function repay(externalEuint64 encryptedRepayAmount, bytes calldata inputProof) external payable {
        require(agreed[msg.sender], "No active loan");
        require(msg.value > 0, "Repay amount must be greater than 0");
        uint64 total = loans[msg.sender];
        require(msg.value == total, "Incorrect repay amount");

        // Request decryption to verify encryptedRepayAmount matches msg.value
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(FHE.fromExternal(encryptedRepayAmount, inputProof));
        decryptionRequestIdRepay = FHE.requestDecryption(cts, this.callbackVerifyRepay.selector);

        requestToBorrower[decryptionRequestIdRepay] = msg.sender;
        
        // Store encrypted amount temporarily
        borrowAmounts[msg.sender] = FHE.fromExternal(encryptedRepayAmount, inputProof);
        FHE.allowThis(borrowAmounts[msg.sender]);

        emit RepayRequested(msg.sender, decryptionRequestIdRepay);
    }

    // Callback to verify and complete repayment
    function callbackVerifyRepay(uint256 requestId, bytes memory cleartexts, bytes memory decryptionProof) external {
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        require(requestId == decryptionRequestIdRepay, "Invalid request ID");
        address borrower = requestToBorrower[requestId];
        require(borrower != address(0), "Invalid borrower");
        uint64 decryptedAmount = abi.decode(cleartexts, (uint64));
        uint64 total = loans[borrower];
        require(decryptedAmount == total, "Encrypted repay amount does not match");

        // Update pools
        pool = FHE.add(pool, borrowAmounts[borrower]);
        actualPool += total;
        FHE.allowThis(pool);

        // Reset loan data
        delete loans[borrower];
        delete agreed[borrower];
        borrowAmounts[borrower] = FHE.asEuint64(0);
        FHE.allowThis(borrowAmounts[borrower]);
        decryptionRequestIdRepay = 0;
        delete requestToBorrower[requestId];

        emit Repaid(borrower, total);
    }

    // Lender: Request withdrawal of the pool (requires decryption)
    function withdrawPool() external onlyLender {
        require(decryptionRequestIdPool == 0, "Withdrawal already requested");
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(pool);
        decryptionRequestIdPool = FHE.requestDecryption(cts, this.callbackWithdrawPool.selector);
        emit WithdrawalRequested(lender, decryptionRequestIdPool);
    }

    // Callback for withdrawing pool
    function callbackWithdrawPool(uint256 requestId, bytes memory cleartexts, bytes memory decryptionProof) external {
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);
        require(requestId == decryptionRequestIdPool, "Invalid request ID");
        uint64 amount = abi.decode(cleartexts, (uint64));
        require(amount <= actualPool, "Insufficient actual funds");
        pool = FHE.asEuint64(0);
        actualPool = 0;
        FHE.allowThis(pool);
        decryptionRequestIdPool = 0;
        payable(lender).transfer(amount);
        emit PoolWithdrawn(lender, amount);
    }
}