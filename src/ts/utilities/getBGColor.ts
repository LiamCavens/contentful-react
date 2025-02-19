import { ContentfulContentModelTypes } from "../types/ContentfulTypes";

export default function getBGColor(contentType: ContentfulContentModelTypes): string {
  switch (contentType) {
    case 'place':
      return "#FFFFFF";
    case 'poi':
      return "#98cbff";
    default:
      return '#FFFFFF'; // Default hex code
  }
}