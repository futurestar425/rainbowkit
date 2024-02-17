import React, {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount, useAccountEffect, useConnections } from "wagmi";
import { useConnectionStatus } from "../../hooks/useConnectionStatus";
import { useIsMounted } from "../../hooks/useIsMounted";
import { isMobile } from "../../utils/isMobile";
import {
  addLatestWalletId,
  clearLatestWalletId,
  getLatestWalletId,
} from "../../wallets/latestWalletId";
import {
  WalletConnector,
  useWalletConnectors,
} from "../../wallets/useWalletConnectors";
import {
  useConnectModal,
  useModalState,
} from "../RainbowKitProvider/ModalContext";
import { WalletButtonContext } from "../RainbowKitProvider/WalletButtonContext";
import { findWalletConnector } from "../../utils/findConnector";
import { stringEquals } from "../../utils/stringEquals";

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

  const firstConnector = findWalletConnector(wallet, connectors);

  if (!firstConnector) {
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

  const { isConnecting } = useAccount();

  useAccountEffect({
    onConnect: () => {
      // If you get error on desktop and then switch to mobile view
      // and connect your wallet the error will remain there. We will
      // reset the error in case that happens.
      if (isError) setIsError(false);
    },
    onDisconnect: clearLatestWalletId,
  });

  const connections = useConnections();
  console.log(connections);
  const connected = connections.some((connection) => {
    const connectorId = connection.connector.id;
    return (
      // Check if RainbowKit connector id connected
      stringEquals(connectorId, wallet) ||
      // Wagmi uses EIP-6963 id's as rdns. E.g instead of
      // 'metamask' as id they use 'metamask.io' since that's
      // the metamask's rdns. We want to check if an EIP-6963
      // wallet is connected as well with this logic.
      stringEquals(connectorId, firstConnector?.id)
    );
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
          // Used to track which last wallet user has clicked
          // we can then use this value to show connected green badge
          // for our custom Wallet Button API
          addLatestWalletId(firstConnector?.id || "");

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
