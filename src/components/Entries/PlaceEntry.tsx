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
import { Image } from "@contentful/f36-image";
import { css } from "emotion";
import { useEffect, useState } from "react";
import { EntityStatus } from "../../ts/types/ContentfulTypes";
import { camelCaseToCapitalizedWords } from "../../ts/utilities/formatStrings";

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
    contentType: { sys: { id: string } };
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
  depth = 0,
}: {
  entryId: string;
  sdk: FieldAppSDK;
  depth?: number;
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

  console.log("Liam: place");
  console.log(place);

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
              })}
            >
              <div>
                {camelCaseToCapitalizedWords(place?.sys?.contentType?.sys?.id)}
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
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        sdk.notifier.warning("Not yet added this bit");
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
                  <Heading as="h3">{place.fields?.name?.[locale]}</Heading>
                  <Paragraph >
                    {formatDescription(place.fields?.description?.[locale])}
                  </Paragraph>
                </div>
                {/* {place?.image && place.image.file?.[locale].url && (
                  <Image
                    className={css({
                      maxWidth: "100px",
                    })}
                    src={place.image.file[locale].url}
                    alt={place.image.description[locale]}
                    height="100px"
                    width="100px"
                  />
                )} */}
              </div>
            </div>
            {place?.linkedItems && place.linkedItems.length > 0 && depth === 0 && (
              <div
                className={css({
                  padding: "1rem",
                  borderTop: "1px solid #e5e5e5",
                })}
              >
                <ul>
                  {place.linkedItems.map((itemId) => (
                    <PlaceEntry key={itemId} entryId={itemId} sdk={sdk} depth={depth + 1} />
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
