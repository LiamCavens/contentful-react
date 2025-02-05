import { ConfigAppSDK, EditorAppSDK } from "@contentful/app-sdk";
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
import PlaceVarients from "../PlaceVarients";

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
  sdk: ConfigAppSDK | EditorAppSDK;
}) => {
  const [place, setPlace] = useState<Place>();

  const locale = "en-US";

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
    const fetchData = async () => {
      const getEntry = await sdk.space.getEntry(entryID);
      const imageId = getEntry.fields.image?.[locale][0]?.sys?.id;
      const image = imageId ? await getImageUrl(imageId) : null;

      const mappedPlace = {
        fields: getEntry.fields,
        fetchedImage: image,
      } as Place;

      setPlace(mappedPlace);
    };

    fetchData();
  }, [sdk, entryID]);

  return (
    <Flex flexDirection="column" margin="none">
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        })}
      >
        {place && (
          <div
            key={place.fields.name[locale] + "-panel"}
            id={place.fields.name[locale]}
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
                          maxWidth: "100%",
                          paddingRight: "1rem",
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
          </div>
        )}
      </div>
    </Flex>
  );
};

export default Place;
