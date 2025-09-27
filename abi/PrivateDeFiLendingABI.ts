export const PrivateDeFiLendingABI = {
    abi: [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [],
        "name": "HandlesAlreadySavedForRequestID",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidKMSSignatures",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NoHandleFoundForRequestID",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint64",
            "name": "amountBorrowed",
            "type": "uint64"
          },
          {
            "indexed": false,
            "internalType": "uint64",
            "name": "totalRepay",
            "type": "uint64"
          }
        ],
        "name": "BorrowConfirmed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          }
        ],
        "name": "BorrowRequested",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "requestID",
            "type": "uint256"
          }
        ],
        "name": "DecryptionFulfilled",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "lender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          }
        ],
        "name": "Deposit",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "lender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint64",
            "name": "amount",
            "type": "uint64"
          }
        ],
        "name": "PoolWithdrawn",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "lender",
            "type": "address"
          }
        ],
        "name": "RateSet",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint64",
            "name": "amount",
            "type": "uint64"
          }
        ],
        "name": "Repaid",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "borrower",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          }
        ],
        "name": "RepayRequested",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "lender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          }
        ],
        "name": "WithdrawalRequested",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "actualPool",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "cleartexts",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "decryptionProof",
            "type": "bytes"
          }
        ],
        "name": "callbackBorrow",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "cleartexts",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "decryptionProof",
            "type": "bytes"
          }
        ],
        "name": "callbackCheckAndTransfer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "cleartexts",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "decryptionProof",
            "type": "bytes"
          }
        ],
        "name": "callbackVerifyDeposit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "cleartexts",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "decryptionProof",
            "type": "bytes"
          }
        ],
        "name": "callbackVerifyRepay",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "cleartexts",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "decryptionProof",
            "type": "bytes"
          }
        ],
        "name": "callbackWithdrawPool",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "decryptedTotalRepay",
        "outputs": [
          {
            "internalType": "uint64",
            "name": "",
            "type": "uint64"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "externalEuint64",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "amountProof",
            "type": "bytes"
          }
        ],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "lender",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "externalEuint64",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "inputProof",
            "type": "bytes"
          }
        ],
        "name": "repay",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "externalEuint64",
            "name": "encryptedAmount",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "inputProof",
            "type": "bytes"
          }
        ],
        "name": "requestBorrow",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "externalEuint64",
            "name": "encryptedRate",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "rateProof",
            "type": "bytes"
          }
        ],
        "name": "setRate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "withdrawPool",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
  };