import { ContentfulContentModelTypes } from "../types/ContentfulTypes";

export default function getBGColor(contentType: ContentfulContentModelTypes): string {
  switch (contentType) {
    case 'place':
      return '#FFCCCC';
    case 'poi':
      return '#90EE90';
    default:
      return '#FFFFFF'; // Default hex code
  }
}