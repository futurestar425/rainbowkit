import React, { ReactNode, useContext, useEffect, useState } from "react";
import {
  useAccount,
  useAccountEffect,
  useConnect,
  useConnections,
} from "wagmi";
import { useConnectionStatus } from "../../hooks/useConnectionStatus";
import { useIsMounted } from "../../hooks/useIsMounted";
import { isMobile } from "../../utils/isMobile";
import {
  WalletConnector,
  useWalletConnectors,
} from "../../wallets/useWalletConnectors";
import {
  useConnectModal,
  useModalState,
} from "../RainbowKitProvider/ModalContext";
import { WalletButtonContext } from "../RainbowKitProvider/WalletButtonContext";
import { stringEquals } from "../../utils/stringEquals";
import { findWalletConnector } from "../../utils/findConnector";

export interface WalletButtonRendererProps {
  wallet?: string;
  children: (renderProps: {
    error: boolean;
    loading: boolean;
    connected: boolean;
    ready: boolean;
    mounted: boolean;
    connector: WalletConnector;
    connect: () => void;
  }) => ReactNode;
}

export function WalletButtonRenderer({
  // Wallet is the same as `connector.id` which is injected into
  // wagmi connectors
  wallet = "rainbow",
  children,
}: WalletButtonRendererProps) {
  const isMounted = useIsMounted();
  const { openConnectModal } = useConnectModal();
  const { connectModalOpen } = useModalState();
  const { connector, setConnector } = useContext(WalletButtonContext);

  const connectors = useWalletConnectors();

  const firstConnector = findWalletConnector(
    wallet,
    connectors
  ) as WalletConnector;

  if (!firstConnector && isMounted()) {
    throw new Error("Connector not found");
  }

  const connectionStatus = useConnectionStatus();

  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const mobile = isMobile();

  // If modal is closed we want to setConnector to null
  // to avoid "connecting to wallet..." ui
  useEffect(() => {
    if (!connectModalOpen && connector) setConnector(null);
  }, [connectModalOpen, connector, setConnector]);

  const { connector: connectedConnector, isConnecting } = useAccount();

  useAccountEffect({
    onConnect: () => {
      /*  const lastClickedWalletName = getRecent */
      // If you get error on desktop and thenswitch to mobile view
      // then connect your wallet the error will remain there. We will
      // reset the error in case that happens.
      if (isError) setIsError(false);
    },
  });

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (isError) setIsError(false);
      await firstConnector?.connect?.();
    } catch {
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // If anyone uses SIWE then we don't want them to be able to connect
  // if they are in a process of authentication
  const isStatusLoading = connectionStatus === "loading";
  const ready =
    !isConnecting && !!openConnectModal && firstConnector && !isStatusLoading;

  const isNotSupported = !firstConnector?.ready;

  const connected = stringEquals(
    connectedConnector?.id ?? "",
    firstConnector?.id ?? ""
  );

  /*   if (wallet === "rainbow") {
    console.log(firstConnector?.id, connectedConnector?.id);
  } */
  return (
    <>
      {children({
        error: isError,
        loading,
        connected,
        ready,
        mounted: isMounted(),
        connector: firstConnector,
        connect: async () => {
          // If openConnectModal is true and user is on mobile or
          // if user hasn't installed the connector then we prompt them
          // to rainbowkit connect modal
          if (mobile || isNotSupported) {
            openConnectModal?.();
            setConnector(firstConnector);
            return;
          }

          connectWallet();
        },
      })}
    </>
  );
}
