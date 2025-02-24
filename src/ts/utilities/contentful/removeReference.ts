import { FieldAppSDK } from "@contentful/app-sdk";

/**
 * Removes a linked reference from the parent entry in Contentful
 * @param sdk - Contentful FieldAppSDK instance
 * @param parentId - ID of the parent entry
 * @param fieldKey - The key of the field containing the reference array (e.g., "linkedreferences")
 * @param linkedReferenceId - ID of the reference to remove
 */

interface Reference {
  sys: {
    type: string;
    linkType: string;
    id: string;
  };
}

export const removeReference = async (
  sdk: FieldAppSDK,
  parentId: string,
  fieldKey: string,
  linkedReferenceId: string,
  masterParentId: string
) => {
  try {
    // Fetch the parent entry
    const parentEntry = await sdk.cma.entry.get({ entryId: parentId });

    // Ensure the field exists and is an array
    const existingReferences: Reference[] =
      parentEntry.fields[fieldKey]?.["en-US"] || [];

    // Find the index of the last occurrence of the reference to remove
    const lastIndex = existingReferences
      .map((ref) => ref.sys.id)
      .lastIndexOf(linkedReferenceId);

    // If the reference is found, remove it
    if (lastIndex !== -1) {
      existingReferences.splice(lastIndex, 1);
    }

    // Update the entry
    parentEntry.fields[fieldKey]["en-US"] = existingReferences;
    await sdk.cma.entry.update({ entryId: parentId }, parentEntry);

    sdk.notifier.success("Reference removed successfully!");

    if (masterParentId) {
      const parentEntryMaster = await sdk.cma.entry.get({
        entryId: masterParentId,
      });

      await sdk.cma.entry.update(
        { entryId: masterParentId },
        parentEntryMaster
      );
    }
  } catch (error) {
    console.error("Error removing linked reference:", error);
    sdk.notifier.error("Failed to remove reference.");
  }
};
