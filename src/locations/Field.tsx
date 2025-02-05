import { useEffect, useState, useCallback } from "react";
import { EntryCard } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { FieldAppSDK } from "@contentful/app-sdk";
import PlaceVariant from "../components/Fields/PlaceVariant";

interface Field {
  // TODO: Define the properties of Field here
  [key: string]: any;
}

type fieldTypes = "linkedVariants";

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const locale = "en-US";
  const [field, setField] = useState<Field>();
  const fieldContentType: fieldTypes = sdk.field.id as fieldTypes;

  useEffect(() => {
    const fetchData = async () => {
      const entry = await sdk.space.getEntry(sdk.ids.entry);
      const fieldOrFields = entry.fields[fieldContentType][locale];

      console.log('Liam: fieldOrFields');
      console.log(fieldOrFields);

      setField(fieldOrFields);
    };

    fetchData();
  }, [sdk, sdk.ids.entry]);

  return (
    <div>
      {fieldContentType === "linkedVariants" ? (
        <>
          <p>Linked Variant Content</p>
          {field &&
            field.fields[fieldContentType][locale].map(
              (fieldItem: Field, index: number) => (
                <PlaceVariant
                  key={index}
                  fieldId={fieldItem.sys.id}
                  sdk={sdk}
                />
              )
            )}
        </>
      ) : (
        <p>Other Content todo: {fieldContentType}</p>
      )}
    </div>
  );
};

export default Field;
