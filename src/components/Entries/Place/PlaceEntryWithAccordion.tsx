import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Accordion,
  AccordionItem,
  Badge,
  Heading,
  Paragraph,
  Pagination,
} from "@contentful/f36-components";
import { css } from "emotion";
import { ContentfulContentModelTypes } from "../../../ts/types/ContentfulTypes";
import { useEffect, useState } from "react";
import { camelCaseToCapitalizedWords } from "../../../ts/utilities/formatStrings";
import PoiEntry from "../Poi/PoiEntry";
import getBGColor from "../../../ts/utilities/getBGColor";
import EntryManageButtons from "../../Button/EntryManageButtons";

interface PlaceEntryProps {
  entryId: string;
  sdk: FieldAppSDK;
  showImages?: boolean;
  parentId: string;
  field: string;
  masterParentId: string;
}

const PlaceEntryWithAccordion = ({
  entryId,
  sdk,
  showImages,
  parentId,
  field,
  masterParentId,
}: PlaceEntryProps) => {
  const [place, setPlace] = useState<any>();
  const [linkedItems, setLinkedItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const isLastPage = (currentPage + 1) * itemsPerPage >= 120;
  const pageLength = isLastPage ? 18 : undefined;
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      const entry = await sdk.cma.entry.get({ entryId });
      setPlace(entry);
      const items = entry.fields?.linkedItems?.[locale] || [];

      // if item in items sys.id === 'poi' then put it at end of array else keep it in place
      items.sort((a: any, b: any) => {
        if (a.sys.id === "poi") return 1;
        if (b.sys.id === "poi") return -1;
        return 0;
      });

      setLinkedItems(items);
    };

    fetchData();
  }, [sdk, entryId]);

  if (!place) return null;

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

  const entryType: ContentfulContentModelTypes =
    place.sys?.contentType?.sys?.id;

  return entryType === "place" ? (
    <Accordion>
      <AccordionItem
        className={css({
          border: "2px solid #CFD9E0",
          borderRadius: "6px",
          "& h2 > button:first-of-type": {
            backgroundColor: `${getBGColor(entryType)} !important`,
          },
        })}
        title={
          <div
            className={css({
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            })}
          >
            <div
              className={css({
                display: "flex",
                alignItems: "center",
              })}
            >
              <Heading
                className={css({
                  margin: 0,
                })}
              >
                {camelCaseToCapitalizedWords(place.sys?.contentType?.sys?.id)} -{" "}
                {place.fields?.name?.[locale]}
              </Heading>
              <Badge
                className={css({
                  marginLeft: "0.5rem",
                })}
                variant="secondary"
              >
                {linkedItems.length} Children
              </Badge>
            </div>
            <div
              className={css({
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
              })}
            >
              {place.sys?.fieldStatus?.["*"]?.[locale] && (
                <Badge
                  variant={
                    place.sys.fieldStatus["*"][locale] === "published"
                      ? "positive"
                      : place.sys.fieldStatus["*"][locale] === "changed"
                      ? "warning"
                      : "negative"
                  }
                >
                  {place.sys.fieldStatus["*"][locale]}
                </Badge>
              )}
              <EntryManageButtons
                sdk={sdk}
                entryId={entryId}
                parentId={parentId}
                field={field}
                masterParentId={masterParentId}
              />
            </div>
          </div>
        }
      >
        {hasChildren ? (
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
              <PlaceEntryWithAccordion
                key={item.sys.id}
                entryId={item.sys.id}
                sdk={sdk}
                showImages={showImages}
                parentId={entryId}
                field={field}
                masterParentId={masterParentId}
              />
            ))}
          </div>
        ) : (
          <Paragraph fontSize="fontSizeL">No linked Items</Paragraph>
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
  ) : (
    <PoiEntry
      entryId={entryId}
      sdk={sdk}
      parentId={parentId}
      masterParentId={masterParentId}
    />
  );
};

export default PlaceEntryWithAccordion;
