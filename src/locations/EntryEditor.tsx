import { EditorAppSDK } from '@contentful/app-sdk';
import { Flex } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import Place from '../components/Place';

// all content Types 
type contentType = 'place' | 'placeVariant';

const Entry = () => {
  const sdk = useSDK<EditorAppSDK>();
  const contentModelType: contentType = sdk.contentType.sys.id as contentType; // Content type will be content model id
  const entryID = sdk.ids.entry;
  

  return (
    <Flex>{contentModelType === "place" && 
      <Place entryID={entryID} sdk={sdk} />
    }</Flex>
  );
};

export default Entry;
