import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Flex,
  EntryCard
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { css } from "emotion";
import { useEffect, useState, useCallback } from "react";
import PlaceVarients from "../PlaceVarients";

interface AppInstallationParameters {}

interface PlaceVariant {
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

const Place = ({ fieldId, sdk }: { fieldId: string; sdk: FieldAppSDK }) => {
  const [placeVarient, setPlaceVariant] = useState<PlaceVariant>();
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      const field = await sdk.space.getEntry(fieldId);

      console.log("Liam: field");
      console.log(field);

      const mappedPlaceVariant = {
        fields: field.fields,
      } as PlaceVariant;

      setPlaceVariant(mappedPlaceVariant);
    };

    fetchData();
  }, [sdk, fieldId]);

  return (
    <Flex flexDirection="column" margin="none">
        {placeVarient && (
          <EntryCard
            status="published"
            contentType="Author"
            title="John Doe"
            description="Research and recommendations for modern stack websites."
            withDragHandle
          />
        )}
    </Flex>
  );
};

export default Place;
