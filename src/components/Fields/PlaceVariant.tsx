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
import { useEffect, useState, useCallback } from "react";

type EntityStatus = "archived" | "changed" | "draft" | "published";
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
  image?: {
    description: { [key: string]: string };
    file: { [key: string]: { url: string } };
    title: { [key: string]: string };
  };
}

const Place = ({
  linkedVariantId,
  linkedVariantObj,
  sdk,
  contentType,
  channel,
}: {
  linkedVariantId?: string;
  linkedVariantObj?: LinkedVariant;
  sdk: FieldAppSDK;
  contentType: ContentType;
  channel?: string;
}) => {
  const [linkedVariant, setLinkedVariant] = useState<LinkedVariant>();
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      if (linkedVariantId) {
        const getVariant = await sdk.space.getEntry(linkedVariantId);
        const getVariantImage = getVariant.fields?.image?.[locale]?.sys.id
          ? await getImageAsset(getVariant.fields.image[locale].sys.id)
          : null;

        const mappedVariant = {
          sys: getVariant.sys,
          fields: getVariant.fields,
          image: getVariantImage,
        };

        setLinkedVariant(mappedVariant as unknown as LinkedVariant);
        return;
      }

      setLinkedVariant(linkedVariantObj);
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

  const formatDescription = (description: any) => {
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
      {linkedVariant && (
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
            <div className={css({ display: "flex", alignItems: "center", gap: "1rem" })}>
              <Badge variant={"positive"}>
                {linkedVariant.sys.fieldStatus["*"][locale]}
              </Badge>
              <Menu>
                <Menu.Trigger>
                  <IconButton
                    variant="secondary"
                    icon={<MenuIcon />}
                    aria-label="toggle menu"
                  />
                </Menu.Trigger>
                <Menu.List>
                  <Menu.Item>Remove</Menu.Item>
                </Menu.List>
              </Menu>
            </div>
          </div>
          <div
            className={css({
              padding: "1rem",
            })}
            onClick={() => {
              sdk.navigator.openEntry(linkedVariant.sys.id, { slideIn: true });
            }}
          >
            <Heading as="h3">{linkedVariant.fields.name[locale]}</Heading>
            <div
              className={css({
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
              })}
            >
              <Paragraph>
                {formatDescription(linkedVariant.fields.description[locale])}
              </Paragraph>
              {linkedVariant.image && linkedVariant.image.file[locale].url && (
                <Image
                  className={css({
                    maxWidth: "175px",
                  })}
                  src={linkedVariant.image.file[locale].url}
                  alt={linkedVariant.image.description[locale]}
                  height="175px"
                  width="175px"
                />
              )}
            </div>
          </div>
        </Card>
        // <EntryCard
        //   withDragHandle
        // />
      )}
    </>
  );
};

export default Place;
