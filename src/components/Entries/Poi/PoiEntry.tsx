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

interface PoiEntry {
  fields: {
    name: { [locale: string]: string };
    websiteUrl?: { [locale: string]: string };
    description?: { [locale: string]: string };
    image?: { [locale: string]: { sys: { id: string } } };
    price?: { [locale: string]: string };
    openingHours?: { [locale: string]: string };
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
}

const PoiEntry = ({
  entryId,
  sdk,
  showImages,
  depth = 0,
  parentId,
  field,
  masterParentId,
}: {
  entryId: string;
  sdk: FieldAppSDK;
  showImages?: boolean;
  depth?: number;
  parentId: string;
  field: string;
  masterParentId: string;
}) => {
  const [poi, setPoi] = useState<PoiEntry>();
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

      const mappedPoi = {
        fields: getEntry.fields,
        image: image,
        sys: getEntry.sys,
        metadata: getEntry.metadata,
      } as unknown as PoiEntry;

      setPoi(mappedPoi);
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
        {poi && (
          <Card
            className={css({
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
                backgroundColor: getBGColor(poi?.sys?.contentType?.sys?.id),
              })}
            >
              <div>
                <Heading
                  className={css({
                    margin: 0,
                  })}
                  as="h3"
                >{`${camelCaseToCapitalizedWords(
                  poi?.sys?.contentType?.sys?.id
                )} -  ${poi.fields?.name?.[locale]}`}</Heading>
              </div>
              <div
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                })}
              >
                {poi?.sys?.fieldStatus["*"][locale] && (
                  <Badge
                    variant={
                      poi?.sys?.fieldStatus["*"][locale] === "published"
                        ? "positive"
                        : poi?.sys?.fieldStatus["*"][locale] === "changed"
                        ? "warning"
                        : "negative"
                    }
                  >
                    {poi?.sys?.fieldStatus["*"][locale]}
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
                        sdk.navigator.openEntry(entryId, {
                          slideIn: true,
                        });
                      }}
                    >
                      Edit
                    </Menu.Item>
                    <Menu.Item
                      onClick={async (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (parentId && entryId) {
                          await removeReference(
                            sdk,
                            parentId,
                            "linkedItems",
                            entryId,
                            masterParentId
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
                padding: "1rem"
              })}
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
                    {formatDescription(poi.fields?.description?.[locale])}
                  </Paragraph>
                </div>
                {poi?.image && poi.image.file?.[locale].url && showImages && (
                  <Image
                    className={css({
                      maxWidth: "100px",
                    })}
                    src={poi.image.file[locale].url}
                    alt={poi.image.description[locale]}
                    height="100px"
                    width="100px"
                  />
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Flex>
  );
};

export default PoiEntry;
