import { FieldAppSDK } from "@contentful/app-sdk";
import { css } from "emotion";
import { useEffect, useState } from "react";
import { useSDK } from "@contentful/react-apps-toolkit";

const TaxonomyEntry = ({
  entity,
  setParentHovered,
}: {
  entity: any;
  setParentHovered?: (hovered: boolean) => void;
}) => {
  const sdk = useSDK<FieldAppSDK>();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      try {
        const childIds =
          entity.fields?.taxonomy?.["en-US"]?.map(
            (entry: any) => entry.sys.id
          ) || [];

        const childEntries = await Promise.all(
          childIds.map((id: string) => sdk.space.getEntry(id))
        );

        setChildren(childEntries);
      } catch (error) {
        console.error("Error fetching child taxonomy entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [entity.sys.id, sdk]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent div from receiving click
    sdk.navigator.openEntry(entity.sys.id, { slideIn: true });
  };

  return (
    <div
      className={css({
        marginLeft: "20px",
        border: "1px solid #ccc",
        borderLeft: isHovered ? "2px solid #0070f3" : "2px solid #ccc",
        padding: "0.75rem 1.5rem",
        cursor: "pointer",
        transition: "border-color 0.2s ease-in-out",
      })}
      onClick={handleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        if (setParentHovered) setParentHovered(false); // Tell the parent to remove hover
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (setParentHovered) setParentHovered(true); // Restore parent's hover when exiting
      }}
    >
      <div
        className={css({
          marginBottom: "1rem",
        })}
      >
        <p className={css({ marginBottom: "0.5rem" })}>
          <strong>
            {entity.fields?.taxonomyName?.["en-US"] || "Unnamed Taxonomy"}
          </strong>
        </p>
        {entity.fields?.taxonomyField1 && (
          <p>{entity.fields?.taxonomyField1?.["en-US"]}</p>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        children.map((child) => (
          <TaxonomyEntry
            key={child.sys.id}
            entity={child}
            setParentHovered={setIsHovered}
          />
        ))
      )}
    </div>
  );
};

export default TaxonomyEntry;
