import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  EntryCard,
  Flex,
  FormControl,
  Heading,
  IconButton,
  Menu,
  ModalConfirm,
  Paragraph,
  TextInput,
} from "@contentful/f36-components";
import { MoreHorizontalIcon as MenuIcon } from "@contentful/f36-icons";
import { ContentfulContentModelTypes } from "../../../../ts/types/ContentfulTypes";
import { camelCaseToCapitalizedWords } from "../../../../ts/utilities/formatStrings";
import { createEntry } from "../../../../ts/utilities/contentful/createEntry";
import { css } from "emotion";
import { useEffect, useState } from "react";
import { EntryProps } from "contentful-management";

import getBGColor from "../../../../ts/utilities/getBGColor";

const EXTERNAL_SPACE_ID = import.meta.env.VITE_SHARED_SPACE_ID;
const ENVIRONMENT_ID = import.meta.env.VITE_SHARED_ENVIRONMENT_ID;
const CMA_ACCESS_TOKEN = import.meta.env.VITE_CHANNEL_CMA_ACCESS_TOKEN;
const BATCH_SIZE = 4; // Number of requests to batch together
const BATCH_DELAY = 1000; // Delay between batches in milliseconds

/**
 * Formats description field from Contentful rich text to plain text
 */
const formatDescription = (description: any): string => {
  if (!description) {
    return "";
  }
  if (typeof description === "string") {
    return description;
  }
  return description.content
    .map((content: any) =>
      content.content.map((content: any) => content.value).join("")
    )
    .join("");
};

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
  const [loadingEntryIds, setLoadingEntryIds] = useState<Set<string>>(
    new Set()
  );
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showCloneConfirm, setShowCloneConfirm] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [filter, setFilter] = useState<string>("App");

  // Variables
  const channels = ["App", "Web", "Print"];
  const locale = sdk.locales.default;
  const contentType = entry.sys.contentType.sys
    .id as ContentfulContentModelTypes;
  // @ts-ignore // library is outdated and status is now fieldStatus
  const fieldStatus = entry.sys.fieldStatus["*"][locale];
  const entryName = entry.fields?.name?.[locale];

  /**
   * Fetch linked variant entries on component mount and when entry changes
   */
  useEffect(() => {
    const fetchLinkedVariants = async () => {
      if (!entry.fields.linkedVariants?.[locale]) return;

      // Get linked variant IDs
      const linkedVariantIds = entry.fields.linkedVariants[locale].map(
        (linkedVariant: { sys: { id: string } }) => linkedVariant.sys.id
      );

      // Mark all IDs as loading
      setLoadingEntryIds(new Set(linkedVariantIds));

      try {
        // Create batches of IDs
        const batches: string[][] = [];
        for (let i = 0; i < linkedVariantIds.length; i += BATCH_SIZE) {
          batches.push(linkedVariantIds.slice(i, i + BATCH_SIZE));
        }

        // Process each batch with delay between batches
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];

          // Process current batch in parallel and update UI as each entry loads
          const batchPromises = batch.map(async (id) => {
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
                throw new Error(
                  `Failed to fetch entry ${id}: ${response.statusText}`
                );
              }

              const entryData = await response.json();

              // Update state with the new entry
              setLinkedVariantEntries((prev) => [...prev, entryData]);

              // Remove this ID from loading set
              setLoadingEntryIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });

              return entryData;
            } catch (error) {
              console.error(`Error fetching entry ${id}:`, error);

              // Remove this ID from loading set even if error
              setLoadingEntryIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });

              return null;
            }
          });

          await Promise.all(batchPromises);

          // Add delay between batches if not the last batch
          if (i < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
          }
        }
      } catch (error) {
        console.error("Error fetching linked variants:", error);
        sdk.notifier.error("Failed to load some linked variants.");
      }
    };

    fetchLinkedVariants();

    // Clear entries when component is unmounted
    return () => {
      setLinkedVariantEntries([]);
      setLoadingEntryIds(new Set());
    };
  }, [sdk, entry, locale]);

  /**
   * Find active variant ID for this place
   * A place can only have one active variant at a time
   */
  const getActiveVariantForPlace = (): string | null => {
    if (!parentEntry.fields.places?.[locale]) return null;

    // Get all linked variant IDs for this place
    const placeVariantIds = linkedVariantEntries.map(
      (variant) => variant.sys.id
    );

    // Find if any of the current place's variants are in the parent's places array
    const activeVariant = parentEntry.fields.places[locale].find(
      (place: any) => {
        const placeId = place.sys.urn.split("/").pop();
        return placeVariantIds.includes(placeId);
      }
    );

    return activeVariant ? activeVariant.sys.urn.split("/").pop() : null;
  };

  /**
   * Updates the linked variants in the parent entry
   * Only one variant per place can be active at a time
   */
  const updateLinkedVariants = async (selectedVariant: EntryProps) => {
    try {
      const selectedVariantId = selectedVariant.sys.id;
      const newUrn = `crn:contentful:::content:spaces/${EXTERNAL_SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${selectedVariantId}`;
      const currentPlaces = parentEntry.fields.places?.[locale] || [];

      // Check if this variant is already selected
      const activeVariantId = getActiveVariantForPlace();
      const isVariantSelected = activeVariantId === selectedVariantId;

      let updatedPlaces;

      if (isVariantSelected) {
        // If already selected, deselect it
        updatedPlaces = currentPlaces.filter(
          (place: any) => place.sys.urn !== newUrn
        );
      } else {
        // First, remove any other variants from the same place
        const allVariantIds = linkedVariantEntries.map((variant) => {
          return `crn:contentful:::content:spaces/${EXTERNAL_SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${variant.sys.id}`;
        });

        // Filter out any variants that belong to this place
        const otherPlaces = currentPlaces.filter(
          (place: any) => !allVariantIds.includes(place.sys.urn)
        );

        // Add the new selected variant
        const newReferencesVariant = {
          sys: {
            type: "ResourceLink",
            linkType: "Contentful:Entry",
            urn: newUrn,
          },
        };

        updatedPlaces = [...otherPlaces, newReferencesVariant];
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

      sdk.notifier.success("Updated linked variant successfully!");
    } catch (error) {
      console.error("Error updating linked variants:", error);
      sdk.notifier.error("Failed to update linked variant.");
    }
  };

  /**
   * Clones a variant and links it to the current place
   */
  const cloneVariant = async (selectedVariant: EntryProps) => {
    try {
      const mutatedVariantForApp = {
        ...selectedVariant,
        fields: {
          name: {
            [locale]: cloneName,
          },
          description: {
            [locale]: selectedVariant.fields.description[locale],
          },
          ...(selectedVariant.fields.media && {
            media: {
              [locale]: selectedVariant.fields.media[locale],
            },
          }),
          ...(selectedVariant.fields.migrationLocked && {
            migrationLocked: {
              [locale]: selectedVariant.fields.migrationLocked[locale],
            },
          }),
        },
      };

      const clonedVariant = await createEntry(
        mutatedVariantForApp,
        "poiVariantApp"
      );

      if (!clonedVariant) {
        throw new Error("Failed to create cloned variant");
      }

      const newLinkedVariantReference = {
        sys: {
          type: "Link",
          linkType: "Entry",
          id: clonedVariant.sys.id,
        },
      };

      const existingLinkedVariants =
        entry.fields.linkedVariants?.[locale] || [];
      const updatedLinkedVariants = [
        ...existingLinkedVariants,
        newLinkedVariantReference,
      ];

      const response = await fetch(
        `https://api.contentful.com/spaces/${entry.sys.space.sys.id}/environments/${ENVIRONMENT_ID}/entries/${entry.sys.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${CMA_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "X-Contentful-Version": entry.sys.version.toString(),
            "X-Contentful-Content-Type": entry.sys.contentType.sys.id,
          },
          body: JSON.stringify({
            fields: {
              ...entry.fields,
              linkedVariants: { [locale]: updatedLinkedVariants },
            },
            sys: {
              ...entry.sys,
              updatedBy: {
                id: sdk.user.sys.id,
                linkType: "User",
                type: "Link",
              },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update linkedVariants: ${response.statusText}`
        );
      }

      await sdk.cma.entry.update({ entryId: entry.sys.id }, entry);

      sdk.notifier.success("Cloned variant successfully!");
    } catch (error) {
      console.error("Error cloning variant:", error);
      // sdk.notifier.error("Failed to clone variant.");
    } finally {
      window.location.reload();
    }
  };

  /**
   * Removes the place and its variants from the parent entry
   */
  const removePlaceAndVariants = async () => {
    try {
      const linkedVariantEntryIds = linkedVariantEntries.map(
        (variant) => variant.sys.id
      );

      const updatedPlaces = parentEntry.fields.places[locale].filter(
        (place: any) => {
          const placeId = place.sys.urn.split("/").pop();
          return (
            placeId !== entry.sys.id && !linkedVariantEntryIds.includes(placeId)
          );
        }
      );

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

      sdk.notifier.success("Removed place and variants successfully!");
    } catch (error) {
      console.error("Error removing place and variants:", error);
      sdk.notifier.error("Failed to remove place and variants.");
    }
  };

  // Filter variants based on selected channel
  const filteredVariants = linkedVariantEntries.filter((linkedVariant) => {
    const variantType = linkedVariant.sys.contentType.sys.id;
    if (filter === "App" && variantType === "poiVariantApp") return true;
    if (filter === "Web" && variantType === "poiVariantWeb") return true;
    if (filter === "Print" && variantType === "poiVariantPrint") return true;
    return false;
  });

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
                <Menu>
                  <Menu.Trigger>
                    <IconButton
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                      }}
                      variant="secondary"
                      icon={<MenuIcon />}
                      aria-label="toggle menu"
                    />
                  </Menu.Trigger>
                  <Menu.List>
                    <Menu.Item
                      onClick={async (e: React.MouseEvent) => {
                        e.stopPropagation();
                        showRemoveConfirm
                          ? setShowRemoveConfirm(false)
                          : setShowRemoveConfirm(true);
                      }}
                    >
                      Remove
                    </Menu.Item>
                  </Menu.List>
                </Menu>
                <ModalConfirm
                  intent="positive"
                  isShown={showRemoveConfirm}
                  onCancel={() => {
                    setShowRemoveConfirm(false);
                  }}
                  onConfirm={async () => {
                    setShowRemoveConfirm(false);
                    removePlaceAndVariants();
                  }}
                >
                  <Paragraph>Remove this reference?</Paragraph>
                  <Paragraph>
                    Note: Linked variants will be unselected automatically.
                  </Paragraph>
                </ModalConfirm>
              </div>
            </div>
          }
        >
          <div
            className={css({
              display: "flex",
              gap: "0.5rem",
            })}
          >
            {channels.map((type) => (
              <Button
                key={type}
                onClick={() => setFilter(type)}
                className={
                  filter === type
                    ? css({ backgroundColor: "#0070f3", color: "#fff" })
                    : ""
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              paddingTop: "0.5rem",
            })}
          >
            {filteredVariants.length > 0 ? (
              filteredVariants.map((linkedVariant: EntryProps) => (
                <div
                  key={linkedVariant.sys.id}
                  className={css({
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                  })}
                >
                  <div
                    className={css({
                      display: "flex",
                      justifyContent: "space-between",
                      flexDirection: "column",
                      flex: 1,
                      border: "1px solid #CFD9E0",
                      borderRadius: "6px",
                      padding: "1rem",
                      gap: "1rem",
                      backgroundColor: variantIds.includes(linkedVariant.sys.id)
                        ? "#DFF0D8"
                        : "transparent",
                    })}
                  >
                    <Heading
                      as="h4"
                      className={css({
                        margin: "0",
                      })}
                    >
                      {linkedVariant.fields?.name?.[locale] ||
                        "Unnamed Variant"}
                    </Heading>

                    <div>
                      <Paragraph>
                        {formatDescription(
                          linkedVariant.fields?.description?.[locale]
                        )}
                      </Paragraph>
                      {variantIds.includes(linkedVariant.sys.id) && (
                        <Badge variant="positive">Active</Badge>
                      )}
                    </div>
                  </div>
                  <div
                    className={css({
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    })}
                  >
                    {filter !== "Print" && (
                      <Button
                        className={css({
                          width: "100px",
                        })}
                        variant="secondary"
                        onClick={() => updateLinkedVariants(linkedVariant)}
                      >
                        {variantIds.includes(linkedVariant.sys.id)
                          ? "Deselect"
                          : "Select"}
                      </Button>
                    )}
                    {filter === "Print" && (
                      <Button
                        className={css({
                          width: "100px",
                        })}
                        variant="secondary"
                        onClick={() => {
                          setShowCloneConfirm(true);
                          setCloneName(
                            linkedVariant.fields?.name?.[locale] || ""
                          );
                        }}
                      >
                        Clone
                      </Button>
                    )}
                    <ModalConfirm
                      intent="positive"
                      isShown={showCloneConfirm}
                      onCancel={() => {
                        setShowCloneConfirm(false);
                        setCloneName("");
                      }}
                      onConfirm={async () => {
                        setShowCloneConfirm(false);
                        cloneVariant(linkedVariant);
                      }}
                    >
                      <Paragraph>Clone this reference?</Paragraph>
                      <FormControl>
                        <FormControl.Label>Clone Name</FormControl.Label>
                        <TextInput
                          value={cloneName}
                          type="text"
                          name="text"
                          placeholder="Name"
                          onChange={(e) => setCloneName(e.target.value)}
                        />
                        <FormControl.HelpText>
                          Provide a name for cloned version
                        </FormControl.HelpText>
                      </FormControl>
                      <Paragraph>
                        Note: Clone will be created as POI Variant App and and
                        will be linked to current POI
                      </Paragraph>
                    </ModalConfirm>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Show loading indicators for entries still being fetched */}
                {Array.from(loadingEntryIds)
                  .filter((id) => {
                    const matchesFilter =
                      filter === "App" ||
                      filter === "Web" ||
                      filter === "Print";
                    return matchesFilter && loadingEntryIds.has(id);
                  })
                  .map((id) => (
                    <div
                      key={id}
                      className={css({
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        border: "1px solid #CFD9E0",
                        borderRadius: "6px",
                        padding: "1rem",
                      })}
                    >
                      <EntryCard isLoading />
                    </div>
                  ))}
                {loadingEntryIds.size === 0 && (
                  <Paragraph>No {filter} linked variants</Paragraph>
                )}
              </>
            )}
          </div>
        </AccordionItem>
      </Accordion>
    </Flex>
  );
};

export default PlaceWithVariants;
