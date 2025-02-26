import { FieldAppSDK } from "@contentful/app-sdk";
import { Flex, Card, Text } from "@contentful/f36-components";
import { useEffect, useState } from "react";

const EXTERNAL_SPACE_ID = import.meta.env.VITE_SHARED_SPACE_ID;
const ENVIRONMENT_ID = import.meta.env.VITE_SHARED_ENVIRONMENT_ID;
const CMA_ACCESS_TOKEN = import.meta.env.VITE_CHANNEL_CMA_ACCESS_TOKEM;

const ExternalSpaceReferenceCards = ({ sdk }: { sdk: FieldAppSDK }) => {
  const [placesData, setPlacesData] = useState<any[]>([]);
  const entryId = sdk.ids.entry;
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      const getEntry = await sdk.cma.entry.get({ entryId });
      await getEntryPlaces(getEntry);
    };

    fetchData();
  }, [sdk, entryId]);

  const getEntryPlaces = async (entry: any) => {
    const places = entry.fields?.places?.[locale] || [];

    console.log('Liam: places');
    console.log(places);

    const placeIds = places.map((place: any) => {
      return place.sys.urn.split("/").pop();
    });

    console.log('Liam: placeIds');
    console.log(placeIds);

    const fetchedPlaces = await Promise.all(
      placeIds.map(async (entryId: string) => {
        const response = await fetch(
          `https://cdn.contentful.com/spaces/${EXTERNAL_SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${entryId}`,
          {
            headers: {
              Authorization: `Bearer ${CMA_ACCESS_TOKEN}`,
            },
          }
        );
        return response.json();
      })
    );

    console.log('Liam: fetchedPlaces');
    console.log(fetchedPlaces);

    setPlacesData(fetchedPlaces);
  };

  return (
    <Flex flexDirection="column" margin="none">
      {placesData.map((place, index) => (
        <Card key={place.sys.id + index}>
          <Text fontSize="fontSizeXl">
            {place.fields?.name?.[locale] || "Unnamed Place"}
          </Text>
        </Card>
      ))}
    </Flex>
  );
};

export default ExternalSpaceReferenceCards;
