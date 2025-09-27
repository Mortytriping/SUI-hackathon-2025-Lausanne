import { getFullnodeUrl } from "@mysten/sui/client";
import {
  DEVNET_ALARM_PACKAGE_ID,
  TESTNET_ALARM_PACKAGE_ID,
  MAINNET_ALARM_PACKAGE_ID,
} from "./constants";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        alarmPackageId: DEVNET_ALARM_PACKAGE_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        alarmPackageId: TESTNET_ALARM_PACKAGE_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        alarmPackageId: MAINNET_ALARM_PACKAGE_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
