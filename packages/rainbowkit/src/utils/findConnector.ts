// We wil try to find eip6963 connector or RainbowKit connector.

import { isEIP6963Connector } from "../wallets/groupedWallets";
import { WalletConnector } from "../wallets/useWalletConnectors";
import { lowerCase } from "./lowerCase";
import { stringEquals } from "./stringEquals";

export const findWalletConnector = (
  walletId: string,
  walletConnectors: WalletConnector[]
): WalletConnector | undefined => {
  const eip6963Connectors: Record<string, WalletConnector> = {};
  const rainbowKitConnectors: Record<string, WalletConnector> = {};

  for (const connector of walletConnectors) {
    const eip6963 = isEIP6963Connector(connector);

    if (eip6963) {
      const rkConnector = walletConnectors.find(
        ({ isRainbowKitConnector, rdns }) => {
          return (
            isRainbowKitConnector && stringEquals(rdns ?? "", connector.id)
          );
        }
      );

      // We want to use RainbowKit connector id instead of eip6963 id.
      // Append the connector as eip6963 connector instead of RainbowKit connector
      if (rkConnector) eip6963Connectors[lowerCase(rkConnector.id)] = connector;
    } else {
      rainbowKitConnectors[lowerCase(connector.id)] = connector;
    }
  }

  return (
    eip6963Connectors[lowerCase(walletId)] ||
    rainbowKitConnectors[lowerCase(walletId)]
  );
};
