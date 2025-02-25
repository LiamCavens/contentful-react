import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Flex
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { css } from "emotion";
import { useEffect, useState, useCallback } from "react";

interface AppInstallationParameters {}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({});

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);


  useEffect(() => {
    sdk.app.onConfigure(onConfigure);

    const fetchData = async () => {
      const params = await sdk.app.getParameters();
      setParameters(params || {});
      await sdk.app.setReady();
    };

    fetchData();
  }, [sdk, onConfigure]);

  return (
    <Flex flexDirection="column" className={css({ margin: "80px" })}>
      App Config Screen
    </Flex>
  );
};

export default ConfigScreen;
