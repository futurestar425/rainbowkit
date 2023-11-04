import { isIOS } from "../../../utils/isMobile";
import { Wallet } from "../../Wallet";
import { getInjectedConnector } from "../../getInjectedConnector";
import { getWalletConnectConnector } from "../../getWalletConnectConnector";

export interface ZerionWalletOptions {
  projectId: string;
}

export const zerionWallet = ({ projectId }: ZerionWalletOptions): Wallet => {
  const isZerionInjected =
    typeof window !== "undefined" &&
    ((typeof window.ethereum !== "undefined" && window.ethereum.isZerion) ||
      // @ts-expect-error
      typeof window.zerionWallet !== "undefined");

  const shouldUseWalletConnect = !isZerionInjected;

  const getUri = (uri: string) => {
    return isIOS() ? `zerion://wc?uri=${encodeURIComponent(uri)}` : uri;
  };

  return {
    id: "zerion",
    name: "Zerion",
    iconUrl: async () => (await import("./zerionWallet.svg")).default,
    iconAccent: "#2962ef",
    iconBackground: "#2962ef",
    installed: !shouldUseWalletConnect ? isZerionInjected : undefined,
    downloadUrls: {
      android:
        "https://play.google.com/store/apps/details?id=io.zerion.android",
      ios: "https://apps.apple.com/app/apple-store/id1456732565",
      mobile: "https://link.zerion.io/pt3gdRP0njb",
      qrCode: "https://link.zerion.io/pt3gdRP0njb",
      chrome:
        "https://chrome.google.com/webstore/detail/klghhnkeealcohjjanjjdaeeggmfmlpl",
      browserExtension: "https://zerion.io/extension",
    },
    mobile: {
      getUri: shouldUseWalletConnect ? getUri : undefined,
    },
    qrCode: shouldUseWalletConnect
      ? {
          getUri,
          instructions: {
            learnMoreUrl:
              "https://zerion.io/blog/announcing-the-zerion-smart-wallet/",
            steps: [
              {
                description:
                  "wallet_connectors.zerion.qr_code.step1.description",
                step: "install",
                title: "wallet_connectors.zerion.qr_code.step1.title",
              },
              {
                description:
                  "wallet_connectors.zerion.qr_code.step2.description",
                step: "create",
                title: "wallet_connectors.zerion.qr_code.step2.title",
              },
              {
                description:
                  "wallet_connectors.zerion.qr_code.step3.description",
                step: "scan",
                title: "wallet_connectors.zerion.qr_code.step3.title",
              },
            ],
          },
        }
      : undefined,
    extension: {
      instructions: {
        learnMoreUrl: "https://help.zerion.io/en/",
        steps: [
          {
            description: "wallet_connectors.zerion.extension.step1.description",
            step: "install",
            title: "wallet_connectors.zerion.extension.step1.title",
          },
          {
            description: "wallet_connectors.zerion.extension.step2.description",
            step: "create",
            title: "wallet_connectors.zerion.extension.step2.title",
          },
          {
            description: "wallet_connectors.zerion.extension.step3.description",
            step: "refresh",
            title: "wallet_connectors.zerion.extension.step3.title",
          },
        ],
      },
    },
    createConnector: () => {
      const connector = shouldUseWalletConnect
        ? getWalletConnectConnector({
            projectId,
          })
        : getInjectedConnector({
            target:
              typeof window !== "undefined"
                ? // @ts-expect-error
                  window.zerionWallet || window.ethereum
                : undefined,
          });

      return connector;
    },
  };
};
