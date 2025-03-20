/**
 * Publishes an existing Contentful entry
 */
export async function publishEntry(
  entry: any,
  contentType: string,
  config: { spaceId: string; environmentId: string; accessToken: string }
) {
  const entryId = entry.sys.id;
  const version = entry.sys.version;
  const publishUrl = `https://api.contentful.com/spaces/${config.spaceId}/environments/${config.environmentId}/entries/${entryId}/published`;

  console.log('Liam:contentType');
  console.log(contentType);

  const publishedResponse = await fetch(publishUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "X-Contentful-Content-Type": contentType,
      "X-Contentful-Version": version,
    },
  });

  console.log('Liam:publishedResponse');
  console.log(publishedResponse);

  const publishedResult = await publishedResponse.json();

  if (!publishedResponse.ok) {
    throw new Error(
      `Failed to publish entry: ${
        publishedResult.message || publishedResponse.statusText
      }`
    );
  }

  console.log('Liam:publishedResult');
  console.log(publishedResult);

  return publishedResult;
}
