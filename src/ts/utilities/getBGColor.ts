import { ContentfulContentModelTypes } from "../types/ContentfulTypes";

export default function getBGColor(contentType: ContentfulContentModelTypes): string {
  switch (contentType) {
    case 'place':
      return "#98cbff";
    case 'poi':
      return "#cce6ff";
    default:
      return '#FFFFFF'; // Default hex code
  }
}