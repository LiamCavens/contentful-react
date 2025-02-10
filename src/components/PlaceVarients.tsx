import { ConfigAppSDK, EditorAppSDK } from "@contentful/app-sdk";
import {
  Checkbox,
  Flex,
  Form,
  Heading,
  Paragraph,
  Tabs,
} from "@contentful/f36-components";
import { css } from "emotion";
import { useEffect, useState } from "react";

interface PlaceVariantProps {
  linkedVariants: {
    sys: { id: string };
    fields: { channelTaxonomy: { sys: { id: string } } };
  }[];
  sdk: ConfigAppSDK | EditorAppSDK;
  locale: string;
}

const PlaceVariants = ({ linkedVariants, sdk, locale }: PlaceVariantProps) => {
  const [variantsData, setVariantsData] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState("");

  const getVarients = async (id: string) => {
    try {
      const variantAssets = await sdk.space.getEntry(id);
      return variantAssets.fields;
    } catch (error) {
      console.error(`Error fetching variant with ID ${id}:`, error);
      return null;
    }
  };

  const getTaxonomyTag = async (taxonomyId: string) => {
    try {
      const taxonomyTag = await sdk.space.getEntry(taxonomyId);
      return taxonomyTag.fields.channel[locale];
    } catch (error) {
      console.error(
        `Error fetching taxonomy tag with ID ${taxonomyId}:`,
        error
      );
      return null;
    }
  };

  // useEffect to fetch variants data
  useEffect(() => {
    const fetchVariantsData = async () => {
      const data = await Promise.all(
        linkedVariants.map(async (variant) => {
          const variantData = await getVarients(variant.sys.id);
          const channelTag = variantData?.channelTaxonomy
            ? await getTaxonomyTag(variantData?.channelTaxonomy[locale]?.sys.id)
            : null;
          return variantData
            ? {
                title: variantData.title || "",
                nameOverride: variantData.nameOverride || "",
                description: variantData.description || "",
                futureUpdates: variantData.futureUpdates || false,
                tag: channelTag,
              }
            : null;
        })
      );
      setVariantsData(data.filter(Boolean)); // Remove any null values
      setCurrentTab(data[0]?.tag);
    };

    fetchVariantsData();
  }, [linkedVariants, sdk]);

  return (
    <Flex flexDirection="column">
      <Tabs
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        className={css({ padding: "1rem", display: "flex" })}
      >
        <Tabs.List className={css({ flexDirection: "column" })}>
          {variantsData.map((variant, index) => (
            <Tabs.Tab
              key={variant.tag + "-tab-" + index}
              panelId={variant.tag}
              className={css({
                height: "2rem",
                minHeight: "2rem",
                position: "relative",
                "::before": {
                  content: '""',
                  position: "absolute",
                  background: "rgb(3, 111, 227)",
                  opacity: 0,
                  right: "0px",
                  left: "100%",
                  width: "2px",
                  height: "2rem",
                  bottom: "none",
                },
              })}
            >
              {variant.nameOverride[locale]}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {variantsData.map((variant, index) => (
          <Tabs.Panel
            key={variant.tag + "-panel-" + index}
            id={variant.tag}
            className={css({ padding: "1rem" })}
          >
            <Heading>{variant.nameOverride[locale]}</Heading>
            <Paragraph
              className={css({
                padding: "1rem",
                border: "1px solid rgb(204, 204, 204)",
              })}
            >
              {variant.description[locale].content[0].content[0].value}
            </Paragraph>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Flex>
  );
};

export default PlaceVariants;
