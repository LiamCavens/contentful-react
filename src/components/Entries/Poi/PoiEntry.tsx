import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Accordion,
  AccordionItem,
  Badge,
  Flex,
  Heading,
  Paragraph,
  Pagination,
} from "@contentful/f36-components";
// Currently commented out as it can be added back in later
import { Image } from "@contentful/f36-image";
import { css } from "emotion";
import { useEffect, useState } from "react";
import { camelCaseToCapitalizedWords } from "../../../ts/utilities/formatStrings";
import getBGColor from "../../../ts/utilities/getBGColor";
import EntryManageButtons from "../../Button/EntryManageButtons";
import { EntryProps, AssetProps } from "contentful-management";

const PoiEntry = ({
  entryId,
  sdk,
  parentId,
  masterParentId,
  field,
}: {
  entryId: string;
  sdk: FieldAppSDK;
  parentId: string;
  masterParentId: string;
  field?: string
}) => {
  const [poi, setPoi] = useState<EntryProps>();
  const [poiImage, setPoiImage] = useState<AssetProps>();
  const [linkedItems, setLinkedItems] = useState<EntryProps[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const isLastPage = (currentPage + 1) * itemsPerPage >= 120;
  const pageLength = isLastPage ? 18 : undefined;
  const locale = "en-US";

  const getImageUrl = async (id: string): Promise<AssetProps | undefined> => {
    try {
      const imageAsset = await sdk.cma.asset.get({ assetId: id });
      return imageAsset;
    } catch (error) {
      console.error(`Error fetching image asset with ID ${id}:`, error);
      return undefined;
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
      const entry = await sdk.cma.entry.get({ entryId });
      const imageId = Array.isArray(entry.fields.image?.[locale])
        ? entry.fields.image?.[locale][0]?.sys?.id
        : entry.fields.image?.[locale]?.sys?.id;
      const image = imageId ? await getImageUrl(imageId) : undefined;

      setPoi(entry);
      setPoiImage(image);
      setLinkedItems(entry.fields?.linkedItems?.[locale] || []);
    };

    fetchData();
  }, [sdk, entryId]);

  const handleViewPerPageChange = (i: number) => {
    // Reset page to match item being shown on new View per page
    setCurrentPage(Math.floor((itemsPerPage * currentPage + 1) / i));
    setItemsPerPage(i);
  };

  const hasChildren = linkedItems.length > 0;
  const startIndex = currentPage * itemsPerPage;
  const paginatedItems = linkedItems.slice(
    startIndex,
    Math.min(startIndex + itemsPerPage, linkedItems.length)
  );

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
                    {/*@ts-expect-error - outdated library now uses fieldStatus instead of status */}
                    {poi?.sys?.fieldStatus["*"][locale] && (
                      <Badge
                        variant={
                          /*@ts-expect-error - outdated library now uses fieldStatus instead of status */
                          poi?.sys?.fieldStatus["*"][locale] === "published"
                            ? "positive"
                            : /*@ts-expect-error - outdated library now uses fieldStatus instead of status */
                            poi?.sys?.fieldStatus["*"][locale] === "changed"
                            ? "warning"
                            : "negative"
                        }
                      >
                        {/*@ts-expect-error - outdated library now uses fieldStatus instead of status */}
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
                {poiImage && poiImage.fields.file[locale].url && (
                  <Image
                    className={css({
                      maxWidth: "100px",
                    })}
                    src={poiImage.fields.file[locale].url}
                    alt={
                      poiImage.fields.description?.[locale] ||
                      `Picture of ${poi.fields.name[locale]}`
                    }
                    height="100px"
                    width="100px"
                  />
                )}
              </div>
              {hasChildren && (
                <div
                  className={css({
                    marginTop: "0.5rem",
                    marginBottom: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  })}
                >
                  {paginatedItems.map((item: any) => (
                    <PoiEntry
                      key={item.sys.id}
                      entryId={item.sys.id}
                      sdk={sdk}
                      parentId={entryId}
                      masterParentId={masterParentId}
                    />
                  ))}
                </div>
              )}
              {linkedItems.length > itemsPerPage && (
                <Pagination
                  activePage={currentPage}
                  itemsPerPage={itemsPerPage}
                  isLastPage={isLastPage}
                  viewPerPageOptions={[3, 10, 10000000]}
                  showViewPerPage
                  totalItems={linkedItems.length}
                  onPageChange={(page) => setCurrentPage(page)}
                  onViewPerPageChange={handleViewPerPageChange}
                  pageLength={pageLength}
                />
              )}
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </Flex>
  );
};

export default PoiEntry;
