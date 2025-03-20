import { EntryProps } from "contentful-management";
import { publishEntry } from "./publishEntry";

/**
 * Creates and publishes an entry in the Contentful shared space
 * @param entryData The data for the new entry
 * @param contentType The content type ID
 * @returns The published entry result or null if creation failed
 */
export const createEntry = async (
  entryData: EntryProps,
  contentType: string
): Promise<any | null> => {
  // Configuration for shared space
  const config = {
    spaceId: import.meta.env.VITE_SHARED_SPACE_ID,
    environmentId: import.meta.env.VITE_SHARED_ENVIRONMENT_ID,
    accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
  };

  try {
    // Create and publish the entry
    const entry = await createContentfulEntry(entryData, contentType, config);
    return await publishEntry(entry, contentType, config);
  } catch (error) {
    console.error("Error in Contentful entry creation process:", error);
    return null;
  }
};

/**
 * Creates a new entry in Contentful
 */
async function createContentfulEntry(
  entryData: EntryProps,
  contentType: string,
  config: { spaceId: string; environmentId: string; accessToken: string }
) {
  const creationUrl = `https://api.contentful.com/spaces/${config.spaceId}/environments/${config.environmentId}/entries`;

  const response = await fetch(creationUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      "X-Contentful-Content-Type": contentType,
    },
    body: JSON.stringify(entryData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Failed to create entry: ${result.message || response.statusText}`
    );
  }

  return result;
}


