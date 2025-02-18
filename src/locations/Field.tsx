import { useEffect, useState, useCallback } from "react";
import { MultipleEntryReferenceEditor } from "@contentful/field-editor-reference";
import { Button, ToggleButton } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { FieldAppSDK } from "@contentful/app-sdk";
import PlaceEntryWithAccordion from "../components/Entries/Place/PlaceEntryWithAccordion";
import PlaceVariant from "../components/Entries/PlaceVariant";
import TaxonomyEntry from "../components/Entries/TaxonomyEntry";
import { css } from "emotion";

// Define available field content types and their renderers
const fieldRenderers = {
  linkedVariants: (
    sdk: FieldAppSDK,
    filter: string,
    setFilter: (val: string) => void,
    showCustomRendering: boolean
  ) => {
    const channels = ["App", "Web", "Print"];
    const CustomRenderer = useCallback(
      (props: any) => {
        const linkedVariantChannel =
          channels.find((channel) =>
            new RegExp(`${channel}$`).test(props.contentType.name)
          ) || props.contentType.name;


        if (!showCustomRendering) {
          return false;
        }

        if (filter !== "all" && linkedVariantChannel !== filter) {
          // We return an empty fragment to prevent contentfuls default rendering
          return <></>;
        }

        return (
          <PlaceVariant
            linkedVariantId={props.entity.sys.id}
            sdk={sdk}
            contentType="linkedVariants"
            channel={linkedVariantChannel}
          />
        );
      },
      [filter, showCustomRendering]
    );

    return (
      <>
        {/* Dynamic Filter Buttons */}
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
          key={`${filter}-${showCustomRendering}`}
          renderCustomCard={CustomRenderer}
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
    );
  },
  // Pretty much redundant, but here for completeness
  taxonomy: (
    sdk: FieldAppSDK,
    _: string,
    __: (val: string) => void,
    showCustomRendering: boolean,
    showImages?: boolean
  ) => {
    const CustomRenderer = (props: any) => {
      if (!showCustomRendering) {
        return false;
      }
      return <TaxonomyEntry entity={props.entity} />;
    };

    return (
      <MultipleEntryReferenceEditor
        renderCustomCard={CustomRenderer}
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
    );
  },
  linkedItems: (
    sdk: FieldAppSDK,
    _: string,
    __: (val: string) => void,
    showCustomRendering: boolean
  ) => {
    // These types are of the linkedItemTypes
    type linkedItemTypes = "place" | "poi" | "poiAssembly";
    const CustomRenderer = (props: any) => {
      if (!showCustomRendering) {
        return false;
      }
      // return a component if it is a linkedItemType or fetch the linkedItem and return a component
      const contentType = props.contentType.sys.id;
      if (contentType === "place") {
        return (
          <PlaceEntryWithAccordion
            entryId={props.entity.sys.id}
            sdk={sdk}

          />
        );
      }
      if (contentType === "poi") {
        return (
          <PlaceEntryWithAccordion
            entryId={props.entity.sys.id}
            sdk={sdk}
          />
        );
      }

      return (
        <div>
          <p> To Do Content Type in Field : {props.entity.sys.id}</p>
        </div>
      );
    };
    return (
      <MultipleEntryReferenceEditor
      key={`${showCustomRendering}`}
      renderCustomCard={CustomRenderer}
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
    );
  },
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const fieldContentType = sdk.field.id as keyof typeof fieldRenderers;
  const [filter, setFilter] = useState<string>("all");
  const [showCustomRendering, setShowCustomRendering] = useState(true);

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  return (
    <div>
      <ToggleButton
        className={css({ marginBottom: "0.5rem", marginRight: "0.5rem" })}
        isActive={showCustomRendering}
        onToggle={() => setShowCustomRendering(!showCustomRendering)}
      >
        Show Custom Rendering
      </ToggleButton>
      {fieldRenderers[fieldContentType] ? (
        fieldRenderers[fieldContentType](
          sdk,
          filter,
          setFilter,
          showCustomRendering
        )
      ) : (
        <p className={css({ padding: "1rem" })}>
          Other Content todo: {fieldContentType}
        </p>
      )}
    </div>
  );
};

export default Field;
