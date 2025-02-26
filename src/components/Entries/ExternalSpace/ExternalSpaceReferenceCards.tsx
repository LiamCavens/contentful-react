import { FieldAppSDK } from "@contentful/app-sdk";
import { Flex, Card, Text } from "@contentful/f36-components";
import { useEffect, useState } from "react";
import { EntryProps } from "contentful-management";
import PlaceWithVariants from "./Place/PlaceWithVariants";
import { css } from "emotion";

const EXTERNAL_SPACE_ID = import.meta.env.VITE_SHARED_SPACE_ID;
const ENVIRONMENT_ID = import.meta.env.VITE_SHARED_ENVIRONMENT_ID;
const ACCESS_TOKEN = import.meta.env.VITE_CONTENT_DELIVERY_ACCESS_TOKEN;
const CMA_ACCESS_TOKEN = import.meta.env.VITE_CHANNEL_CMA_ACCESS_TOKEM;

const ExternalSpaceReferenceCards = ({ sdk }: { sdk: FieldAppSDK }) => {
  const [placesData, setPlacesData] = useState<any[]>([]);
  const [linkedVariantIds, setLinkedVariantIds] = useState<string[]>([]);
  const entryId = sdk.ids.entry;
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      const getEntry = await sdk.cma.entry.get({ entryId });
      await getEntryPlaces(getEntry);
    };

    fetchData();
  }, [sdk, entryId]);

  const getEntryPlaces = async (entry: EntryProps) => {
    const places = entry.fields?.places?.[locale] || [];

    const placeIds = places.map((place: any) => {
      return place.sys.urn.split("/").pop();
    });

    const fetchedPlaces = await Promise.all(
      placeIds.map(async (entryId: string) => {
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
          throw new Error(
            `Failed to fetch entry ${entryId}: ${response.statusText}`
          );
        }

        return response.json();
      })
    );

    // If for each place in fetchedPLaces, get the sys.id, and if that id is in linkedVariantIds, then we remove that opject from the fetchedPlaces array
    const filteredPlaces = fetchedPlaces.filter((place: EntryProps) => {
      return !linkedVariantIds.flat().includes(place.sys.id);
    });

    setPlacesData(filteredPlaces);
    setLinkedVariantIds(placeIds);
  };

  return (
    <Flex
      flexDirection="column"
      margin="none"
      className={css({ gap: "1rem" })}
    >
      {placesData.map((place, index) => (
        <PlaceWithVariants
          key={index}
          sdk={sdk}
          entry={place}
          variantIds={linkedVariantIds}
        />
      ))}
    </Flex>
  );
};

export default ExternalSpaceReferenceCards;
