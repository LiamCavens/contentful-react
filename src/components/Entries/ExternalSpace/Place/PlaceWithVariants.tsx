import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Accordion,
  AccordionItem,
  Flex,
  Badge,
  Heading,
  Paragraph,
} from "@contentful/f36-components";
import { ContentfulContentModelTypes } from "../../../../ts/types/ContentfulTypes";
import { camelCaseToCapitalizedWords } from "../../../../ts/utilities/formatStrings";
import { css } from "emotion";
import { useEffect, useState } from "react";
import { EntryProps } from "contentful-management";

import getBGColor from "../../../../ts/utilities/getBGColor";

const EXTERNAL_SPACE_ID = import.meta.env.VITE_SHARED_SPACE_ID;
const ENVIRONMENT_ID = import.meta.env.VITE_SHARED_ENVIRONMENT_ID;
const CMA_ACCESS_TOKEN = import.meta.env.VITE_CHANNEL_CMA_ACCESS_TOKEN;

const PlaceWithVariants = ({
  sdk,
  entry,
  variantIds,
  parentEntry,
  places,
}: {
  sdk: FieldAppSDK;
  entry: EntryProps;
  variantIds: string[];
  parentEntry: EntryProps;
  places: EntryProps[];
}) => {
  const [linkedVariantEntries, setLinkedVariantEntries] = useState<
    EntryProps[]
  >([]);

  const locale = "en-US";
  const contentType = entry.sys.contentType.sys
    .id as ContentfulContentModelTypes;
  // @ts-ignore // library is outdated and status is now fieldStatus
  const fieldStatus = entry.sys.fieldStatus["*"][locale];
  const entryName = entry.fields?.name?.[locale];

  useEffect(() => {
    const fetchData = async () => {
      // for each id inside entry.fields.linkedVariants[locale].map((variant: EntryProps) => variant.sys.id)
      // fetch the entry from the sdk and push it to linkedVariantEntries
      if (!entry.fields.linkedVariants?.[locale]) return;
      const linkedVariants = await Promise.all(
        entry.fields.linkedVariants?.[locale].map(
          async (linkedVariantId: { sys: { id: string } }) => {
            const response = await fetch(
              `https://api.contentful.com/spaces/${EXTERNAL_SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${linkedVariantId.sys.id}`,
              {
                headers: {
                  Authorization: `Bearer ${CMA_ACCESS_TOKEN}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch entry ${linkedVariantId}: ${response.statusText}`
              );
            }

            return response.json();
          }
        )
      );
      setLinkedVariantEntries(linkedVariants);
    };

    fetchData();
  }, [sdk, entry]);

  const updateLinkedVariants = async (selectedVariant: EntryProps) => {
    const newUrn = `crn:contentful:::content:spaces/${EXTERNAL_SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${selectedVariant.sys.id}`;
    const currentPlaces = parentEntry.fields.places?.[locale] || [];
    const newReferencesVariant = {
      sys: {
        type: "ResourceLink",
        linkType: "Contentful:Entry",
        urn: newUrn,
      },
    };

    let updatedPlaces;
    const isVariantSelected = currentPlaces.some(
      (place: any) => place.sys.urn === newUrn
    );

    if (isVariantSelected) {
      updatedPlaces = currentPlaces.filter(
        (place: any) => place.sys.urn !== newUrn
      );
    } else {
      updatedPlaces = [...currentPlaces, newReferencesVariant];
    }

    const updatedParentEntryData = {
      ...parentEntry,
      fields: {
        ...parentEntry.fields,
        places: {
          [locale]: updatedPlaces,
        },
      },
    };

    await sdk.cma.entry.update(
      { entryId: parentEntry.sys.id },
      updatedParentEntryData
    );
  };

  return (
    <Flex flexDirection="column" margin="none">
      <Accordion>
        <AccordionItem
          className={css({
            border: "2px solid #CFD9E0",
            borderRadius: "6px",
            "& h2 > button:first-of-type": {
              backgroundColor: `${getBGColor(contentType)} !important`,
            },
          })}
          title={
            <div
              className={css({
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
                backgroundColor: getBGColor(contentType),
              })}
            >
              <div>
                <Heading
                  className={css({
                    margin: 0,
                    padding: 0,
                  })}
                  as="h3"
                  margin="none"
                >{`${camelCaseToCapitalizedWords(
                  contentType
                )} -  ${entryName}`}</Heading>
              </div>
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                })}
              >
                {fieldStatus && (
                  <Badge
                    variant={
                      fieldStatus === "published"
                        ? "positive"
                        : fieldStatus === "changed"
                        ? "warning"
                        : "negative"
                    }
                  >
                    {fieldStatus}
                  </Badge>
                )}
              </div>
            </div>
          }
        >
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              paddingTop: "0.5rem",
            })}
          >
            {linkedVariantEntries.length > 0 ? (
              linkedVariantEntries.map((linkedVariant: EntryProps) => (
                <div
                  key={linkedVariant.sys.id}
                  className={css({
                    display: "flex",
                    justifyContent: "space-between",
                    border: "1px solid #CFD9E0",
                    borderRadius: "6px",
                    padding: "1rem",
                    backgroundColor: variantIds.includes(linkedVariant.sys.id)
                      ? "#DFF0D8" // Light green highlight
                      : "transparent",
                  })}
                  onClick={() => updateLinkedVariants(linkedVariant)}
                >
                  <Heading as="h4">
                    {linkedVariant.fields?.name?.[locale] || "Unnamed Variant"}
                  </Heading>
                  <div>
                    {variantIds.includes(linkedVariant.sys.id) && (
                      <Badge variant="positive">Active</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <Paragraph>No linked variants</Paragraph>
            )}
          </div>
        </AccordionItem>
      </Accordion>
    </Flex>
  );
};

export default PlaceWithVariants;
