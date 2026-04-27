import { Font } from '@react-pdf/renderer';

// Use .woff (not .woff2) — fontkit inside react-pdf can fail to decompress
// certain woff2 subset files in the browser ("Offset is outside the bounds of the DataView").
// .woff is supported universally by fontkit without decompression issues.
import p400  from '@fontsource/poppins/files/poppins-latin-400-normal.woff?url';
import p500  from '@fontsource/poppins/files/poppins-latin-500-normal.woff?url';
import p600  from '@fontsource/poppins/files/poppins-latin-600-normal.woff?url';
import p700  from '@fontsource/poppins/files/poppins-latin-700-normal.woff?url';
import p600i from '@fontsource/poppins/files/poppins-latin-600-italic.woff?url';
import i400  from '@fontsource/inter/files/inter-latin-400-normal.woff?url';
import i500  from '@fontsource/inter/files/inter-latin-500-normal.woff?url';
import i600  from '@fontsource/inter/files/inter-latin-600-normal.woff?url';
import i700  from '@fontsource/inter/files/inter-latin-700-normal.woff?url';

Font.register({
  family: 'Poppins',
  fonts: [
    { src: p400,  fontWeight: 400, fontStyle: 'normal' },
    { src: p500,  fontWeight: 500, fontStyle: 'normal' },
    { src: p600,  fontWeight: 600, fontStyle: 'normal' },
    { src: p700,  fontWeight: 700, fontStyle: 'normal' },
    { src: p600i, fontWeight: 600, fontStyle: 'italic' },
  ],
});

Font.register({
  family: 'Inter',
  fonts: [
    { src: i400, fontWeight: 400, fontStyle: 'normal' },
    { src: i500, fontWeight: 500, fontStyle: 'normal' },
    { src: i600, fontWeight: 600, fontStyle: 'normal' },
    { src: i700, fontWeight: 700, fontStyle: 'normal' },
  ],
});
