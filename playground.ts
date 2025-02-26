const ACCESS_TOKEN = "access_token"
const EXTERNAL_SPACE_ID = "external_space_id"
const ENVIRONMENT_ID = "master"
const locale = "en-US"

const setEntriesData = (data: any) => {
  console.log(data);
}

const getEntryEntries = async (entry: any) => {
  const entries = entry.fields?.entries?.[locale] || [];

  console.log(entries); // returns an object with the entries

  const entryIds = entries.map((entry: any) => {
    return entry.sys.urn.split("/").pop();
  });

  console.log(entryIds); // returns an array of entry ids

  const fetchedEntries = await Promise.all(
    entryIds.map(async (entryId: string) => {
      const response = await fetch(
        `https://api.contentful.com/spaces/${EXTERNAL_SPACE_ID}/environments/${ENVIRONMENT_ID}/entries/${entryId}?${ACCESS_TOKEN}`,
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        }
      );
      return response.json();
    })
  );

  console.log(fetchedEntries); // This return saying resource cannot be found

  setEntriesData(fetchedEntries);
};
