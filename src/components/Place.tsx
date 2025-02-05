import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Flex,
  Form,
  Heading,
  Paragraph,
  Select,
  Tabs,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { css } from "emotion";
import { useEffect, useState, useCallback } from "react";
import PlaceVarients from "../components/PlaceVarients";

interface AppInstallationParameters {}

interface Place {
  fields: {
    name: { [locale: string]: string };
    websiteUrl?: { [locale: string]: string };
    description?: { [locale: string]: string };
    image?: { [locale: string]: { sys: { id: string } } };
    price?: { [locale: string]: string };
    openingHours?: { [locale: string]: string };
    linkedVariants?: any;
  };
  fetchedImage: {
    file: { [locale: string]: { url: string } };
    description: { [locale: string]: string };
  } | null;
  metadata: {
    tags: { sys: { id: string }[] };
  };
}

const Place = ({
  entryID,
  sdk,
}: {
  entryID: string;
  sdk: ConfigAppSDK;
}) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [place, setPlace] = useState<Place>();

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
      return imageAsset.fields;
    } catch (error) {
      console.error(`Error fetching image asset with ID ${id}:`, error);
      return null;
    }
  };

  const formatUrl = (url: string) => {
    return url.replace(/(https?:\/\/)?(www\.)?/, "");
  };

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);

    const fetchData = async () => {
      const params = await sdk.app.getParameters();
      setParameters(params || {});

      const getEntry = await sdk.space.getEntry(entryID);

      const imageId = getEntry.fields.image?.[locale]?.sys?.id;
      const image = imageId ? await getImageUrl(imageId) : null;

      const mappedPlace = {
        fields: getEntry.fields,
        fetchedImage: image,
      } as Place;

      setPlace(mappedPlace);
      await sdk.app.setReady();
    };

    fetchData();
  }, [sdk, onConfigure]);

  return (
    <Flex flexDirection="column" className={css({ margin: "80px" })}>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        })}
      >
            {place && (
            <Tabs.Panel
              key={place.fields.name[locale] + "-panel"}
              id={place.fields.name[locale]}
              className={css({ padding: "1rem" })}
            >
              <div>
              <div
                className={css({
                backgroundColor: "#fff",
                padding: "1rem",
                display: "flex",
                })}
              >
                <div
                className={css({
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  marginRight: "1rem",
                })}
                >
                <div
                  className={css({
                  display: "flex",
                  flexDirection: "row",
                  flex: 1,
                  justifyContent: "space-between",
                  })}
                >
                  <div
                  className={css({
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    justifyContent: "space-between",
                    ":last-child": {
                    margin: "0",
                    },
                  })}
                  >
                  <Heading>{place.fields.name[locale]}</Heading>
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
                    <Select.Option>Eating</Select.Option>
                    <Select.Option>Non Eating</Select.Option>
                    </Select>
                    <Select
                    id="optionSelect-controlled"
                    name="optionSelect-controlled"
                    value="Status"
                    >
                    <Select.Option>Status Uno</Select.Option>
                    <Select.Option>Status Dos</Select.Option>
                    </Select>
                  </Form>
                  <Paragraph>£25</Paragraph>
                  {place.fields.price && (
                    <Paragraph>{place.fields.price[locale]}</Paragraph>
                  )}
                  {place.fields.openingHours && (
                    <Paragraph>
                    {place.fields.openingHours[locale]}
                    </Paragraph>
                  )}
                  {place.fields.websiteUrl && (
                    <a
                    href={place.fields.websiteUrl[locale]}
                    target="_blank"
                    rel="noopener noreferrer"
                    >
                    {formatUrl(place.fields.websiteUrl[locale])}
                    </a>
                  )}
                  </div>
                  <div
                  className={css({
                    width: "50%",
                    border: "1px solid black",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  })}
                  >
                  MAP PLACEHOLDER
                  </div>
                </div>
                <div className={css({ display: "flex", flex: "1" })}>
                  {place.fields.description && (
                  <div
                    className={css({
                    backgroundColor: "#f0f0f0",
                    padding: "2rem",
                    marginTop: "1rem",
                    border: "1px solid #ccc",
                    })}
                  >
                    <Paragraph>
                    {place.fields.description[locale]}
                    </Paragraph>
                  </div>
                  )}
                </div>
                </div>
                {place.fetchedImage && (
                <img
                  src={place.fetchedImage.file[locale]?.url}
                  alt={place.fetchedImage.description[locale]}
                  className={css({
                  width: "33%",
                  objectFit: "cover",
                  maxHeight: "500px",
                  })}
                />
                )}
              </div>
              {place.fields.linkedVariants && (
                <PlaceVarients
                linkedVariants={place.fields.linkedVariants[locale]}
                locale={locale}
                sdk={sdk}
                />
              )}
              </div>
            </Tabs.Panel>
            )}
      </div>
    </Flex>
  );
};

export default Place;
