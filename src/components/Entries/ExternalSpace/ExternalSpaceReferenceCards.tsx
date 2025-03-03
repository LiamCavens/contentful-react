import { FieldAppSDK } from "@contentful/app-sdk";
import { Flex, Card, Text } from "@contentful/f36-components";
import { useEffect, useState } from "react";
import { EntryProps } from "contentful-management";
import PlaceWithVariants from "./Place/PlaceWithVariants";
import { css } from "emotion";

const EXTERNAL_SPACE_ID = import.meta.env.VITE_SHARED_SPACE_ID;
const ENVIRONMENT_ID = import.meta.env.VITE_SHARED_ENVIRONMENT_ID;
const ACCESS_TOKEN = import.meta.env.VITE_CONTENT_DELIVERY_ACCESS_TOKEN;
const CMA_ACCESS_TOKEN = import.meta.env.VITE_CHANNEL_CMA_ACCESS_TOKEN;

const ExternalSpaceReferenceCards = ({ sdk }: { sdk: FieldAppSDK }) => {
  const [currentEntry, setCurrentEntry] = useState<EntryProps>();
  const [placesData, setPlacesData] = useState<EntryProps[]>([]);
  const [updateKey, setUpdateKey] = useState(0);
  const [linkedVariantIds, setLinkedVariantIds] = useState<string[]>([]);
  const entryId = sdk.ids.entry;
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      const getEntry = await sdk.cma.entry.get({ entryId });
      setCurrentEntry(getEntry);
      await getEntryPlaces(getEntry);
    };

    fetchData();

    const childSysListener = sdk.entry.onSysChanged(() => {
      setUpdateKey((prev) => prev + 1);
    });

    return () => {
      childSysListener();
    };
  }, [sdk, entryId, updateKey]);

  const getEntryPlaces = async (entry: EntryProps) => {
    const places = entry.fields?.places?.[locale] || [];

    const placeIds = places.map((place: any) => {
      return place.sys.urn.split("/").pop();
    });

    const fetchedPlaces = await Promise.all(
      placeIds.map(async (entryId: string) => {
        try {
          const response = await fetch(
            `https://api.contentful.com/spaces/${EXTERNAL_SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${entryId}`,
            {
              headers: {
                Authorization: `Bearer ${CMA_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error(
              `Failed to fetch entry ${entryId}: ${response.statusText}`
            );
            return null;
          }

          return response.json();
        } catch (error) {
          if (error instanceof Error) {
            console.error(`Failed to fetch entry ${entryId}: ${error.message}`);
          } else {
            console.error(`Failed to fetch entry ${entryId}: ${String(error)}`);
          }
          return null;
        }
      })
    );

    const validFetchedPlaces = fetchedPlaces.filter((place) => place !== null);

    // If the place.sys.contentType.sys.id does not equeal "place" or "poidetails" then filter them out
    const filteredPlaces = validFetchedPlaces.filter((place: EntryProps) => {
      const contentType = place.sys.contentType.sys.id;
      return contentType === "place" || contentType === "poi";
    });

    setPlacesData(filteredPlaces);
    setLinkedVariantIds(placeIds);
  };

  return currentEntry ? (
    <Flex flexDirection="column" margin="none" className={css({ gap: "1rem" })}>
      {placesData.map((place, index) => (
        <PlaceWithVariants
          key={index + updateKey}
          sdk={sdk}
          entry={place}
          variantIds={linkedVariantIds}
          parentEntry={currentEntry}
          places={placesData}
        />
      ))}
    </Flex>
  ) : (
    <Card>
      <Text>Loading...</Text>
    </Card>
  );
};

export default ExternalSpaceReferenceCards;
