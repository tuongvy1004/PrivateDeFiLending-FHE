# Private DeFi Lending with FHEVM - README
This project implements an Optimized Confidential DeFi Lending platform using the Fully Homomorphic Encryption Virtual Machine (FHEVM). It enables private lending where borrow amounts and interest rates are encrypted, ensuring confidentiality. The lender manages the pool, sets rates, and borrowers can request loans with encrypted details.
Table of Contents

# Overview
Features
Prerequisites
Setup Instructions
Usage
Smart Contract Details
Frontend Details
Troubleshooting
Contributing
License

# Overview
The PrivateDeFiLending smart contract is deployed on a blockchain network supporting FHEVM (e.g., Zama's Sepolia testnet). It facilitates a private lending pool where:

The lender deposits public funds and provides an encrypted equivalent for FHE operations.
Interest rates are set encrypted.
Borrowers submit encrypted borrow requests, with checks and transfers handled via callbacks.
Repayments are verified with encryption for consistency.
The lender can withdraw the pool after decryption.

The frontend, built with React and TypeScript, integrates with MetaMask and ethers.js to interact with the smart contract.
# Features

Encrypted Operations: Borrow amounts, interest rates, and repayments are encrypted using FHE for privacy.
Lender Controls: Deposit funds, set interest rates, and withdraw the pool.
Borrower Actions: Request borrows with encrypted amounts, repay loans.
Decryption Callbacks: Secure verification and processing via decryption requests.
Event-Driven Updates: Real-time notifications via contract events (e.g., Deposit, BorrowConfirmed).
Responsive UI: A user-friendly React interface for lending interactions.

# Prerequisites

Node.js: Version 18 or higher.
MetaMask: Installed in your browser and connected to a supported network (e.g., Zama Sepolia).
Yarn or npm: For managing dependencies.
FHEVM Environment: Access to an FHEVM-compatible blockchain (e.g., Zama's Sepolia testnet).
ETH for Gas Fees: Testnet ETH for transactions on the target network.

# Setup Instructions

Clone the Repository:
git clone <repository-url>
cd private-defi-lending


Install Dependencies:
yarn install

or
npm install


Configure Environment:

Ensure MetaMask is connected to the correct network (e.g., Zama Sepolia).
Update the PrivateDeFiLendingAddresses.ts file with the deployed contract address for your target chain ID.


Run the Application:
yarn start

or
npm start

The app will be available at http://localhost:3000.

Deploy the Smart Contract (if not already deployed):

Use tools like Hardhat or Remix to deploy PrivateDeFiLending.sol to an FHEVM-compatible network.
Update PrivateDeFiLendingAddresses.ts with the deployed contract address.



# Usage

Connect MetaMask:

Click "Connect to MetaMask" to link your wallet.
Ensure you're on the correct network (e.g., Zama Sepolia).


Lender Actions (Contract Deployer is the Lender):

Deposit: Enter a deposit amount (in wei) and click "Deposit".
Set Rate: Enter an interest rate (%) and click "Set Rate".
Withdraw Pool: Click "Withdraw Pool" to retrieve funds after decryption.


Borrower Actions:

Request Borrow: Enter a borrow amount (in wei) and click "Request Borrow".
Repay: Enter the repay amount (in wei) and click "Repay".


View Lending State:

The UI displays the lender address, actual pool balance, user borrow amount, user total repay, and active loan status.
Use the "Refresh State" button to update the state manually.



# Smart Contract Details
The PrivateDeFiLending.sol contract includes:

Modifiers:
onlyLender: Restricts actions to the lender.


Key Functions:
deposit: Lender deposits funds with encrypted equivalent.
setRate: Sets the encrypted interest rate.
requestBorrow: Borrower requests an encrypted borrow amount.
repay: Borrower repays the loan with encrypted amount.
withdrawPool: Lender requests withdrawal of the pool.
Callbacks like callbackVerifyDeposit, callbackBorrow, callbackCheckAndTransfer, callbackVerifyRepay, callbackWithdrawPool for decryption and verification.


Events:
Deposit: Emitted on deposit.
RateSet: Emitted when rate is set.
BorrowRequested: Emitted on borrow request.
BorrowConfirmed: Emitted when borrow is confirmed.
RepayRequested: Emitted on repay request.
Repaid: Emitted on successful repayment.
WithdrawalRequested: Emitted on withdrawal request.
PoolWithdrawn: Emitted when pool is withdrawn.



# Frontend Details
The frontend is built with React, TypeScript, and ethers.js, using the following key files:

usePrivateDeFiLending.tsx: A custom React hook for interacting with the PrivateDeFiLending contract.
PrivateDeFiLendingDemo.tsx: The main component rendering the lending UI.
Dependencies:
ethers: For Ethereum interactions.
fhevm: For FHE encryption/decryption.
useMetaMaskEthersSigner: Custom hook for MetaMask integration.
useInMemoryStorage: Manages FHEVM decryption signatures.



## The UI includes:

Chain Info: Displays chain ID, MetaMask accounts, contract address, and lender status.
Lending State: Shows lender, actual pool, user borrow amount, user total repay, and active loan status.
Action Buttons: For depositing, setting rates, requesting borrows, repaying, and withdrawing the pool.

# Troubleshooting

MetaMask Connection Issues:
Ensure MetaMask is installed and unlocked.
Verify the correct network is selected in MetaMask.


Contract Not Deployed:
Check PrivateDeFiLendingAddresses.ts for the correct contract address.
Deploy the contract if it hasn't been deployed yet.


FHEVM Errors:
Ensure the fhevm library is properly initialized.
Verify the network supports FHEVM (e.g., Zama Sepolia).


Transaction Failures:
Check for sufficient gas and ETH in your wallet.
Review console logs for error messages from usePrivateDeFiLending.


State Not Updating:
Use "Refresh State" after transactions.
Borrow confirmations may take time due to decryption callbacks.



# Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit your changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.

Please ensure your code follows the existing style and includes tests where applicable.
# License
This project is licensed under the MIT License. See the LICENSE file for details.