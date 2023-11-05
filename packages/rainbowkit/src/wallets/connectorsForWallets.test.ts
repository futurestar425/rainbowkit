import { describe, expect, it } from "vitest";
import { connectorsForWallets } from "..";
import { walletConnect } from "wagmi/connectors";
import { injectedWallet } from "./walletConnectors/injectedWallet/injectedWallet";
import { CreateConnectorFn } from "wagmi";
import { walletConnectWallet } from "./walletConnectors/walletConnectWallet/walletConnectWallet";

const isValidConnector = (connector: CreateConnectorFn): boolean => {
  if (typeof connector !== "function") {
    throw new Error("Wallet instance is not a function");
  }

  return !!connector;
};

const exampleProjectId = "21fef48091f12692cad574a6f7753643";

describe("connectorsForWallets", () => {
  describe("injected fallback", () => {
    it("should return wallet connect and injected wallet connectors", () => {
      const connectors = connectorsForWallets([
        {
          groupName: "Test Group 1",
          wallets: [
            {
              createConnector: () => () =>
                walletConnect({ projectId: exampleProjectId }),
              iconBackground: "#fff",
              iconUrl: "/test.png",
              id: "test-walletconnect-wallet",
              name: "Test WalletConnect Wallet",
            },
            injectedWallet(),
          ],
        },
      ]);

      expect(connectors.length).toBe(2);

      expect(isValidConnector(connectors[0])).toBe(true);
      expect(isValidConnector(connectors[1])).toBe(true);

      expect(connectors.length).toBe(2);
    });

    it("should not return connector if 'hidden' returns true", () => {
      const connectors = connectorsForWallets([
        {
          groupName: "Test Group 1",
          wallets: [
            {
              createConnector: () => () =>
                walletConnect({ projectId: exampleProjectId }),
              hidden: () => true,
              iconBackground: "#fff",
              iconUrl: "/test.png",
              id: "test-not-installed-wallet",
              installed: false,
              name: "Test Not Installed Wallet",
            },
          ],
        },
      ]);

      expect(connectors.length).toBe(0);
    });

    it("should throw if projectId is invalid to wallet connect connector", () => {
      const walletList = [
        {
          groupName: "Test Group 1",
          wallets: [
            // @ts-expect-error
            walletConnectWallet({ projectId: undefined }),
          ],
        },
      ];

      // You can also check the specific error message part, for example:
      expect(() => {
        connectorsForWallets(walletList);
      }).toThrow(
        "No projectId found. Every dApp must now provide a WalletConnect Cloud projectId"
      );
    });
  });
});
