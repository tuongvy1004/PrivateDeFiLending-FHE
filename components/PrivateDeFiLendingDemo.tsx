"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { usePrivateDeFiLending } from "@/hooks/usePrivateDeFiLending";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { useState } from "react";
import { ethers } from "ethers";

export const PrivateDeFiLendingDemo = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const {
    contractAddress,
    canGetState,
    canDeposit,
    canSetRate,
    canRequestBorrow,
    canRepay,
    canWithdrawPool,
    deposit,
    setRate,
    requestBorrow,
    repay,
    withdrawPool,
    refreshState,
    message,
    lender,
    actualPool,
    isLender,
    userBorrowAmount,
    userTotalRepay,
    hasActiveLoan,
    isRefreshing,
    isDepositing,
    isSettingRate,
    isRequestingBorrow,
    isRepaying,
    isWithdrawing,
    isDeployed,
  } = usePrivateDeFiLending({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [depositAmount, setDepositAmount] = useState<number>(1000000000000000); // 0.001 ETH in wei
  const [rateValue, setRateValue] = useState<number>(5); // Default 5%
  const [borrowAmount, setBorrowAmount] = useState<number>(500000000000000); // 0.0005 ETH in wei
  const [repayAmount, setRepayAmount] = useState<number>(0);

  const buttonClass =
    "inline-flex items-center justify-center rounded-xl bg-black px-4 py-4 font-semibold text-white shadow-sm " +
    "transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const titleClass = "font-semibold text-black text-lg mt-4";

  if (!isConnected) {
    return (
      <div className="mx-auto">
        <button className={buttonClass} disabled={isConnected} onClick={connect}>
          <span className="text-4xl p-6">Connect to MetaMask</span>
        </button>
      </div>
    );
  }

  if (isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="grid w-full gap-4">
      <div className="col-span-full mx-20 bg-black text-white">
        <p className="font-semibold text-3xl m-5">
          FHEVM React Minimal Template -{" "}
          <span className="font-mono font-normal text-gray-400">PrivateDeFiLending.sol</span>
        </p>
      </div>
      <div className="col-span-full mx-20 mt-4 px-5 pb-4 rounded-lg bg-white border-2 border-black">
        <p className={titleClass}>Chain Infos</p>
        {printProperty("ChainId", chainId)}
        {printProperty(
          "Metamask accounts",
          accounts
            ? accounts.length === 0
              ? "No accounts"
              : `{ length: ${accounts.length}, [${accounts[0]}, ...] }`
            : "undefined",
        )}
        {printProperty("PrivateDeFiLending", contractAddress)}
        {printProperty("isDeployed", isDeployed)}
        {printProperty("Is Lender", isLender)}
      </div>
      <div className="col-span-full mx-20 px-4 pb-4 rounded-lg bg-white border-2 border-black">
        <p className={titleClass}>Lending State</p>
        {printProperty("Lender", lender)}
        {printProperty("Actual Pool", `${ethers.formatEther(actualPool)} ETH`)}
        {printProperty("User Borrow Amount", `${ethers.formatEther(userBorrowAmount)} ETH`)}
        {printProperty("User Total Repay", `${ethers.formatEther(userTotalRepay)} ETH`)}
        {printProperty("Has Active Loan", hasActiveLoan)}
      </div>
      <div className="grid grid-cols-3 mx-20 gap-4">
        <button
          className={buttonClass}
          disabled={!canGetState}
          onClick={refreshState}
        >
          {canGetState ? "Refresh State" : "PrivateDeFiLending is not available"}
        </button>
        <div>
          <input
            type="number"
            placeholder="Deposit Amount (wei)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            className="border-2 border-black p-2 rounded mb-2 w-full"
            disabled={!canDeposit}
            min="1"
          />
          <button
            className={buttonClass}
            disabled={!canDeposit || depositAmount <= 0}
            onClick={() => deposit(depositAmount)}
          >
            {canDeposit ? "Deposit" : isDepositing ? "Depositing..." : "Cannot deposit"}
          </button>
        </div>
        <div>
          <input
            type="number"
            placeholder="Interest Rate (%)"
            value={rateValue}
            onChange={(e) => setRateValue(Number(e.target.value))}
            className="border-2 border-black p-2 rounded mb-2 w-full"
            disabled={!canSetRate}
            min="1"
          />
          <button
            className={buttonClass}
            disabled={!canSetRate || rateValue <= 0}
            onClick={() => setRate(rateValue)}
          >
            {canSetRate ? "Set Rate" : isSettingRate ? "Setting..." : "Cannot set rate"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 mx-20 gap-4">
        <div>
          <input
            type="number"
            placeholder="Borrow Amount (wei)"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(Number(e.target.value))}
            className="border-2 border-black p-2 rounded mb-2 w-full"
            disabled={!canRequestBorrow}
            min="1"
          />
          <button
            className={buttonClass}
            disabled={!canRequestBorrow || borrowAmount <= 0}
            onClick={() => requestBorrow(borrowAmount)}
          >
            {canRequestBorrow ? "Request Borrow" : isRequestingBorrow ? "Requesting..." : "Cannot request borrow"}
          </button>
        </div>
        <div>
          <input
            type="number"
            placeholder="Repay Amount (wei)"
            value={repayAmount}
            onChange={(e) => setRepayAmount(Number(e.target.value))}
            className="border-2 border-black p-2 rounded mb-2 w-full"
            disabled={!canRepay}
            min="1"
          />
          <button
            className={buttonClass}
            disabled={!canRepay || repayAmount <= 0}
            onClick={() => repay(repayAmount)}
          >
            {canRepay ? "Repay" : isRepaying ? "Repaying..." : "Cannot repay"}
          </button>
        </div>
        <button
          className={buttonClass}
          disabled={!canWithdrawPool}
          onClick={withdrawPool}
        >
          {canWithdrawPool ? "Withdraw Pool" : isWithdrawing ? "Withdrawing..." : "Cannot withdraw"}
        </button>
      </div>
      <div className="col-span-full mx-20 p-4 rounded-lg bg-white border-2 border-black">
        {printProperty("Message", message)}
      </div>
    </div>
  );
};

// printProperty and printBooleanProperty
function printProperty(name: string, value: unknown) {
  let displayValue: string;

  if (typeof value === "boolean") {
    return printBooleanProperty(name, value);
  } else if (typeof value === "string" || typeof value === "number") {
    displayValue = String(value);
  } else if (typeof value === "bigint") {
    displayValue = String(value);
  } else if (value === null) {
    displayValue = "null";
  } else if (value === undefined) {
    displayValue = "undefined";
  } else if (value instanceof Error) {
    displayValue = value.message;
  } else {
    displayValue = JSON.stringify(value);
  }
  return (
    <p className="text-black">
      {name}: <span className="font-mono font-semibold text-black">{displayValue}</span>
    </p>
  );
}

function printBooleanProperty(name: string, value: boolean) {
  if (value) {
    return (
      <p className="text-black">
        {name}: <span className="font-mono font-semibold text-green-500">true</span>
      </p>
    );
  }

  return (
    <p className="text-black">
      {name}: <span className="font-mono font-semibold text-red-500">false</span>
    </p>
  );
}
