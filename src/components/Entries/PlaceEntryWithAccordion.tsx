import { FieldAppSDK } from "@contentful/app-sdk";
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
} from "@contentful/f36-components";
import {
  SettingsIcon
} from "@contentful/f36-icons";
import { css } from "emotion";
import { useEffect, useState } from "react";
import { camelCaseToCapitalizedWords } from "../../ts/utilities/formatStrings";

interface PlaceEntryProps {
  entryId: string;
  sdk: FieldAppSDK;
}

const PlaceEntryWithAccordion = ({
  entryId,
  sdk,
}: PlaceEntryProps) => {
  const [place, setPlace] = useState<any>();
  const locale = "en-US";

  useEffect(() => {
    const fetchData = async () => {
      const entry = await sdk.cma.entry.get({ entryId });
      setPlace(entry);
    };
    fetchData();
  }, [sdk, entryId]);

  if (!place) return null;

  return (
    <Accordion>
      <AccordionItem
        title={
          <>
            <div
              className={css({
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
              })}
            >
              <div>
                {camelCaseToCapitalizedWords(place.sys?.contentType?.sys?.id)} -{" "}
                {place.fields?.name?.[locale]}
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
                {/* <IconButton
                  variant="secondary"
                  icon={<MenuIcon />}
                  aria-label="toggle menu"
                  onClick={() => sdk.notifier.warning("Not yet added this bit")}
                /> */}
                <Button
                  startIcon={<SettingsIcon variant="muted" />}
                  size="small"
                  variant="transparent"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    sdk.navigator.openEntry(entryId, {
                      slideIn: true,
                    });
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>
          </>
        }
        className={css({ border: "2px solid #CFD9E0" })}
      >
        {place.fields?.linkedItems?.[locale]?.length > 0 && (
          <div className={css({ display: "flex", flexDirection: "column", gap: '0.5rem' })}>
            {place.fields.linkedItems[locale].map((item: any) => (
              <PlaceEntryWithAccordion
                key={item.sys.id}
                entryId={item.sys.id}
                sdk={sdk}
              />
            ))}
          </div>
        )}
      </AccordionItem>
    </Accordion>
  );
};

export default PlaceEntryWithAccordion;
