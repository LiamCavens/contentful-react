import { FieldAppSDK } from "@contentful/app-sdk";
import { Flex, Card, Text } from "@contentful/f36-components";
import { useEffect, useState, useCallback } from "react";
import { EntryProps } from "contentful-management";
import PlaceWithVariants from "./Place/PlaceWithVariants";
import { css } from "emotion";

const EXTERNAL_SPACE_ID = import.meta.env.VITE_SHARED_SPACE_ID;
const ENVIRONMENT_ID = import.meta.env.VITE_SHARED_ENVIRONMENT_ID;
const CMA_ACCESS_TOKEN = import.meta.env.VITE_CHANNEL_CMA_ACCESS_TOKEN;

const MAX_CONCURRENT_REQUESTS = 5; // Controls API request batching

const ExternalSpaceReferenceCards = ({ sdk }: { sdk: FieldAppSDK }) => {
  const [currentEntry, setCurrentEntry] = useState<EntryProps | null>(null);
  const [placesData, setPlacesData] = useState<EntryProps[]>([]);
  const [updateKey, setUpdateKey] = useState(0);
  const [linkedVariantIds, setLinkedVariantIds] = useState<string[]>([]);
  const entryId = sdk.ids.entry;
  const locale = "en-US";

  /**
   * Fetches the current entry and its related places
   */
  const fetchData = useCallback(async () => {
    try {
      const getEntry = await sdk.cma.entry.get({ entryId });
      setCurrentEntry(getEntry);
      await getEntryPlaces(getEntry);
    } catch (error) {
      console.error("Error fetching entry data:", error);
    }
  }, [entryId, sdk.cma]);

  useEffect(() => {
    fetchData();

    const unsubscribeSysListener = sdk.entry.onSysChanged(() => {
      setUpdateKey((prev) => prev + 1);
    });

    return () => {
      unsubscribeSysListener();
    };
  }, [fetchData, sdk.entry]);

  /**
   * Batches API requests to avoid overloading the API.
   */
  const batchFetch = async (ids: string[], batchSize: number) => {
    const results: EntryProps[] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (id) => {
          try {
            const response = await fetch(
              `https://api.contentful.com/spaces/${EXTERNAL_SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${CMA_ACCESS_TOKEN}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              console.warn(`Failed to fetch entry ${id}: ${response.statusText}`);
              return null;
            }

            return response.json();
          } catch (error) {
            console.error(`Error fetching entry ${id}:`, error);
            return null;
          }
        })
      );

      // Append valid entries to results
      results.push(...batchResults.filter((entry): entry is EntryProps => entry !== null));
    }

    return results;
  };

  /**
   * Fetches related places data from Contentful with throttled requests
   * @param entry - The current entry
   */
  const getEntryPlaces = async (entry: EntryProps) => {
    try {
      const places = entry.fields?.places?.[locale] || [];

      if (!Array.isArray(places) || places.length === 0) {
        setPlacesData([]);
        setLinkedVariantIds([]);
        return;
      }

      const placeIds = places.map((place: any) =>
        place.sys.urn.split("/").pop()
      );

      const fetchedPlaces = await batchFetch(placeIds, MAX_CONCURRENT_REQUESTS);

      // Filter out invalid responses and check content type
      const validPlaces = fetchedPlaces.filter(
        (place) => ["place", "poi"].includes(place.sys.contentType.sys.id)
      );

      setPlacesData(validPlaces);
      setLinkedVariantIds(placeIds);
    } catch (error) {
      console.error("Error fetching places data:", error);
    }
  };

  return currentEntry ? (
    <Flex flexDirection="column" margin="none" className={css({ gap: "1rem" })}>
      {placesData.map((place) => (
        <PlaceWithVariants
          key={place.sys.id + updateKey}
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
