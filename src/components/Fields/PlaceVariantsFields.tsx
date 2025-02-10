import { FieldAppSDK } from "@contentful/app-sdk";
import { Flex, Badge, EntryCard } from "@contentful/f36-components";
import { css } from "emotion";
import { useEffect, useState, useCallback } from "react";
import PlaceVariant from "./PlaceVariant";

type EntityStatus = "archived" | "changed" | "draft" | "published";
type ContentType = "linkedVariants";
interface LinkedVariant {
  sys: {
    id: string;
    fieldStatus: {
      "*": {
        locale: EntityStatus;
      };
    };
  };
  fields: {
    name: {
      locale: string;
    };
    description: {
      locale: {
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
      locale: {
        sys: {
          type: "Link";
          linkType: "Asset";
          id: string;
        };
      };
    };
  };
}

const PlaceVarientsFields = ({
  fieldIds,
  sdk,
  contentType,
}: {
  fieldIds: string[];
  sdk: FieldAppSDK;
  contentType: ContentType;
}) => {
  const [linkedVariants, setLinkedVariants] = useState<any>();

  useEffect(() => {
    const fetchData = async () => {
      const fields = await Promise.all(
        fieldIds.map(async (id) => {
          return (await sdk.space.getEntry(id)) as unknown as LinkedVariant;
        })
      );

      setLinkedVariants(fields);
    };

    fetchData();
  }, [sdk, fieldIds]);

  return (
    <Flex
      flexDirection="column"
      className={css({ marginBottom: "1rem", marginRight: "1rem" })}
    >
      {linkedVariants &&
        linkedVariants.map((variant: LinkedVariant, index: number) => (
          <PlaceVariant
            key={"placeVariant-" + index}
            linkedVariantObj={variant}
            sdk={sdk}
            contentType={contentType}
          />
        ))}
    </Flex>
  );
};

export default PlaceVarientsFields;
