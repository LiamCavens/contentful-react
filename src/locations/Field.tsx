import { useEffect, useState, useCallback } from "react";
import { MultipleEntryReferenceEditor } from "@contentful/field-editor-reference";
import { Button } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { FieldAppSDK } from "@contentful/app-sdk";
import PlaceVariant from "../components/Fields/PlaceVariant";
import TaxonomyEntry from "../components/Entries/TaxonomyEntry";
import { css } from "emotion";

interface Field {
  // TODO: Define the properties of Field here
  [key: string]: any;
}

type fieldTypes = "linkedVariants";

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const fieldContentType: fieldTypes = sdk.field.id as fieldTypes;
  const [filter, setFilter] = useState<string>("all");
  const channels = ["App", "Web", "Print"];

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  const CustomRendererLinkedVariants = useCallback(
    (props: any) => {
      const linkedVariantChannel =
        channels.find((channel) =>
          new RegExp(`${channel}$`).test(props.contentType.name)
        ) || props.contentType.name;

      if (filter !== "all" && linkedVariantChannel !== filter) {
        return <></>;
      }

      return (
        <>
          <>
            <PlaceVariant
              linkedVariantId={props.entity.sys.id}
              sdk={sdk}
              contentType={fieldContentType}
              channel={linkedVariantChannel}
            />
          </>
        </>
      );
    },
    [filter]
  );

  const CustomRendererTaxonomy = (props: any) => {
    return <TaxonomyEntry entity={props.entity} />;
  };

  return (
    <div>
      {fieldContentType === "linkedVariants" ? (
        <>
          <div
            className={css({
              display: "flex",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            })}
          >
            {["all", ...channels].map((type) => (
              <Button
                key={type}
                onClick={() => setFilter(type)}
                className={
                  filter === type
                    ? css({ backgroundColor: "#0070f3", color: "#fff" })
                    : ""
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <MultipleEntryReferenceEditor
            key={filter}
            renderCustomCard={CustomRendererLinkedVariants}
            viewType="link"
            sdk={sdk}
            isInitiallyDisabled
            hasCardEditActions
            parameters={{
              instance: {
                showCreateEntityAction: true,
                showLinkEntityAction: true,
              },
            }}
          />
        </>
      ) : fieldContentType === "taxonomy" ? (
        <>
          <MultipleEntryReferenceEditor
            key={filter}
            renderCustomCard={CustomRendererTaxonomy}
            viewType="link"
            sdk={sdk}
            isInitiallyDisabled
            hasCardEditActions
            parameters={{
              instance: {
                showCreateEntityAction: true,
                showLinkEntityAction: true,
              },
            }}
          />
        </>
      ) : (
        <p className={css({ padding: "1rem" })}>
          Other Content todo: {fieldContentType}
        </p>
      )}
    </div>
  );
};

export default Field;
