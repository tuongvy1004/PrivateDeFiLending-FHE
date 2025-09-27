"use client";

import { ethers } from "ethers";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { PrivateDeFiLendingAddresses } from "@/abi/PrivateDeFiLendingAddresses";
import { PrivateDeFiLendingABI } from "@/abi/PrivateDeFiLendingABI";

type PrivateDeFiLendingInfoType = {
  abi: typeof PrivateDeFiLendingABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getPrivateDeFiLendingByChainId(chainId: number | undefined): PrivateDeFiLendingInfoType {
  if (!chainId) {
    return { abi: PrivateDeFiLendingABI.abi };
  }

  const chainIdStr = chainId.toString() as keyof typeof PrivateDeFiLendingAddresses;
  const entry = PrivateDeFiLendingAddresses[chainIdStr];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: PrivateDeFiLendingABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: PrivateDeFiLendingABI.abi,
  };
}

export const usePrivateDeFiLending = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  // States and Refs
  const [lender, setLender] = useState<string>(ethers.ZeroAddress);
  const [actualPool, setActualPool] = useState<string>("0");
  const [isLender, setIsLender] = useState<boolean>(false);
  const [userBorrowAmount, setUserBorrowAmount] = useState<string>("0");
  const [userTotalRepay, setUserTotalRepay] = useState<string>("0");
  const [hasActiveLoan, setHasActiveLoan] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [isSettingRate, setIsSettingRate] = useState<boolean>(false);
  const [isRequestingBorrow, setIsRequestingBorrow] = useState<boolean>(false);
  const [isRepaying, setIsRepaying] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const privateDeFiLendingRef = useRef<PrivateDeFiLendingInfoType | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDepositingRef = useRef<boolean>(isDepositing);
  const isSettingRateRef = useRef<boolean>(isSettingRate);
  const isRequestingBorrowRef = useRef<boolean>(isRequestingBorrow);
  const isRepayingRef = useRef<boolean>(isRepaying);
  const isWithdrawingRef = useRef<boolean>(isWithdrawing);
  const pendingBorrowAmountRef = useRef<string>("0");

  // Contract
  const privateDeFiLending = useMemo(() => {
    const c = getPrivateDeFiLendingByChainId(chainId);

    privateDeFiLendingRef.current = c;

    if (!c.address) {
      setMessage(`PrivateDeFiLending deployment not found for chainId=${chainId}.`);
    }

    return c;
  }, [chainId]);

  // isDeployed
  const isDeployed = useMemo(() => {
    if (!privateDeFiLending) {
      return undefined;
    }
    return Boolean(privateDeFiLending.address) && privateDeFiLending.address !== ethers.ZeroAddress;
  }, [privateDeFiLending]);

  // canGetState
  const canGetState = useMemo(() => {
    return privateDeFiLending.address && ethersReadonlyProvider && eip1193Provider && !isRefreshing;
  }, [privateDeFiLending.address, ethersReadonlyProvider, eip1193Provider, isRefreshing]);

  // canDeposit
  const canDeposit = useMemo(() => {
    return privateDeFiLending.address && instance && ethersSigner && isLender && !isRefreshing && !isDepositing;
  }, [privateDeFiLending.address, instance, ethersSigner, isLender, isRefreshing, isDepositing]);

  // canSetRate
  const canSetRate = useMemo(() => {
    return privateDeFiLending.address && instance && ethersSigner && isLender && !isRefreshing && !isSettingRate;
  }, [privateDeFiLending.address, instance, ethersSigner, isLender, isRefreshing, isSettingRate]);

  // canRequestBorrow
  const canRequestBorrow = useMemo(() => {
    return privateDeFiLending.address && instance && ethersSigner && !isLender && !hasActiveLoan && !isRefreshing && !isRequestingBorrow && Number(actualPool) > 0;
  }, [privateDeFiLending.address, instance, ethersSigner, isLender, hasActiveLoan, isRefreshing, isRequestingBorrow, actualPool]);

  // canRepay
  const canRepay = useMemo(() => {
    return privateDeFiLending.address && instance && ethersSigner && !isLender && hasActiveLoan && !isRefreshing && !isRepaying;
  }, [privateDeFiLending.address, instance, ethersSigner, isLender, hasActiveLoan, isRefreshing, isRepaying]);

  // canWithdrawPool
  const canWithdrawPool = useMemo(() => {
    return privateDeFiLending.address && ethersSigner && isLender && !isRefreshing && !isWithdrawing;
  }, [privateDeFiLending.address, ethersSigner, isLender, isRefreshing, isWithdrawing]);

  // Refresh State
  const refreshState = useCallback(async () => {
    if (isRefreshingRef.current) {
      setMessage("Refresh already in progress...");
      return;
    }

    if (
      !privateDeFiLendingRef.current ||
      !privateDeFiLendingRef.current?.chainId ||
      !privateDeFiLendingRef.current?.address ||
      !ethersReadonlyProvider ||
      !ethersSigner ||
      !eip1193Provider
    ) {
      setMessage("Missing required parameters for refresh");
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setMessage("Refreshing state...");

    const thisChainId = privateDeFiLendingRef.current.chainId;
    const thisPrivateDeFiLendingAddress = privateDeFiLendingRef.current.address;

    const thisPrivateDeFiLendingContract = new ethers.Contract(
      thisPrivateDeFiLendingAddress,
      privateDeFiLendingRef.current.abi,
      ethersReadonlyProvider,
    );

    try {
      const userAddress = await ethersSigner.getAddress();

      setLender(await thisPrivateDeFiLendingContract.lender());
      setIsLender((await thisPrivateDeFiLendingContract.lender()).toLowerCase() === userAddress.toLowerCase());
      setActualPool((await thisPrivateDeFiLendingContract.actualPool()).toString());

      const totalRepay = await thisPrivateDeFiLendingContract.decryptedTotalRepay(userAddress);
      const agreed = await thisPrivateDeFiLendingContract.agreed(userAddress);
      setHasActiveLoan(agreed);
      
      if (agreed && totalRepay.toString() === "0" && pendingBorrowAmountRef.current !== "0") {
        setUserBorrowAmount(pendingBorrowAmountRef.current);
        setUserTotalRepay(pendingBorrowAmountRef.current);
        setMessage("Waiting for borrow confirmation from contract...");
      } else {
        setUserBorrowAmount(totalRepay.toString());
        setUserTotalRepay(totalRepay.toString());
      }

      if (sameChain.current(thisChainId) && thisPrivateDeFiLendingAddress === privateDeFiLendingRef.current?.address) {
        setMessage("State refreshed successfully");
      }
    } catch (e) {
      setMessage(`State refresh failed: ${(e as Error).message}`);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      setTimeout(() => setMessage(""), 3000);
    }
  }, [ethersReadonlyProvider, eip1193Provider, ethersSigner, sameChain]);

  // Auto refresh
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Listen for Events
  useEffect(() => {
    if (!privateDeFiLending.address || !ethersReadonlyProvider) return;

    const contract = new ethers.Contract(
      privateDeFiLending.address,
      privateDeFiLending.abi,
      ethersReadonlyProvider,
    );

    const userAddress = ethersSigner ? ethersSigner.address.toLowerCase() : undefined;

    if (userAddress) {
      contract.on("Deposit", (lenderAddr, requestId) => {
        setMessage(`Deposit successful (Request ID: ${requestId})`);
        refreshState();
      });

      contract.on("RateSet", (lenderAddr) => {
        setMessage("Interest rate set successfully");
        refreshState();
      });

      contract.on("BorrowRequested", (borrower, requestId) => {
        setMessage(`Borrow request submitted (Request ID: ${requestId})`);
        refreshState();
      });

      contract.on("BorrowConfirmed", async (borrower, amountBorrowed, totalRepay) => {
        if (borrower.toLowerCase() === userAddress) {
          setMessage(`Borrow confirmed: ${ethers.formatEther(amountBorrowed)} ETH borrowed, repay ${ethers.formatEther(totalRepay)} ETH`);
          setUserBorrowAmount(amountBorrowed.toString());
          setUserTotalRepay(totalRepay.toString());
          setHasActiveLoan(true);
          pendingBorrowAmountRef.current = "0";
          await refreshState();
        }
      });

      contract.on("RepayRequested", (borrower, requestId) => {
        setMessage(`Repay request submitted (Request ID: ${requestId})`);
        refreshState();
      });

      contract.on("Repaid", async (borrower, amount) => {
        if (borrower.toLowerCase() === userAddress) {
          setMessage(`Repaid: ${ethers.formatEther(amount)} ETH`);
          setUserBorrowAmount("0");
          setUserTotalRepay("0");
          setHasActiveLoan(false);
          await refreshState();
        }
      });

      contract.on("WithdrawalRequested", (lenderAddr, requestId) => {
        setMessage(`Withdrawal requested (Request ID: ${requestId})`);
        refreshState();
      });

      contract.on("PoolWithdrawn", (lenderAddr, amount) => {
        setMessage(`Pool withdrawn: ${ethers.formatEther(amount)} ETH`);
        refreshState();
      });
    }

    return () => {
      contract.removeAllListeners();
    };
  }, [privateDeFiLending.address, ethersReadonlyProvider, ethersSigner, refreshState]);

  // Deposit
  const deposit = useCallback(
    async (amount: number) => {
      if (isRefreshingRef.current || isDepositingRef.current) {
        setMessage("Deposit already in progress...");
        return;
      }

      if (!privateDeFiLending.address || !ethersSigner || !instance) {
        setMessage("Missing parameters for deposit");
        return;
      }

      const thisChainId = chainId;
      const thisPrivateDeFiLendingAddress = privateDeFiLending.address;
      const thisEthersSigner = ethersSigner;
      const thisPrivateDeFiLendingContract = new ethers.Contract(
        thisPrivateDeFiLendingAddress,
        privateDeFiLending.abi,
        thisEthersSigner,
      );

      isDepositingRef.current = true;
      setIsDepositing(true);
      setMessage("Preparing deposit...");

      const isStale = () =>
        thisPrivateDeFiLendingAddress !== privateDeFiLendingRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        setMessage("Encrypting deposit amount...");
        const enc = await instance.createEncryptedInput(thisPrivateDeFiLendingAddress, ethersSigner.address).add64(amount).encrypt();
        setMessage(`Sending deposit transaction for ${ethers.formatEther(amount)} ETH...`);
        const tx = await thisPrivateDeFiLendingContract.deposit(enc.handles[0], enc.inputProof, { value: amount });
        setMessage(`Waiting for transaction ${tx.hash}...`);
        const receipt = await tx.wait();
        if (receipt?.status !== 1) {
          throw new Error("Transaction failed");
        }
        setMessage(`Deposit of ${ethers.formatEther(amount)} ETH successful`);
        if (!isStale()) {
          await refreshState();
        }
      } catch (e) {
        setMessage(`Deposit failed: ${(e as Error).message}`);
      } finally {
        isDepositingRef.current = false;
        setIsDepositing(false);
        setTimeout(() => setMessage(""), 5000);
      }
    },
    [privateDeFiLending.address, ethersSigner, instance, chainId, refreshState, sameChain, sameSigner],
  );

  // Set Rate
  const setRate = useCallback(
    async (rate: number) => {
      if (isRefreshingRef.current || isSettingRateRef.current) {
        setMessage("Setting rate already in progress...");
        return;
      }

      if (!privateDeFiLending.address || !ethersSigner || !instance) {
        setMessage("Missing parameters for setting rate");
        return;
      }

      const thisChainId = chainId;
      const thisPrivateDeFiLendingAddress = privateDeFiLending.address;
      const thisEthersSigner = ethersSigner;
      const thisPrivateDeFiLendingContract = new ethers.Contract(
        thisPrivateDeFiLendingAddress,
        privateDeFiLending.abi,
        thisEthersSigner,
      );

      isSettingRateRef.current = true;
      setIsSettingRate(true);
      setMessage("Preparing to set interest rate...");

      const isStale = () =>
        thisPrivateDeFiLendingAddress !== privateDeFiLendingRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        setMessage(`Encrypting interest rate (${rate}%)...`);
        const enc = await instance.createEncryptedInput(thisPrivateDeFiLendingAddress, ethersSigner.address).add64(rate).encrypt();
        setMessage("Sending set rate transaction...");
        const tx = await thisPrivateDeFiLendingContract.setRate(enc.handles[0], enc.inputProof);
        setMessage(`Waiting for transaction ${tx.hash}...`);
        const receipt = await tx.wait();
        if (receipt?.status !== 1) {
          throw new Error("Transaction failed");
        }
        setMessage(`Interest rate set to ${rate}% successfully`);
        if (!isStale()) {
          await refreshState();
        }
      } catch (e) {
        setMessage(`Set rate failed: ${(e as Error).message}`);
      } finally {
        isSettingRateRef.current = false;
        setIsSettingRate(false);
        setTimeout(() => setMessage(""), 5000);
      }
    },
    [privateDeFiLending.address, ethersSigner, instance, chainId, refreshState, sameChain, sameSigner],
  );

  // Request Borrow
  const requestBorrow = useCallback(
    async (amount: number) => {
      if (isRefreshingRef.current || isRequestingBorrowRef.current) {
        setMessage("Borrow request already in progress...");
        return;
      }

      if (!privateDeFiLending.address || !ethersSigner || !instance) {
        setMessage("Missing parameters for borrow request");
        return;
      }

      const thisChainId = chainId;
      const thisPrivateDeFiLendingAddress = privateDeFiLending.address;
      const thisEthersSigner = ethersSigner;
      const thisPrivateDeFiLendingContract = new ethers.Contract(
        thisPrivateDeFiLendingAddress,
        privateDeFiLending.abi,
        thisEthersSigner,
      );

      isRequestingBorrowRef.current = true;
      setIsRequestingBorrow(true);
      setMessage("Preparing borrow request...");

      const isStale = () =>
        thisPrivateDeFiLendingAddress !== privateDeFiLendingRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        setMessage(`Encrypting borrow amount (${ethers.formatEther(amount)} ETH)...`);
        const enc = await instance.createEncryptedInput(thisPrivateDeFiLendingAddress, ethersSigner.address).add64(amount).encrypt();
        setMessage("Sending borrow request transaction...");
        const tx = await thisPrivateDeFiLendingContract.requestBorrow(enc.handles[0], enc.inputProof);
        setMessage(`Waiting for transaction ${tx.hash}...`);
        const receipt = await tx.wait();
        if (receipt?.status !== 1) {
          throw new Error("Transaction failed");
        }
        setMessage(`Borrow request for ${ethers.formatEther(amount)} ETH submitted`);
        if (!isStale()) {
          setHasActiveLoan(true);
          pendingBorrowAmountRef.current = amount.toString();
          setUserBorrowAmount(amount.toString()); 
          setUserTotalRepay(amount.toString()); 
          await refreshState();

          for (let i = 1; i <= 3; i++) {
            setTimeout(async () => {
              if (!isStale()) {
                setMessage(`Checking borrow status (attempt ${i})...`);
                await refreshState();
              }
            }, i * 5000);
          }
        }
      } catch (e) {
        setMessage(`Borrow request failed: ${(e as Error).message}`);
      } finally {
        isRequestingBorrowRef.current = false;
        setIsRequestingBorrow(false);
        setTimeout(() => setMessage(""), 5000);
      }
    },
    [privateDeFiLending.address, ethersSigner, instance, chainId, refreshState, sameChain, sameSigner],
  );

  // Repay
  const repay = useCallback(
    async (amount: number) => {
      if (isRefreshingRef.current || isRepayingRef.current) {
        setMessage("Repay already in progress...");
        return;
      }

      if (!privateDeFiLending.address || !ethersSigner || !instance) {
        setMessage("Missing parameters for repay");
        return;
      }

      const thisChainId = chainId;
      const thisPrivateDeFiLendingAddress = privateDeFiLending.address;
      const thisEthersSigner = ethersSigner;
      const thisPrivateDeFiLendingContract = new ethers.Contract(
        thisPrivateDeFiLendingAddress,
        privateDeFiLending.abi,
        thisEthersSigner,
      );

      isRepayingRef.current = true;
      setIsRepaying(true);
      setMessage(`Preparing repay of ${ethers.formatEther(amount)} ETH...`);

      const isStale = () =>
        thisPrivateDeFiLendingAddress !== privateDeFiLendingRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        setMessage(`Encrypting repay amount (${ethers.formatEther(amount)} ETH)...`);
        const enc = await instance.createEncryptedInput(thisPrivateDeFiLendingAddress, ethersSigner.address).add64(amount).encrypt();
        setMessage("Sending repay transaction...");
        const tx = await thisPrivateDeFiLendingContract.repay(enc.handles[0], enc.inputProof, { value: amount });
        setMessage(`Waiting for transaction ${tx.hash}...`);
        const receipt = await tx.wait();
        if (receipt?.status !== 1) {
          throw new Error("Transaction failed");
        }
        setMessage(`Repay of ${ethers.formatEther(amount)} ETH successful`);
        if (!isStale()) {
          setHasActiveLoan(false);
          setUserBorrowAmount("0");
          setUserTotalRepay("0");
          await refreshState();
        }
      } catch (e) {
        setMessage(`Repay failed: ${(e as Error).message}`);
      } finally {
        isRepayingRef.current = false;
        setIsRepaying(false);
        setTimeout(() => setMessage(""), 5000);
      }
    },
    [privateDeFiLending.address, ethersSigner, instance, chainId, refreshState, sameChain, sameSigner],
  );

  // Withdraw Pool
  const withdrawPool = useCallback(
    async () => {
      if (isRefreshingRef.current || isWithdrawingRef.current) {
        setMessage("Withdrawal already in progress...");
        return;
      }

      if (!privateDeFiLending.address || !ethersSigner) {
        setMessage("Missing parameters for withdrawal");
        return;
      }

      const thisChainId = chainId;
      const thisPrivateDeFiLendingAddress = privateDeFiLending.address;
      const thisEthersSigner = ethersSigner;
      const thisPrivateDeFiLendingContract = new ethers.Contract(
        thisPrivateDeFiLendingAddress,
        privateDeFiLending.abi,
        thisEthersSigner,
      );

      isWithdrawingRef.current = true;
      setIsWithdrawing(true);
      setMessage("Preparing withdrawal...");

      const isStale = () =>
        thisPrivateDeFiLendingAddress !== privateDeFiLendingRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        setMessage("Sending withdrawal transaction...");
        const tx = await thisPrivateDeFiLendingContract.withdrawPool();
        setMessage(`Waiting for transaction ${tx.hash}...`);
        const receipt = await tx.wait();
        if (receipt?.status !== 1) {
          throw new Error("Transaction failed");
        }
        setMessage("Withdrawal successful");
        if (!isStale()) {
          await refreshState();
        }
      } catch (e) {
        setMessage(`Withdrawal failed: ${(e as Error).message}`);
      } finally {
        isWithdrawingRef.current = false;
        setIsWithdrawing(false);
        setTimeout(() => setMessage(""), 5000);
      }
    },
    [privateDeFiLending.address, ethersSigner, chainId, refreshState, sameChain, sameSigner],
  );

  return {
    contractAddress: privateDeFiLending.address,
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
  };
};