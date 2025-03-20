import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Accordion,
  AccordionItem,
  Badge,
  DisplayText,
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
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const isLastPage = (currentPage + 1) * itemsPerPage >= 120;
  const pageLength = isLastPage ? 18 : undefined;
  const locale = "en-US";

  useEffect(() => {
    //console.log("Fetching entry with ID:", entryId); // Debugging
    const fetchData = async () => {
      try {
        const entry = await sdk.cma.entry.get({ entryId });
        setPlace(entry);
      } catch (error) {
        console.error("Error fetching entry:", error);
      }
    };
  
    fetchData();
  }, [sdk, entryId]);

  const fetchInBatches = async (ids: string[], batchSize: number, delay: number) => {
    const results: any[] = [];
  
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      //console.log(`Fetching batch: ${batch}`);
  
      const batchResults = await Promise.all(
        batch.map(async (id) => {
          try {
            const response = await sdk.cma.entry.get({ entryId: id });
            return response;
          } catch (error) {
            console.error(`Error fetching entry ${id}:`, error);
            return null; // Prevent errors from stopping execution
          }
        })
      );
  
      results.push(...batchResults.filter(Boolean)); // Remove null results
  
      if (i + batchSize < ids.length) {
        //console.log(`Waiting ${delay}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, delay)); // Rate-limit to 10 requests/sec
      }
    }
  
    return results;
  };

  
  
  useEffect(() => {
    //console.log("Fetching entry with ID:", entryId); // Debugging
    const fetchData = async () => {
      try {
        const entry = await sdk.cma.entry.get({ entryId });
        setPlace(entry);
        const items = entry.fields?.linkedItems?.[locale] || [];
        if (!Array.isArray(items)) {
          console.error("linkedItems is not an array:", items);
          return;
        }
      // Sorting logic
      items.sort((a: any, b: any) => {
        if (a.sys.contentType?.sys?.id === "poi") return 1;
        if (b.sys.contentType?.sys?.id === "poi") return -1;
        return 0;
      });

      // Extract Entry IDs
      const entryIds = items.map((item: any) => item.sys.id);
      //console.log("Fetching linked entries:", entryIds);

      // Fetch entries in batches of 10 per second
      const linkedEntries = await fetchInBatches(entryIds, 10, 500);
      setLinkedItems(linkedEntries);
      //console.log("Fetched linked entries:", linkedEntries);

      } catch (error: any) {
        console.error(
          `Error fetching entry with ID: ${entryId}`,
          error.code ? `Code: ${error.code}` : "",
          error.message ? `Message: ${error.message}` : "",
          error?.data ? `Data: ${JSON.stringify(error.data, null, 2)}` : ""
        );
      }
    };

    fetchData();
  }, [sdk, entryId]);

  if (!place) return null;

  const handleViewPerPageChange = (i: number) => {
    // Reset page to match item being shown on new View per page
    setCurrentPage(Math.floor((itemsPerPage * currentPage + 1) / i));
    setItemsPerPage(i);
  };

  const placeChildren = linkedItems.filter(
    (item) => item.sys.contentType.sys.id === "place"
  );
  const poiChildren = linkedItems.filter(
    (item) => item.sys.contentType.sys.id === "poiDetails"
  );

  const hasChildren = placeChildren.length > 0;
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
                textTransform="none"
              >
                {placeChildren.length} Place
              </Badge>
              <Badge
                className={css({
                  marginLeft: "0.5rem",
                })}
                variant="secondary"
                textTransform="none"
              >
                {poiChildren.length} POI
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
          <DisplayText
            className={css({
              marginBottom: "0",
            })}
            fontSize="fontSizeL"
            margin="none"
          >
            No Place Children
          </DisplayText>
        )}

        {linkedItems.length > itemsPerPage && (
          <Pagination
            activePage={currentPage}
            itemsPerPage={itemsPerPage}
            isLastPage={isLastPage}
            viewPerPageOptions={[5, 10, 20, 50]}
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
    <></>
    // <PoiEntry
    //   entryId={entryId}
    //   sdk={sdk}
    //   parentId={parentId}
    //   masterParentId={masterParentId}
    // />
  );
};

export default PlaceEntryWithAccordion;
