export type EntityStatus = "archived" | "changed" | "draft" | "published";
export type ContentfulContentModelTypes = "place" | "poi";

export interface LinkedVariant {
  sys: {
    id: string;
    fieldStatus: {
      "*": {
        [key: string]: EntityStatus;
      };
    };
  };
  fields: {
    name: {
      [key: string]: string;
    };
    description: {
      [key: string]: {
        data: Record<string, unknown>;
        content: Array<{
          data: Record<string, unknown>;
          content: Array<{
            data: Record<string, unknown>;
            marks: Array<{ type: string }>;
            value: string;
            nodeType: string;
          }>;
          nodeType: string;
        }>;
        nodeType: string;
      };
    };
    image: {
      [key: string]: {
        sys: {
          type: "Link";
          linkType: "Asset";
          id: string;
        };
      };
    };
  };
}