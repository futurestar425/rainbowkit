import React, { useContext } from "react";
import { Box } from "../Box/Box";
import { DisclaimerLink } from "../Disclaimer/DisclaimerLink";
import { DisclaimerText } from "../Disclaimer/DisclaimerText";
import { useWalletConnectors } from "../../wallets/useWalletConnectors";
import { I18nContext } from "../RainbowKitProvider/I18nContext";
import { ActionButton } from "../Button/ActionButton";
import { AppContext } from "../RainbowKitProvider/AppContext";
import { Text } from "../Text/Text";
import { MobileWalletStep, WalletButton } from "./MobileOptions";
import * as styles from "./MobileOptions.css";

interface MobileConnectDetailProps {
  onClose: () => void;
  setWalletStep: (walletStep: MobileWalletStep) => void;
}

const MobileConnectDetail = ({
  onClose,
  setWalletStep,
}: MobileConnectDetailProps) => {
  const wallets = useWalletConnectors(true);

  const { i18n } = useContext(I18nContext);
  const { disclaimer: Disclaimer, learnMoreUrl } = useContext(AppContext);

  return (
    <Box>
      <Box
        background="profileForeground"
        className={styles.scroll}
        display="flex"
        paddingBottom="20"
        paddingTop="6"
      >
        <Box display="flex" style={{ margin: "0 auto" }}>
          {wallets
            .filter((wallet) => wallet.ready)
            .map((wallet) => {
              return (
                <Box key={wallet.id} paddingX="20">
                  <Box width="60">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {wallet.isRainbowKitConnector ? "rainbow" : "eip6963"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        margin: "18px 0",
                      }}
                    >
                      {wallet.rdns && wallet.rdns}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {wallet.iconUrl && "true"}
                    </div>

                    <WalletButton onClose={onClose} wallet={wallet} />
                  </Box>
                </Box>
              );
            })}
        </Box>
      </Box>

      <Box
        background="generalBorder"
        height="1"
        marginBottom="32"
        marginTop="-1"
      />

      <Box
        alignItems="center"
        display="flex"
        flexDirection="column"
        gap="32"
        paddingX="32"
        style={{ textAlign: "center" }}
      >
        <Box display="flex" flexDirection="column" gap="8" textAlign="center">
          <Text color="modalText" size="16" weight="bold">
            {i18n.t("intro.title")}
          </Text>
          <Text color="modalTextSecondary" size="16">
            {i18n.t("intro.description")}
          </Text>
        </Box>
      </Box>

      <Box paddingTop="32" paddingX="20">
        <Box display="flex" gap="14" justifyContent="center">
          <ActionButton
            label={i18n.t("intro.get.label")}
            onClick={() => setWalletStep(MobileWalletStep.Get)}
            size="large"
            type="secondary"
          />
          <ActionButton
            href={learnMoreUrl}
            label={i18n.t("intro.learn_more.label")}
            size="large"
            type="secondary"
          />
        </Box>
      </Box>
      {Disclaimer && (
        <Box marginTop="28" marginX="32" textAlign="center">
          <Disclaimer Link={DisclaimerLink} Text={DisclaimerText} />
        </Box>
      )}
    </Box>
  );
};

export default MobileConnectDetail;
