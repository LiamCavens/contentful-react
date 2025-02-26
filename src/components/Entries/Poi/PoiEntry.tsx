import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Card,
  Flex,
  Badge,
  Heading,
  Paragraph,
  Accordion,
  AccordionItem,
} from "@contentful/f36-components";
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
import EntryManageButtons from "../../Button/EntryManageButtons";

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
  parentId,
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
  const entryType = poi?.sys?.contentType?.sys?.id;

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
      const imageId = Array.isArray(getEntry.fields.image?.[locale])
        ? getEntry.fields.image?.[locale][0]?.sys?.id
        : getEntry.fields.image?.[locale]?.sys?.id;
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
          <Accordion>
            <AccordionItem
              className={css({
                border: "2px solid #CFD9E0",
                borderRadius: "6px",
                "& h2 > button:first-of-type": {
                  backgroundColor: `${getBGColor("poi")} !important`,
                },
              })}
              title={
                <div
                  className={css({
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    alignItems: "center",
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
                    <EntryManageButtons
                      sdk={sdk}
                      entryId={entryId}
                      parentId={parentId}
                      field={"linkedItems"}
                      masterParentId={masterParentId}
                    />
                  </div>
                </div>
              }
            >
              {" "}
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
                {poi?.image && poi.image.file?.[locale].url && (
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
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </Flex>
  );
};

export default PoiEntry;
