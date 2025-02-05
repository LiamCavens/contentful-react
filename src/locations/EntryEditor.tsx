import { EditorAppSDK } from "@contentful/app-sdk";
import { Flex } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { css } from "emotion";
import Place from "../components/Entries/Place";

// all content Types
type contentType = "place" | "placeVariant";

const Entry = () => {
  const sdk = useSDK<EditorAppSDK>();
  const contentModelType: contentType = sdk.contentType.sys.id as contentType; // Content type will be content model id
  const entryID = sdk.ids.entry;

  return (
    <Flex margin="none">
      {contentModelType === "place" ? (
        <Place entryID={entryID} sdk={sdk} />
      ) : (
        <h1 className={css({ padding: '2rem' })}>Add Component for {contentModelType}</h1>
      )}
    </Flex>
  );
};

export default Entry;
