import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Heading,
  ModalConfirm,
  Paragraph,
  Pagination,
  Text,
} from "@contentful/f36-components";
import { SettingsIcon } from "@contentful/f36-icons";
import { css } from "emotion";
import { ContentfulContentModelTypes } from "../../../ts/types/ContentfulTypes";
import { useEffect, useState } from "react";
import { camelCaseToCapitalizedWords } from "../../../ts/utilities/formatStrings";
import PlaceEntry from "./PlaceEntry";
import getBGColor from "../../../ts/utilities/getBGColor";
import { removeReference } from "../../../ts/utilities/contentful/removeReference";

interface PlaceEntryProps {
  entryId: string;
  sdk: FieldAppSDK;
  showImages?: boolean;
  parentId: string;
  field: string;
}

const PlaceEntryWithAccordion = ({
  entryId,
  sdk,
  showImages,
  parentId,
  field
}: PlaceEntryProps) => {
  const [place, setPlace] = useState<any>();
  const [linkedItems, setLinkedItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const isLastPage = (currentPage + 1) * itemsPerPage >= 120;
  const pageLength = isLastPage ? 18 : undefined;
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      const entry = await sdk.cma.entry.get({ entryId });
      setPlace(entry);
      const items = entry.fields?.linkedItems?.[locale] || [];
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
  const paginatedItems = linkedItems.slice(
    currentPage,
    currentPage + itemsPerPage
  );
  const entryType: ContentfulContentModelTypes =
    place.sys?.contentType?.sys?.id;

  return entryType === "place" ? (
    <Accordion>
      <AccordionItem
        className={css({
          border: "2px solid #CFD9E0",
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
              <Button
                startIcon={<SettingsIcon variant="muted" />}
                size="small"
                variant="transparent"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  sdk.navigator.openEntry(entryId, { slideIn: true });
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="negative"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  showRemoveConfirm ? setShowRemoveConfirm(false) : setShowRemoveConfirm(true);
                }}
              >
                Remove
              </Button>
              <ModalConfirm
                intent="positive"
                isShown={showRemoveConfirm}
                onCancel={() => {
                  setShowRemoveConfirm(false);
                }}
                onConfirm={async () => {
                  setShowRemoveConfirm(false);
                  await removeReference(sdk, parentId, field, entryId);
                }}
              >
                <Text>Do you really want to remove this reference?</Text>
              </ModalConfirm>
            </div>
          </div>
        }
      >
        {hasChildren ? (
          <div
            className={css({
              marginTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
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
    <PlaceEntry
      entryId={entryId}
      sdk={sdk}
      showImages={showImages}
      parentId={entryId}
      field={field}
    />
  );
};

export default PlaceEntryWithAccordion;
