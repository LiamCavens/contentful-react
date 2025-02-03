// const ConfigScreen = () => {
//   const [parameters, setParameters] = useState<AppInstallationParameters>({});
//   const sdk = useSDK<ConfigAppSDK>();

//   /*
//      To use the cma, inject it as follows.
//      If it is not needed, you can remove the next line.
//   */
//   // const cma = useCMA();

//   const onConfigure = useCallback(async () => {
//     // This method will be called when a user clicks on "Install"
//     // or "Save" in the configuration screen.
//     // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

//     // Get current the state of EditorInterface and other entities
//     // related to this app installation
//     const currentState = await sdk.app.getCurrentState();

//     return {
//       // Parameters to be persisted as the app configuration.
//       parameters,
//       // In case you don't want to submit any update to app
//       // locations, you can just pass the currentState as is
//       targetState: currentState,
//     };
//   }, [parameters, sdk]);

//   useEffect(() => {
//     // `onConfigure` allows to configure a callback to be
//     // invoked when a user attempts to install the app or update
//     // its configuration.
//     sdk.app.onConfigure(() => onConfigure());
//   }, [sdk, onConfigure]);

//   useEffect(() => {
//     (async () => {
//       // Get current parameters of the app.
//       // If the app is not installed yet, `parameters` will be `null`.
//       const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

//       if (currentParameters) {
//         setParameters(currentParameters);
//       }

//       // Once preparation has finished, call `setReady` to hide
//       // the loading screen and present the app to a user.
//       sdk.app.setReady();
//     })();
//   }, [sdk]);

//   return (
//     <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
//       <Form>
//         <Heading>App Config</Heading>
//         <Paragraph>Welcome to your contentful app. This is your config page.</Paragraph>
//       </Form>
//     </Flex>
//   );
// };

// export default ConfigScreen;

import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Flex,
  Form,
  Heading,
  Paragraph,
  Select,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { css } from "emotion";
import { useEffect, useState, useCallback } from "react";

interface AppInstallationParameters {}

interface Place {
  fields: {
    name: { [locale: string]: string };
    website?: { [locale: string]: string };
    description?: { [locale: string]: string };
    image?: { [locale: string]: { sys: { id: string } } };
    linkedVariant?: any;
  };
  image: {
    file: { [locale: string]: { url: string } };
    description: { [locale: string]: string };
  } | null;
}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [places, setPlaces] = useState<Place[]>([]);
  const locale = "en-US";

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  const getImageUrl = async (id: string) => {
    try {
      const imageAsset = await sdk.space.getAsset(id);
      console.log("Liam: imageAsset");
      console.log(imageAsset);
      return imageAsset.fields;
    } catch (error) {
      console.error(`Error fetching image asset with ID ${id}:`, error);
      return null;
    }
  };

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);

    const fetchData = async () => {
      const params = await sdk.app.getParameters();
      setParameters(params || {});

      const entries = await sdk.space.getEntries({ content_type: "place" });

      const mappedPlaces = await Promise.all(
        entries.items.map(async (entry: any) => {
          const imageId = entry.fields.image[locale][0].sys?.id;
          const image = imageId ? await getImageUrl(imageId) : null;

          return {
            fields: entry.fields,
            image,
          } as Place;
        })
      );

      setPlaces(mappedPlaces);
      await sdk.app.setReady();
    };

    fetchData();
  }, [sdk, onConfigure]);

  return (
    <Flex flexDirection="column" className={css({ margin: "80px" })}>
      <Heading>Place Demo</Heading>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        })}
      >
        {places.map((place, index) => (
          <div
            key={index}
            className={css({
              backgroundColor: "#fff",
              padding: "1rem",
              display: "flex",
              gap: "1rem",
            })}
          >
            <div className={css({ flex: 1 })}>
              <div
                className={css({
                  display: "flex",
                  flexDirection: "row",
                  gap: "1rem",
                  flex: 1,
                  justifyContent: "space-between",
                })}
              >
                <div
                  className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    flex: 1,
                    justifyContent: "space-between",
                  })}
                >
                  <Paragraph>{place.fields.name[locale]}</Paragraph>
                  <Form
                    className={css({
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      maxWidth: "25%",
                      marginBottom: "1rem",
                    })}
                  >
                    <Select
                      id="optionSelect-controlled"
                      name="optionSelect-controlled"
                      value="Eating"
                    >
                      <Select.Option value="optionOne">Eating</Select.Option>
                      <Select.Option value="optionTwo">
                        Non Eating
                      </Select.Option>
                    </Select>
                    <Select
                      id="optionSelect-controlled"
                      name="optionSelect-controlled"
                      value="Status"
                    >
                      <Select.Option value="optionOne">
                        Status Uno
                      </Select.Option>
                      <Select.Option value="optionTwo">
                        Status Dos
                      </Select.Option>
                    </Select>
                  </Form>
                  <Paragraph>£25</Paragraph>
                  <Paragraph>8:00 - 20:00</Paragraph>
                  {place.fields.website && (
                    <a
                      href={place.fields.website[locale]}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {place.fields.name[locale]} Website
                    </a>
                  )}
                </div>
                <div className={css({ width: "50%" })}>MAP PLACEHOLDER</div>
              </div>
              <div>
                DESCRIPTION
                {place.fields.description && (
                  <div
                    className={css({
                      backgroundColor: "#f0f0f0",
                      padding: "1rem",
                      marginTop: "1rem",
                    })}
                  >
                    <Paragraph>{place.fields.description[locale]}</Paragraph>
                  </div>
                )}
              </div>
            </div>
            {place.image && (
              <img
                src={place.image.file[locale]?.url}
                alt={place.image.description[locale]}
                className={css({
                  width: "33%",
                  objectFit: "cover",
                  maxHeight: "500px",
                })}
              />
            )}
          </div>
        ))}
      </div>
    </Flex>
  );
};

export default ConfigScreen;
