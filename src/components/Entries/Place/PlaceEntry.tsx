import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Card,
  Flex,
  Menu,
  Badge,
  Heading,
  Paragraph,
  IconButton,
} from "@contentful/f36-components";
import { MoreHorizontalIcon as MenuIcon } from "@contentful/f36-icons";
// Currently commented out as it can be added back in later
import { Image } from "@contentful/f36-image";
import { css } from "emotion";
import { useEffect, useState } from "react";
import {
  EntityStatus,
  ContentfulContentModelTypes,
} from "../../../ts/types/ContentfulTypes";
import { camelCaseToCapitalizedWords } from "../../../ts/utilities/formatStrings";
import getBGColor from "../../../ts/utilities/getBGColor";
import { removeReference } from "../../../ts/utilities/contentful/removeReference";

interface PlaceEntry {
  fields: {
    name: { [locale: string]: string };
    websiteUrl?: { [locale: string]: string };
    description?: { [locale: string]: string };
    image?: { [locale: string]: { sys: { id: string } } };
    price?: { [locale: string]: string };
    openingHours?: { [locale: string]: string };
    linkedItems?: { [locale: string]: { sys: { id: string }[] } };
  };
  sys: {
    id: string;
    fieldStatus: { "*": { [locale: string]: EntityStatus } };
    contentType: { sys: { id: ContentfulContentModelTypes } };
  };
  image: {
    file: { [locale: string]: { url: string } };
    description: { [locale: string]: string };
  } | null;
  metadata: {
    tags: { sys: { id: string }[] };
  };
  linkedItems?: string[];
}

const PlaceEntry = ({
  entryId,
  sdk,
  showImages,
  depth = 0,
  parentId,
  field
}: {
  entryId: string;
  sdk: FieldAppSDK;
  showImages?: boolean;
  depth?: number;
  parentId: string;
  field: string;
}) => {
  const [place, setPlace] = useState<PlaceEntry>();
  const locale = "en-US";

  const getImageUrl = async (id: string) => {
    try {
      const imageAsset = await sdk.cma.asset.get({ assetId: id });
      return imageAsset.fields;
    } catch (error) {
      console.error(`Error fetching image asset with ID ${id}:`, error);
      return null;
    }
  };

  const formatUrl = (url: string) => {
    return url.replace(/(https?:\/\/)?(www\.)?/, "");
  };

  const formatDescription = (description: any) => {
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

  useEffect(() => {
    const fetchData = async () => {
      const getEntry = await sdk.cma.entry.get({ entryId });
      const imageId = getEntry.fields.image?.[locale][0]?.sys?.id;
      const image = imageId ? await getImageUrl(imageId) : null;

      const mappedPlace = {
        fields: getEntry.fields,
        image: image,
        sys: getEntry.sys,
        metadata: getEntry.metadata,
        linkedItems: getEntry.fields.linkedItems?.[locale]?.map(
          (item: any) => item.sys.id
        ),
      } as unknown as PlaceEntry;

      setPlace(mappedPlace);
    };

    fetchData();
  }, [sdk, entryId]);

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
          <Card
            className={css({
              marginBottom: "1rem",
              padding: "0",
            })}
          >
            <div
              className={css({
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem",
                borderBottom: "1px solid #e5e5e5",
                backgroundColor: getBGColor(place?.sys?.contentType?.sys?.id),
              })}
            >
              <div>
                <Heading
                  className={css({
                    margin: 0,
                  })}
                  as="h3"
                >{`${camelCaseToCapitalizedWords(
                  place?.sys?.contentType?.sys?.id
                )} -  ${place.fields?.name?.[locale]}`}</Heading>
              </div>
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                })}
              >
                {place?.sys?.fieldStatus["*"][locale] && (
                  <Badge
                    variant={
                      place?.sys?.fieldStatus["*"][locale] === "published"
                        ? "positive"
                        : place?.sys?.fieldStatus["*"][locale] === "changed"
                        ? "warning"
                        : "negative"
                    }
                  >
                    {place?.sys?.fieldStatus["*"][locale]}
                  </Badge>
                )}
                <Menu>
                  <Menu.Trigger>
                    <IconButton
                      variant="secondary"
                      icon={<MenuIcon />}
                      aria-label="toggle menu"
                    />
                  </Menu.Trigger>
                  <Menu.List>
                    <Menu.Item
                      onClick={async (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (parentId && entryId) {
                          await removeReference(
                            sdk,
                            parentId,
                            "linkedVariants",
                            entryId
                          );
                        }
                      }}
                    >
                      Remove
                    </Menu.Item>
                  </Menu.List>
                </Menu>
              </div>
            </div>
            <div
              className={css({
                padding: "1rem",
                cursor: "pointer",
              })}
              onClick={() => {
                sdk.navigator.openEntry(entryId, {
                  slideIn: true,
                });
              }}
            >
              <div
                className={css({
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                })}
              >
                <div>
                  <Paragraph>
                    {formatDescription(place.fields?.description?.[locale])}
                  </Paragraph>
                </div>
                {place?.image &&
                  place.image.file?.[locale].url &&
                  showImages && (
                    <Image
                      className={css({
                        maxWidth: "100px",
                      })}
                      src={place.image.file[locale].url}
                      alt={place.image.description[locale]}
                      height="100px"
                      width="100px"
                    />
                  )}
              </div>
            </div>
            {place?.linkedItems &&
              place.linkedItems.length > 0 &&
              depth === 0 && (
                <div
                  className={css({
                    padding: "1rem",
                    borderTop: "1px solid #e5e5e5",
                  })}
                >
                  <ul>
                    {place.linkedItems.map((itemId) => (
                      <PlaceEntry
                        key={itemId}
                        entryId={itemId}
                        parentId={entryId}
                        sdk={sdk}
                        depth={depth + 1}
                        field={field}
                      />
                    ))}
                  </ul>
                </div>
              )}
          </Card>
        )}
      </div>
    </Flex>
  );
};

export default PlaceEntry;
