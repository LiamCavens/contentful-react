import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Heading,
  Badge,
  Card,
  Paragraph,
  Menu,
  IconButton,
} from "@contentful/f36-components";
import { Image } from "@contentful/f36-image";
import { MoreHorizontalIcon as MenuIcon } from "@contentful/f36-icons";
import { css } from "emotion";
import { useEffect, useState } from "react";
import { EntityStatus } from "../../../ts/types/ContentfulTypes";
import { removeReference } from "../../../ts/utilities/contentful/removeReference";

type ContentType = "linkedVariants";
interface LinkedVariant {
  sys: {
    id: string;
    fieldStatus: {
      "*": {
        [key: string]: EntityStatus;
      };
    };
  };
  fields: {
    name: {
      [key: string]: string;
    };
    description: {
      [key: string]: {
        data: Record<string, unknown>;
        content: Array<{
          data: Record<string, unknown>;
          content: Array<{
            data: Record<string, unknown>;
            marks: Array<{ type: string }>;
            value: string;
            nodeType: string;
          }>;
          nodeType: string;
        }>;
        nodeType: string;
      };
    };
    image: {
      [key: string]: {
        sys: {
          type: "Link";
          linkType: "Asset";
          id: string;
        };
      };
    };
  };
  image?: any;
}

const PlaceVariantField = ({
  linkedVariantId,
  linkedVariantObj,
  sdk,
  contentType,
  channel,
  parentId,
  masterParentId
}: {
  linkedVariantId?: string;
  linkedVariantObj?: LinkedVariant;
  sdk: FieldAppSDK;
  contentType: ContentType;
  channel?: string;
  parentId: string;
  masterParentId?: string;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [linkedVariant, setLinkedVariant] = useState<LinkedVariant>();
  const [fieldStatus, setFieldStatus] = useState<EntityStatus>();
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      if (linkedVariantId) {
        setIsLoading(true); // Start loading
        try {
          const variant = await sdk.cma.entry.get({ entryId: linkedVariantId });

          let getVariantImage = null;
          if (variant.fields?.image?.[locale]?.sys.id) {
            getVariantImage = await getImageAsset(
              variant.fields?.image?.[locale].sys.id
            );
          }

          const mappedVariant = {
            fields: variant.fields,
            sys: variant.sys,
            image: getVariantImage,
          };

          setLinkedVariant(mappedVariant as unknown as LinkedVariant);
          setFieldStatusFromLinkedVariant();
        } catch (error) {
          console.error("Error fetching linked variant:", error);
        } finally {
          setIsLoading(false); // End loading
        }
        return;
      }

      setLinkedVariant(linkedVariantObj);
      setFieldStatusFromLinkedVariant();
      setIsLoading(false);
    };

    fetchData();
  }, [sdk, linkedVariantId]);

  const getImageAsset = async (id: string) => {
    try {
      const imageAsset = await sdk.space.getAsset(id);
      return imageAsset.fields;
    } catch (error) {
      console.error(`Error fetching image asset with ID ${id}:`, error);
      return null;
    }
  };

  const setFieldStatusFromLinkedVariant = () => {
    if (linkedVariant) {
      setFieldStatus(linkedVariant.sys.fieldStatus?.["*"][locale]);
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

  const formattedContentType = contentType
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^./, (str) => str.toUpperCase());

  return (
    <>
      {!isLoading && linkedVariant && (
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
              {formattedContentType}{" "}
              <Badge
                variant={
                  channel === "Web"
                    ? "positive"
                    : channel === "App"
                    ? "warning"
                    : "negative"
                }
              >
                {channel}
              </Badge>
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
                    variant="secondary"
                    icon={<MenuIcon />}
                    aria-label="toggle menu"
                  />
                </Menu.Trigger>
                <Menu.List>
                  <Menu.Item
                    onClick={async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (parentId && linkedVariant?.sys.id) {
                        await removeReference(
                          sdk,
                          parentId,
                          "linkedVariants",
                          linkedVariant.sys.id,
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
              padding: "1rem",
              display: "flex",
              gap: "1rem",
            })}
            onClick={() => {
              sdk.navigator.openEntry(linkedVariant.sys.id, {
                slideIn: true,
              });
            }}
          >
            <div>
              <Heading as="h3">{linkedVariant.fields?.name?.[locale]}</Heading>
              <Paragraph>
                {formatDescription(linkedVariant.fields?.description?.[locale])}
              </Paragraph>
            </div>{" "}
            {linkedVariant?.image && linkedVariant.image.file[locale].url && (
              <Image
                className={css({
                  maxWidth: "175px",
                })}
                src={linkedVariant.image.file[locale].url}
                alt={linkedVariant.image.description[locale]}
                height="150px"
                width="150px"
              />
            )}
          </div>
        </Card>
        // <EntryCard
        //   withDragHandle
        // />
      )}
    </>
  );
};

export default PlaceVariantField;
