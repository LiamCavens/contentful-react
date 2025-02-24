import { useEffect, useState, useCallback } from "react";
import { MultipleEntryReferenceEditor } from "@contentful/field-editor-reference";
import { Button, ToggleButton } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { FieldAppSDK } from "@contentful/app-sdk";
import PlaceEntryWithAccordion from "../components/Entries/Place/PlaceEntryWithAccordion";
import PoiEntry from "../components/Entries/Poi/PoiEntry";
import PoiVariant from "../components/Entries/Poi/PoiVariant";
import PlaceVariant from "../components/Entries/Place/PlaceVariant";
import TaxonomyEntry from "../components/Entries/TaxonomyEntry";
import { css } from "emotion";

type placeVariantTypes =
  | "placeVariantApp"
  | "placeVariantWeb"
  | "placeVariantPrint";
type poiVariantTypes = "poiVariantApp" | "poiVariantWeb" | "poiVariantPrint";

// Define available field content types and their renderers
const fieldRenderers: {
  [key: string]: (
    sdk: FieldAppSDK,
    filter: string,
    setFilter: (val: string) => void,
    showCustomRendering: boolean,
    masterParentId: string
  ) => JSX.Element;
} = {
  linkedVariants: (
    sdk: FieldAppSDK,
    filter: string,
    setFilter: (val: string) => void,
    showCustomRendering: boolean,
    masterParentId: string
  ) => {
    const [updateKey, setUpdateKey] = useState(0);
    const channels = ["App", "Web", "Print"];
    const placeVariants = [
      "placeVariantApp",
      "placeVariantWeb",
      "placeVariantPrint",
    ];
    const poiVariants = ["poiVariantApp", "poiVariantWeb", "poiVariantPrint"];

    useEffect(() => {
      const childSysListener = sdk.entry.onSysChanged(() => {
        setUpdateKey((prev) => prev + 1); // Force re-render on entry updates
      });

      const closeChildListener = sdk.navigator.onSlideInNavigation(() => {
        setUpdateKey((prev) => prev + 1);
      })

      return () => {
        childSysListener();
        closeChildListener();
      };
    }, [sdk.entry]);

    const CustomRenderer = useCallback(
      (props: any) => {
        const variantType = props.contentType.sys.id as
          | placeVariantTypes
          | poiVariantTypes;
        const linkedVariantChannel =
          channels.find((channel) =>
            new RegExp(`${channel}$`).test(variantType)
          ) || variantType;

        if (!showCustomRendering) {
          return false;
        }

        if (filter !== "all" && linkedVariantChannel !== filter) {
          return <></>; // Prevents Contentful's default rendering
        }

        if (placeVariants.includes(variantType)) {
          return (
            <PlaceVariant
              linkedVariantId={props.entity.sys.id}
              parentId={sdk.ids.entry}
              sdk={sdk}
              contentType="linkedVariants"
              channel={linkedVariantChannel}
              masterParentId={masterParentId}
            />
          );
        } else if (poiVariants.includes(variantType)) {
          return (
            <PoiVariant
              linkedVariantId={props.entity.sys.id}
              parentId={sdk.ids.entry}
              sdk={sdk}
              contentType="linkedVariants"
              channel={linkedVariantChannel}
              masterParentId={masterParentId}
            />
          );
        } else {
          return (
            <div>
              <p> To Do Content Type in Field : {variantType}</p>
            </div>
          );
        }
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
          key={`${filter}-${showCustomRendering}-${updateKey}`} // Ensures re-render
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
  linkedItems: (
    sdk: FieldAppSDK,
    _: string,
    __: (val: string) => void,
    showCustomRendering: boolean,
    masterParentId: string
  ) => {
    const [updateKey, setUpdateKey] = useState(0);

    useEffect(() => {
      const childSysListener = sdk.entry.onSysChanged(() => {
        setUpdateKey((prev) => prev + 1);
      });

      const closeChildListener = sdk.navigator.onSlideInNavigation(() => {
        setUpdateKey((prev) => prev + 1);
      });

      return () => {
        childSysListener();
        closeChildListener();
      };
    }, [sdk.entry]);

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
            field="linkedItems"
            parentId={sdk.ids.entry}
            masterParentId={masterParentId}
          />
        );
      }
      if (contentType === "poi") {
        return (
          <PoiEntry
            entryId={props.entity.sys.id}
            sdk={sdk}
            field="linkedItems"
            parentId={sdk.ids.entry}
            masterParentId={masterParentId}
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
        key={`${showCustomRendering} - ${updateKey}`}
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
        onSortingEnd={({ oldIndex, newIndex }) => {
          const items = Array.from(sdk.field.getValue());
          const [movedItem] = items.splice(oldIndex, 1);
          items.splice(newIndex, 0, movedItem);
          sdk.field.setValue(items);
        }}
      />
    );
  },
  // Pretty much redundant, but here for completeness
  taxonomy: (
    sdk: FieldAppSDK,
    _: string,
    __: (val: string) => void,
    showCustomRendering: boolean
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
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const fieldContentType = sdk.field.id as keyof typeof fieldRenderers;
  const [filter, setFilter] = useState<string>("all");
  const [showCustomRendering, setShowCustomRendering] = useState(true);
  const masterParentId = sdk.ids.entry;

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
          showCustomRendering,
          masterParentId
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
