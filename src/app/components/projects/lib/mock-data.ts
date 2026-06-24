import { generatedBackgroundCollections } from "./backgrounds-data";
import { lifestyleImages } from "./lifestyle-data";

// ─── Offer Library ────────────────────────────────────────────────────────────
// Global pool of offers. In the future, this grows via CSV upload.

export const offerLibrary = [

  // ── Honda CR-V ───────────────────────────────────────────────────────────────

  // CR-V LX 2WD
  { id: "crv-lx-2wd-l36",         year: "2026", make: "Honda", model: "CR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-d3c65dcb-f86e-4b13-ad7d-24a023c86c9d.png", stock: 28, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 34, sales: 14, inventory: 28, monthlyPayment: 429, term: 36, totalDueAtSigning: 3999 },
  { id: "crv-lx-2wd-l24",         year: "2026", make: "Honda", model: "CR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-d3c65dcb-f86e-4b13-ad7d-24a023c86c9d.png", stock: 28, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 34, sales: 10, inventory: 28, monthlyPayment: 479, term: 24, totalDueAtSigning: 4199 },
  { id: "crv-lx-2wd-apr60",       year: "2026", make: "Honda", model: "CR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-d3c65dcb-f86e-4b13-ad7d-24a023c86c9d.png", stock: 28, offerType: "APR",     tags: ["National"], pvi: 88, aging: 34, sales:  5, inventory: 28, monthlyPayment: 479, term: 60, totalDueAtSigning:    0 },
  { id: "crv-lx-2wd-apr72",       year: "2026", make: "Honda", model: "CR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-d3c65dcb-f86e-4b13-ad7d-24a023c86c9d.png", stock: 28, offerType: "APR",     tags: ["National"], pvi: 87, aging: 34, sales:  4, inventory: 28, monthlyPayment: 419, term: 72, totalDueAtSigning:    0 },
  { id: "crv-lx-2wd-fin48",       year: "2026", make: "Honda", model: "CR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-d3c65dcb-f86e-4b13-ad7d-24a023c86c9d.png", stock: 28, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 34, sales:  7, inventory: 28, monthlyPayment: 559, term: 48, totalDueAtSigning: 1999 },

  // CR-V LX AWD (crv-lx = existing)
  { id: "crv-lx",                  year: "2026", make: "Honda", model: "CR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-6a3601ca-2c3b-43f8-ba04-1feb0563529f.png", stock:  6, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 91, sales:  3, inventory:  6, monthlyPayment: 999, term: 36, totalDueAtSigning: 8419 },
  { id: "crv-lx-awd-l24",         year: "2026", make: "Honda", model: "CR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-6a3601ca-2c3b-43f8-ba04-1feb0563529f.png", stock:  6, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 91, sales:  2, inventory:  6, monthlyPayment: 1049, term: 24, totalDueAtSigning: 8699 },
  { id: "crv-lx-awd-apr60",       year: "2026", make: "Honda", model: "CR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-6a3601ca-2c3b-43f8-ba04-1feb0563529f.png", stock:  6, offerType: "APR",     tags: ["National"], pvi: 89, aging: 91, sales:  2, inventory:  6, monthlyPayment: 519, term: 60, totalDueAtSigning:    0 },
  { id: "crv-lx-awd-apr72",       year: "2026", make: "Honda", model: "CR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-6a3601ca-2c3b-43f8-ba04-1feb0563529f.png", stock:  6, offerType: "APR",     tags: ["National"], pvi: 88, aging: 91, sales:  1, inventory:  6, monthlyPayment: 459, term: 72, totalDueAtSigning:    0 },
  { id: "crv-lx-awd-fin48",       year: "2026", make: "Honda", model: "CR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-6a3601ca-2c3b-43f8-ba04-1feb0563529f.png", stock:  6, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 91, sales:  2, inventory:  6, monthlyPayment: 579, term: 48, totalDueAtSigning: 1999 },

  // CR-V EX 2WD
  { id: "crv-ex-2wd-l36",         year: "2026", make: "Honda", model: "CR-V", trim: "EX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-3aba28bf-35e7-4186-90c9-8258bd6e3c38.png", stock: 19, offerType: "Lease",   tags: ["Regional"], pvi: 93, aging: 22, sales:  9, inventory: 19, monthlyPayment: 469, term: 36, totalDueAtSigning: 4299 },
  { id: "crv-ex-2wd-l24",         year: "2026", make: "Honda", model: "CR-V", trim: "EX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-3aba28bf-35e7-4186-90c9-8258bd6e3c38.png", stock: 19, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 22, sales:  7, inventory: 19, monthlyPayment: 519, term: 24, totalDueAtSigning: 4499 },
  { id: "crv-ex-2wd-apr60",       year: "2026", make: "Honda", model: "CR-V", trim: "EX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-3aba28bf-35e7-4186-90c9-8258bd6e3c38.png", stock: 19, offerType: "APR",     tags: ["National"], pvi: 90, aging: 22, sales:  4, inventory: 19, monthlyPayment: 529, term: 60, totalDueAtSigning:    0 },
  { id: "crv-ex-2wd-apr72",       year: "2026", make: "Honda", model: "CR-V", trim: "EX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-3aba28bf-35e7-4186-90c9-8258bd6e3c38.png", stock: 19, offerType: "APR",     tags: ["National"], pvi: 89, aging: 22, sales:  3, inventory: 19, monthlyPayment: 469, term: 72, totalDueAtSigning:    0 },
  { id: "crv-ex-2wd-fin48",       year: "2026", make: "Honda", model: "CR-V", trim: "EX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-3aba28bf-35e7-4186-90c9-8258bd6e3c38.png", stock: 19, offerType: "Finance", tags: ["Regional"], pvi: 91, aging: 22, sales:  5, inventory: 19, monthlyPayment: 589, term: 48, totalDueAtSigning: 2199 },

  // CR-V EX-L 2WD
  { id: "crv-exl-2wd-l36",        year: "2026", make: "Honda", model: "CR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ba188901-0704-4685-acdc-cfa6060f399d.png", stock: 14, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 45, sales:  7, inventory: 14, monthlyPayment: 499, term: 36, totalDueAtSigning: 4699 },
  { id: "crv-exl-2wd-l24",        year: "2026", make: "Honda", model: "CR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ba188901-0704-4685-acdc-cfa6060f399d.png", stock: 14, offerType: "Lease",   tags: ["Regional"], pvi: 89, aging: 45, sales:  5, inventory: 14, monthlyPayment: 549, term: 24, totalDueAtSigning: 4899 },
  { id: "crv-exl-2wd-apr60",      year: "2026", make: "Honda", model: "CR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ba188901-0704-4685-acdc-cfa6060f399d.png", stock: 14, offerType: "APR",     tags: ["National"], pvi: 87, aging: 45, sales:  3, inventory: 14, monthlyPayment: 579, term: 60, totalDueAtSigning:    0 },
  { id: "crv-exl-2wd-apr72",      year: "2026", make: "Honda", model: "CR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ba188901-0704-4685-acdc-cfa6060f399d.png", stock: 14, offerType: "APR",     tags: ["National"], pvi: 86, aging: 45, sales:  2, inventory: 14, monthlyPayment: 509, term: 72, totalDueAtSigning:    0 },
  { id: "crv-exl-2wd-fin48",      year: "2026", make: "Honda", model: "CR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ba188901-0704-4685-acdc-cfa6060f399d.png", stock: 14, offerType: "Finance", tags: ["Regional"], pvi: 89, aging: 45, sales:  4, inventory: 14, monthlyPayment: 629, term: 48, totalDueAtSigning: 2299 },

  // CR-V EX-L AWD
  { id: "crv-exl-awd-l36",        year: "2026", make: "Honda", model: "CR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-94cc5e74-04b6-4e57-bb16-98824bc67927.png", stock: 11, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 38, sales:  5, inventory: 11, monthlyPayment: 519, term: 36, totalDueAtSigning: 4999 },
  { id: "crv-exl-awd-l24",        year: "2026", make: "Honda", model: "CR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-94cc5e74-04b6-4e57-bb16-98824bc67927.png", stock: 11, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 38, sales:  4, inventory: 11, monthlyPayment: 569, term: 24, totalDueAtSigning: 5199 },
  { id: "crv-exl-awd-apr60",      year: "2026", make: "Honda", model: "CR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-94cc5e74-04b6-4e57-bb16-98824bc67927.png", stock: 11, offerType: "APR",     tags: ["National"], pvi: 88, aging: 38, sales:  3, inventory: 11, monthlyPayment: 609, term: 60, totalDueAtSigning:    0 },
  { id: "crv-exl-awd-apr72",      year: "2026", make: "Honda", model: "CR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-94cc5e74-04b6-4e57-bb16-98824bc67927.png", stock: 11, offerType: "APR",     tags: ["National"], pvi: 87, aging: 38, sales:  2, inventory: 11, monthlyPayment: 539, term: 72, totalDueAtSigning:    0 },
  { id: "crv-exl-awd-fin48",      year: "2026", make: "Honda", model: "CR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-94cc5e74-04b6-4e57-bb16-98824bc67927.png", stock: 11, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 38, sales:  3, inventory: 11, monthlyPayment: 659, term: 48, totalDueAtSigning: 2399 },

  // CR-V TrailSport AWD (crv-trailsport = existing)
  { id: "crv-trailsport",          year: "2026", make: "Honda", model: "CR-V", trim: "TrailSport AWD",           image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ad4b3522-e1ef-415a-bfca-517f4dfd7d38.png", stock: 16, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 27, sales: 10, inventory: 16, monthlyPayment: 529, term: 36, totalDueAtSigning: 4999 },
  { id: "crv-trailsport-l24",      year: "2026", make: "Honda", model: "CR-V", trim: "TrailSport AWD",           image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ad4b3522-e1ef-415a-bfca-517f4dfd7d38.png", stock: 16, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 27, sales:  7, inventory: 16, monthlyPayment: 579, term: 24, totalDueAtSigning: 5199 },
  { id: "crv-trailsport-apr60",    year: "2026", make: "Honda", model: "CR-V", trim: "TrailSport AWD",           image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ad4b3522-e1ef-415a-bfca-517f4dfd7d38.png", stock: 16, offerType: "APR",     tags: ["National"], pvi: 89, aging: 27, sales:  4, inventory: 16, monthlyPayment: 619, term: 60, totalDueAtSigning:    0 },
  { id: "crv-trailsport-apr72",    year: "2026", make: "Honda", model: "CR-V", trim: "TrailSport AWD",           image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ad4b3522-e1ef-415a-bfca-517f4dfd7d38.png", stock: 16, offerType: "APR",     tags: ["National"], pvi: 88, aging: 27, sales:  3, inventory: 16, monthlyPayment: 549, term: 72, totalDueAtSigning:    0 },
  { id: "crv-trailsport-fin48",    year: "2026", make: "Honda", model: "CR-V", trim: "TrailSport AWD",           image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-ad4b3522-e1ef-415a-bfca-517f4dfd7d38.png", stock: 16, offerType: "Finance", tags: ["Regional"], pvi: 91, aging: 27, sales:  5, inventory: 16, monthlyPayment: 669, term: 48, totalDueAtSigning: 2499 },

  // CR-V Hybrid Sport 2WD
  { id: "crv-hybsport-2wd-l36",    year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport 2WD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-f80c85a8-11cc-46b9-a3f7-5a4af1e819db.png", stock: 23, offerType: "Lease",   tags: ["Regional"], pvi: 94, aging: 19, sales: 12, inventory: 23, monthlyPayment: 549, term: 36, totalDueAtSigning: 5199 },
  { id: "crv-hybsport-2wd-l24",    year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport 2WD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-f80c85a8-11cc-46b9-a3f7-5a4af1e819db.png", stock: 23, offerType: "Lease",   tags: ["Regional"], pvi: 93, aging: 19, sales:  9, inventory: 23, monthlyPayment: 599, term: 24, totalDueAtSigning: 5399 },
  { id: "crv-hybsport-2wd-apr60",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport 2WD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-f80c85a8-11cc-46b9-a3f7-5a4af1e819db.png", stock: 23, offerType: "APR",     tags: ["National"], pvi: 91, aging: 19, sales:  5, inventory: 23, monthlyPayment: 579, term: 60, totalDueAtSigning:    0 },
  { id: "crv-hybsport-2wd-apr72",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport 2WD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-f80c85a8-11cc-46b9-a3f7-5a4af1e819db.png", stock: 23, offerType: "APR",     tags: ["National"], pvi: 90, aging: 19, sales:  4, inventory: 23, monthlyPayment: 519, term: 72, totalDueAtSigning:    0 },
  { id: "crv-hybsport-2wd-fin48",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport 2WD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-f80c85a8-11cc-46b9-a3f7-5a4af1e819db.png", stock: 23, offerType: "Finance", tags: ["Regional"], pvi: 92, aging: 19, sales:  6, inventory: 23, monthlyPayment: 679, term: 48, totalDueAtSigning: 2499 },

  // CR-V Hybrid Sport AWD
  { id: "crv-hybsport-awd-l36",    year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport AWD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-5593f7ed-a7de-42a1-81ba-ba4a021efce7.png", stock: 17, offerType: "Lease",   tags: ["Regional"], pvi: 93, aging: 24, sales:  9, inventory: 17, monthlyPayment: 569, term: 36, totalDueAtSigning: 5399 },
  { id: "crv-hybsport-awd-l24",    year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport AWD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-5593f7ed-a7de-42a1-81ba-ba4a021efce7.png", stock: 17, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 24, sales:  7, inventory: 17, monthlyPayment: 619, term: 24, totalDueAtSigning: 5599 },
  { id: "crv-hybsport-awd-apr60",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport AWD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-5593f7ed-a7de-42a1-81ba-ba4a021efce7.png", stock: 17, offerType: "APR",     tags: ["National"], pvi: 90, aging: 24, sales:  4, inventory: 17, monthlyPayment: 599, term: 60, totalDueAtSigning:    0 },
  { id: "crv-hybsport-awd-apr72",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport AWD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-5593f7ed-a7de-42a1-81ba-ba4a021efce7.png", stock: 17, offerType: "APR",     tags: ["National"], pvi: 89, aging: 24, sales:  3, inventory: 17, monthlyPayment: 539, term: 72, totalDueAtSigning:    0 },
  { id: "crv-hybsport-awd-fin48",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport AWD",         image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-5593f7ed-a7de-42a1-81ba-ba4a021efce7.png", stock: 17, offerType: "Finance", tags: ["Regional"], pvi: 91, aging: 24, sales:  5, inventory: 17, monthlyPayment: 699, term: 48, totalDueAtSigning: 2499 },

  // CR-V Hybrid Sport-L 2WD
  { id: "crv-hybsportl-2wd-l36",   year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L 2WD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-7d58160b-c842-4b30-88de-aea3b9533cd2.png", stock: 12, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 33, sales:  6, inventory: 12, monthlyPayment: 599, term: 36, totalDueAtSigning: 5699 },
  { id: "crv-hybsportl-2wd-l24",   year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L 2WD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-7d58160b-c842-4b30-88de-aea3b9533cd2.png", stock: 12, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 33, sales:  4, inventory: 12, monthlyPayment: 649, term: 24, totalDueAtSigning: 5899 },
  { id: "crv-hybsportl-2wd-apr60", year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L 2WD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-7d58160b-c842-4b30-88de-aea3b9533cd2.png", stock: 12, offerType: "APR",     tags: ["National"], pvi: 89, aging: 33, sales:  3, inventory: 12, monthlyPayment: 619, term: 60, totalDueAtSigning:    0 },
  { id: "crv-hybsportl-2wd-apr72", year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L 2WD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-7d58160b-c842-4b30-88de-aea3b9533cd2.png", stock: 12, offerType: "APR",     tags: ["National"], pvi: 88, aging: 33, sales:  2, inventory: 12, monthlyPayment: 559, term: 72, totalDueAtSigning:    0 },
  { id: "crv-hybsportl-2wd-fin48", year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L 2WD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-7d58160b-c842-4b30-88de-aea3b9533cd2.png", stock: 12, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 33, sales:  3, inventory: 12, monthlyPayment: 729, term: 48, totalDueAtSigning: 2599 },

  // CR-V Hybrid Sport-L AWD
  { id: "crv-hybsportl-awd-l36",   year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L AWD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8fc61cfc-8db0-471c-8d96-d6dc2bac1ef3.png", stock:  9, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 41, sales:  4, inventory:  9, monthlyPayment: 619, term: 36, totalDueAtSigning: 5899 },
  { id: "crv-hybsportl-awd-l24",   year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L AWD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8fc61cfc-8db0-471c-8d96-d6dc2bac1ef3.png", stock:  9, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 41, sales:  3, inventory:  9, monthlyPayment: 669, term: 24, totalDueAtSigning: 6099 },
  { id: "crv-hybsportl-awd-apr60", year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L AWD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8fc61cfc-8db0-471c-8d96-d6dc2bac1ef3.png", stock:  9, offerType: "APR",     tags: ["National"], pvi: 88, aging: 41, sales:  2, inventory:  9, monthlyPayment: 649, term: 60, totalDueAtSigning:    0 },
  { id: "crv-hybsportl-awd-apr72", year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L AWD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8fc61cfc-8db0-471c-8d96-d6dc2bac1ef3.png", stock:  9, offerType: "APR",     tags: ["National"], pvi: 87, aging: 41, sales:  2, inventory:  9, monthlyPayment: 579, term: 72, totalDueAtSigning:    0 },
  { id: "crv-hybsportl-awd-fin48", year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport-L AWD",       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8fc61cfc-8db0-471c-8d96-d6dc2bac1ef3.png", stock:  9, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 41, sales:  3, inventory:  9, monthlyPayment: 749, term: 48, totalDueAtSigning: 2699 },

  // CR-V Hybrid Sport Touring AWD
  { id: "crv-hybsporttour-l36",    year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport Touring AWD", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-0d2f14db-4e19-4df1-8dd4-1535ccbc8535.png", stock:  8, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 55, sales:  3, inventory:  8, monthlyPayment: 649, term: 36, totalDueAtSigning: 6199 },
  { id: "crv-hybsporttour-l24",    year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport Touring AWD", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-0d2f14db-4e19-4df1-8dd4-1535ccbc8535.png", stock:  8, offerType: "Lease",   tags: ["Regional"], pvi: 89, aging: 55, sales:  2, inventory:  8, monthlyPayment: 699, term: 24, totalDueAtSigning: 6399 },
  { id: "crv-hybsporttour-apr60",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport Touring AWD", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-0d2f14db-4e19-4df1-8dd4-1535ccbc8535.png", stock:  8, offerType: "APR",     tags: ["National"], pvi: 87, aging: 55, sales:  2, inventory:  8, monthlyPayment: 689, term: 60, totalDueAtSigning:    0 },
  { id: "crv-hybsporttour-apr72",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport Touring AWD", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-0d2f14db-4e19-4df1-8dd4-1535ccbc8535.png", stock:  8, offerType: "APR",     tags: ["National"], pvi: 86, aging: 55, sales:  1, inventory:  8, monthlyPayment: 609, term: 72, totalDueAtSigning:    0 },
  { id: "crv-hybsporttour-fin48",  year: "2026", make: "Honda", model: "CR-V", trim: "Hybrid Sport Touring AWD", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-0d2f14db-4e19-4df1-8dd4-1535ccbc8535.png", stock:  8, offerType: "Finance", tags: ["Regional"], pvi: 89, aging: 55, sales:  2, inventory:  8, monthlyPayment: 779, term: 48, totalDueAtSigning: 2799 },

  // CR-V e:FCEV 2025
  { id: "crv-efcev25-l36",         year: "2025", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2025/honda/crv/jellybean-47792eee-1e6d-45c2-88a2-eef1879bd731.png", stock:  4, offerType: "Lease",   tags: ["Regional"], pvi: 87, aging: 62, sales:  2, inventory:  4, monthlyPayment: 799, term: 36, totalDueAtSigning: 6999 },
  { id: "crv-efcev25-l24",         year: "2025", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2025/honda/crv/jellybean-47792eee-1e6d-45c2-88a2-eef1879bd731.png", stock:  4, offerType: "Lease",   tags: ["Regional"], pvi: 86, aging: 62, sales:  1, inventory:  4, monthlyPayment: 849, term: 24, totalDueAtSigning: 7199 },
  { id: "crv-efcev25-apr60",       year: "2025", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2025/honda/crv/jellybean-47792eee-1e6d-45c2-88a2-eef1879bd731.png", stock:  4, offerType: "APR",     tags: ["National"], pvi: 84, aging: 62, sales:  1, inventory:  4, monthlyPayment: 889, term: 60, totalDueAtSigning:    0 },
  { id: "crv-efcev25-apr72",       year: "2025", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2025/honda/crv/jellybean-47792eee-1e6d-45c2-88a2-eef1879bd731.png", stock:  4, offerType: "APR",     tags: ["National"], pvi: 83, aging: 62, sales:  1, inventory:  4, monthlyPayment: 769, term: 72, totalDueAtSigning:    0 },
  { id: "crv-efcev25-fin48",       year: "2025", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2025/honda/crv/jellybean-47792eee-1e6d-45c2-88a2-eef1879bd731.png", stock:  4, offerType: "Finance", tags: ["Regional"], pvi: 86, aging: 62, sales:  1, inventory:  4, monthlyPayment: 969, term: 48, totalDueAtSigning: 2999 },

  // CR-V e:FCEV 2026
  { id: "crv-efcev26-l36",         year: "2026", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8cd719f3-71ac-4008-bcb5-cb7d71562a2d.png", stock:  5, offerType: "Lease",   tags: ["Regional"], pvi: 88, aging: 18, sales:  2, inventory:  5, monthlyPayment: 849, term: 36, totalDueAtSigning: 7499 },
  { id: "crv-efcev26-l24",         year: "2026", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8cd719f3-71ac-4008-bcb5-cb7d71562a2d.png", stock:  5, offerType: "Lease",   tags: ["Regional"], pvi: 87, aging: 18, sales:  1, inventory:  5, monthlyPayment: 899, term: 24, totalDueAtSigning: 7699 },
  { id: "crv-efcev26-apr60",       year: "2026", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8cd719f3-71ac-4008-bcb5-cb7d71562a2d.png", stock:  5, offerType: "APR",     tags: ["National"], pvi: 85, aging: 18, sales:  1, inventory:  5, monthlyPayment: 939, term: 60, totalDueAtSigning:    0 },
  { id: "crv-efcev26-apr72",       year: "2026", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8cd719f3-71ac-4008-bcb5-cb7d71562a2d.png", stock:  5, offerType: "APR",     tags: ["National"], pvi: 84, aging: 18, sales:  1, inventory:  5, monthlyPayment: 819, term: 72, totalDueAtSigning:    0 },
  { id: "crv-efcev26-fin48",       year: "2026", make: "Honda", model: "CR-V", trim: "e:FCEV",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/crv/jellybean-8cd719f3-71ac-4008-bcb5-cb7d71562a2d.png", stock:  5, offerType: "Finance", tags: ["Regional"], pvi: 87, aging: 18, sales:  1, inventory:  5, monthlyPayment: 1019, term: 48, totalDueAtSigning: 2999 },

  // ── Honda Civic ──────────────────────────────────────────────────────────────

  // Civic LX CVT
  { id: "civic-lx-cvt-l36",        year: "2026", make: "Honda", model: "Civic", trim: "LX CVT",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-f08526e9-a9cc-4489-90c2-ba48dcf97f06.png", stock: 31, offerType: "Lease",   tags: ["Regional"], pvi: 95, aging: 21, sales: 19, inventory: 31, monthlyPayment: 299, term: 36, totalDueAtSigning: 2699 },
  { id: "civic-lx-cvt-l24",        year: "2026", make: "Honda", model: "Civic", trim: "LX CVT",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-f08526e9-a9cc-4489-90c2-ba48dcf97f06.png", stock: 31, offerType: "Lease",   tags: ["Regional"], pvi: 94, aging: 21, sales: 14, inventory: 31, monthlyPayment: 339, term: 24, totalDueAtSigning: 2899 },
  { id: "civic-lx-cvt-apr60",      year: "2026", make: "Honda", model: "Civic", trim: "LX CVT",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-f08526e9-a9cc-4489-90c2-ba48dcf97f06.png", stock: 31, offerType: "APR",     tags: ["National"], pvi: 92, aging: 21, sales:  8, inventory: 31, monthlyPayment: 399, term: 60, totalDueAtSigning:    0 },
  { id: "civic-lx-cvt-apr72",      year: "2026", make: "Honda", model: "Civic", trim: "LX CVT",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-f08526e9-a9cc-4489-90c2-ba48dcf97f06.png", stock: 31, offerType: "APR",     tags: ["National"], pvi: 91, aging: 21, sales:  6, inventory: 31, monthlyPayment: 349, term: 72, totalDueAtSigning:    0 },
  { id: "civic-lx-cvt-fin48",      year: "2026", make: "Honda", model: "Civic", trim: "LX CVT",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-f08526e9-a9cc-4489-90c2-ba48dcf97f06.png", stock: 31, offerType: "Finance", tags: ["Regional"], pvi: 93, aging: 21, sales:  9, inventory: 31, monthlyPayment: 449, term: 48, totalDueAtSigning: 1999 },

  // Civic Sport CVT
  { id: "civic-sport-cvt-l36",     year: "2026", make: "Honda", model: "Civic", trim: "Sport CVT",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-298efd50-a285-49b4-9a0b-9c7747649dd1.png", stock: 24, offerType: "Lease",   tags: ["Regional"], pvi: 94, aging: 28, sales: 14, inventory: 24, monthlyPayment: 329, term: 36, totalDueAtSigning: 2999 },
  { id: "civic-sport-cvt-l24",     year: "2026", make: "Honda", model: "Civic", trim: "Sport CVT",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-298efd50-a285-49b4-9a0b-9c7747649dd1.png", stock: 24, offerType: "Lease",   tags: ["Regional"], pvi: 93, aging: 28, sales: 10, inventory: 24, monthlyPayment: 369, term: 24, totalDueAtSigning: 3199 },
  { id: "civic-sport-cvt-apr60",   year: "2026", make: "Honda", model: "Civic", trim: "Sport CVT",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-298efd50-a285-49b4-9a0b-9c7747649dd1.png", stock: 24, offerType: "APR",     tags: ["National"], pvi: 91, aging: 28, sales:  6, inventory: 24, monthlyPayment: 429, term: 60, totalDueAtSigning:    0 },
  { id: "civic-sport-cvt-apr72",   year: "2026", make: "Honda", model: "Civic", trim: "Sport CVT",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-298efd50-a285-49b4-9a0b-9c7747649dd1.png", stock: 24, offerType: "APR",     tags: ["National"], pvi: 90, aging: 28, sales:  5, inventory: 24, monthlyPayment: 379, term: 72, totalDueAtSigning:    0 },
  { id: "civic-sport-cvt-fin48",   year: "2026", make: "Honda", model: "Civic", trim: "Sport CVT",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-298efd50-a285-49b4-9a0b-9c7747649dd1.png", stock: 24, offerType: "Finance", tags: ["Regional"], pvi: 92, aging: 28, sales:  7, inventory: 24, monthlyPayment: 479, term: 48, totalDueAtSigning: 1999 },

  // Civic Si
  { id: "civic-si-l36",            year: "2026", make: "Honda", model: "Civic", trim: "Si",                      image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-1bf66fd8-4177-442d-9889-963dd97dc42a.png", stock: 12, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 44, sales:  6, inventory: 12, monthlyPayment: 379, term: 36, totalDueAtSigning: 3299 },
  { id: "civic-si-l24",            year: "2026", make: "Honda", model: "Civic", trim: "Si",                      image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-1bf66fd8-4177-442d-9889-963dd97dc42a.png", stock: 12, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 44, sales:  4, inventory: 12, monthlyPayment: 419, term: 24, totalDueAtSigning: 3499 },
  { id: "civic-si-apr60",          year: "2026", make: "Honda", model: "Civic", trim: "Si",                      image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-1bf66fd8-4177-442d-9889-963dd97dc42a.png", stock: 12, offerType: "APR",     tags: ["National"], pvi: 88, aging: 44, sales:  3, inventory: 12, monthlyPayment: 489, term: 60, totalDueAtSigning:    0 },
  { id: "civic-si-apr72",          year: "2026", make: "Honda", model: "Civic", trim: "Si",                      image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-1bf66fd8-4177-442d-9889-963dd97dc42a.png", stock: 12, offerType: "APR",     tags: ["National"], pvi: 87, aging: 44, sales:  2, inventory: 12, monthlyPayment: 429, term: 72, totalDueAtSigning:    0 },
  { id: "civic-si-fin48",          year: "2026", make: "Honda", model: "Civic", trim: "Si",                      image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-1bf66fd8-4177-442d-9889-963dd97dc42a.png", stock: 12, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 44, sales:  3, inventory: 12, monthlyPayment: 549, term: 48, totalDueAtSigning: 2199 },

  // Civic Sport Hybrid CVT
  { id: "civic-sporthyb-l36",      year: "2026", make: "Honda", model: "Civic", trim: "Sport Hybrid CVT",        image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-d8555048-ecd3-43f3-95bc-cf2fde4b7386.png", stock: 18, offerType: "Lease",   tags: ["Regional"], pvi: 93, aging: 31, sales:  9, inventory: 18, monthlyPayment: 359, term: 36, totalDueAtSigning: 3099 },
  { id: "civic-sporthyb-l24",      year: "2026", make: "Honda", model: "Civic", trim: "Sport Hybrid CVT",        image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-d8555048-ecd3-43f3-95bc-cf2fde4b7386.png", stock: 18, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 31, sales:  7, inventory: 18, monthlyPayment: 399, term: 24, totalDueAtSigning: 3299 },
  { id: "civic-sporthyb-apr60",    year: "2026", make: "Honda", model: "Civic", trim: "Sport Hybrid CVT",        image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-d8555048-ecd3-43f3-95bc-cf2fde4b7386.png", stock: 18, offerType: "APR",     tags: ["National"], pvi: 90, aging: 31, sales:  4, inventory: 18, monthlyPayment: 459, term: 60, totalDueAtSigning:    0 },
  { id: "civic-sporthyb-apr72",    year: "2026", make: "Honda", model: "Civic", trim: "Sport Hybrid CVT",        image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-d8555048-ecd3-43f3-95bc-cf2fde4b7386.png", stock: 18, offerType: "APR",     tags: ["National"], pvi: 89, aging: 31, sales:  3, inventory: 18, monthlyPayment: 409, term: 72, totalDueAtSigning:    0 },
  { id: "civic-sporthyb-fin48",    year: "2026", make: "Honda", model: "Civic", trim: "Sport Hybrid CVT",        image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-d8555048-ecd3-43f3-95bc-cf2fde4b7386.png", stock: 18, offerType: "Finance", tags: ["Regional"], pvi: 91, aging: 31, sales:  5, inventory: 18, monthlyPayment: 509, term: 48, totalDueAtSigning: 1999 },

  // Civic Sport Touring Hybrid CVT (civic-hybrid = existing)
  { id: "civic-hybrid",            year: "2026", make: "Honda", model: "Civic", trim: "Sport Touring Hybrid CVT", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-dbba5cf0-fab9-4286-b7a3-0e0bd3ef23ea.png", stock: 10, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 71, sales:  6, inventory: 10, monthlyPayment: 799, term: 36, totalDueAtSigning: 7099 },
  { id: "civic-spttour-l24",       year: "2026", make: "Honda", model: "Civic", trim: "Sport Touring Hybrid CVT", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-dbba5cf0-fab9-4286-b7a3-0e0bd3ef23ea.png", stock: 10, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 71, sales:  4, inventory: 10, monthlyPayment: 849, term: 24, totalDueAtSigning: 7299 },
  { id: "civic-spttour-apr60",     year: "2026", make: "Honda", model: "Civic", trim: "Sport Touring Hybrid CVT", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-dbba5cf0-fab9-4286-b7a3-0e0bd3ef23ea.png", stock: 10, offerType: "APR",     tags: ["National"], pvi: 89, aging: 71, sales:  2, inventory: 10, monthlyPayment: 549, term: 60, totalDueAtSigning:    0 },
  { id: "civic-spttour-apr72",     year: "2026", make: "Honda", model: "Civic", trim: "Sport Touring Hybrid CVT", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-dbba5cf0-fab9-4286-b7a3-0e0bd3ef23ea.png", stock: 10, offerType: "APR",     tags: ["National"], pvi: 88, aging: 71, sales:  2, inventory: 10, monthlyPayment: 489, term: 72, totalDueAtSigning:    0 },
  { id: "civic-spttour-fin48",     year: "2026", make: "Honda", model: "Civic", trim: "Sport Touring Hybrid CVT", image: "https://public.dev-app.constech.io/jellybeans/2026/honda/civic/jellybean-dbba5cf0-fab9-4286-b7a3-0e0bd3ef23ea.png", stock: 10, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 71, sales:  3, inventory: 10, monthlyPayment: 609, term: 48, totalDueAtSigning: 2499 },

  // ── Honda HR-V ───────────────────────────────────────────────────────────────

  // HR-V LX
  { id: "hrv-lx-l36",              year: "2026", make: "Honda", model: "HR-V", trim: "LX",                       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a28957f3-10c6-4961-88fa-c623c2ad2d40.png", stock: 26, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 29, sales: 13, inventory: 26, monthlyPayment: 349, term: 36, totalDueAtSigning: 2999 },
  { id: "hrv-lx-l24",              year: "2026", make: "Honda", model: "HR-V", trim: "LX",                       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a28957f3-10c6-4961-88fa-c623c2ad2d40.png", stock: 26, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 29, sales:  9, inventory: 26, monthlyPayment: 389, term: 24, totalDueAtSigning: 3199 },
  { id: "hrv-lx-apr60",            year: "2026", make: "Honda", model: "HR-V", trim: "LX",                       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a28957f3-10c6-4961-88fa-c623c2ad2d40.png", stock: 26, offerType: "APR",     tags: ["National"], pvi: 89, aging: 29, sales:  6, inventory: 26, monthlyPayment: 409, term: 60, totalDueAtSigning:    0 },
  { id: "hrv-lx-apr72",            year: "2026", make: "Honda", model: "HR-V", trim: "LX",                       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a28957f3-10c6-4961-88fa-c623c2ad2d40.png", stock: 26, offerType: "APR",     tags: ["National"], pvi: 88, aging: 29, sales:  5, inventory: 26, monthlyPayment: 359, term: 72, totalDueAtSigning:    0 },
  { id: "hrv-lx-fin48",            year: "2026", make: "Honda", model: "HR-V", trim: "LX",                       image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a28957f3-10c6-4961-88fa-c623c2ad2d40.png", stock: 26, offerType: "Finance", tags: ["Regional"], pvi: 91, aging: 29, sales:  7, inventory: 26, monthlyPayment: 459, term: 48, totalDueAtSigning: 1999 },

  // HR-V LX 2WD
  { id: "hrv-lx-2wd-l36",          year: "2026", make: "Honda", model: "HR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a9997e3c-1636-4bd7-a765-ced399353265.png", stock: 22, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 37, sales: 11, inventory: 22, monthlyPayment: 359, term: 36, totalDueAtSigning: 3099 },
  { id: "hrv-lx-2wd-l24",          year: "2026", make: "Honda", model: "HR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a9997e3c-1636-4bd7-a765-ced399353265.png", stock: 22, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 37, sales:  8, inventory: 22, monthlyPayment: 399, term: 24, totalDueAtSigning: 3299 },
  { id: "hrv-lx-2wd-apr60",        year: "2026", make: "Honda", model: "HR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a9997e3c-1636-4bd7-a765-ced399353265.png", stock: 22, offerType: "APR",     tags: ["National"], pvi: 88, aging: 37, sales:  5, inventory: 22, monthlyPayment: 419, term: 60, totalDueAtSigning:    0 },
  { id: "hrv-lx-2wd-apr72",        year: "2026", make: "Honda", model: "HR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a9997e3c-1636-4bd7-a765-ced399353265.png", stock: 22, offerType: "APR",     tags: ["National"], pvi: 87, aging: 37, sales:  4, inventory: 22, monthlyPayment: 369, term: 72, totalDueAtSigning:    0 },
  { id: "hrv-lx-2wd-fin48",        year: "2026", make: "Honda", model: "HR-V", trim: "LX 2WD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-a9997e3c-1636-4bd7-a765-ced399353265.png", stock: 22, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 37, sales:  6, inventory: 22, monthlyPayment: 469, term: 48, totalDueAtSigning: 1999 },

  // HR-V LX AWD
  { id: "hrv-lx-awd-l36",          year: "2026", make: "Honda", model: "HR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-8033f78a-7b80-43aa-80c8-b9330e64b2d8.png", stock: 19, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 43, sales:  9, inventory: 19, monthlyPayment: 379, term: 36, totalDueAtSigning: 3299 },
  { id: "hrv-lx-awd-l24",          year: "2026", make: "Honda", model: "HR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-8033f78a-7b80-43aa-80c8-b9330e64b2d8.png", stock: 19, offerType: "Lease",   tags: ["Regional"], pvi: 89, aging: 43, sales:  7, inventory: 19, monthlyPayment: 419, term: 24, totalDueAtSigning: 3499 },
  { id: "hrv-lx-awd-apr60",        year: "2026", make: "Honda", model: "HR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-8033f78a-7b80-43aa-80c8-b9330e64b2d8.png", stock: 19, offerType: "APR",     tags: ["National"], pvi: 87, aging: 43, sales:  4, inventory: 19, monthlyPayment: 439, term: 60, totalDueAtSigning:    0 },
  { id: "hrv-lx-awd-apr72",        year: "2026", make: "Honda", model: "HR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-8033f78a-7b80-43aa-80c8-b9330e64b2d8.png", stock: 19, offerType: "APR",     tags: ["National"], pvi: 86, aging: 43, sales:  3, inventory: 19, monthlyPayment: 389, term: 72, totalDueAtSigning:    0 },
  { id: "hrv-lx-awd-fin48",        year: "2026", make: "Honda", model: "HR-V", trim: "LX AWD",                   image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-8033f78a-7b80-43aa-80c8-b9330e64b2d8.png", stock: 19, offerType: "Finance", tags: ["Regional"], pvi: 89, aging: 43, sales:  5, inventory: 19, monthlyPayment: 489, term: 48, totalDueAtSigning: 1999 },

  // HR-V Sport 2WD (hrv-sport = existing)
  { id: "hrv-sport",               year: "2026", make: "Honda", model: "HR-V", trim: "Sport 2WD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-50361aba-e638-49cc-9541-d3df45878d48.png", stock: 24, offerType: "Lease",   tags: ["Regional"], pvi: 93, aging: 70, sales:  9, inventory: 24, monthlyPayment: 699, term: 36, totalDueAtSigning: 5259 },
  { id: "hrv-sport-l24",           year: "2026", make: "Honda", model: "HR-V", trim: "Sport 2WD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-50361aba-e638-49cc-9541-d3df45878d48.png", stock: 24, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 70, sales:  6, inventory: 24, monthlyPayment: 749, term: 24, totalDueAtSigning: 5459 },
  { id: "hrv-sport-apr60",         year: "2026", make: "Honda", model: "HR-V", trim: "Sport 2WD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-50361aba-e638-49cc-9541-d3df45878d48.png", stock: 24, offerType: "APR",     tags: ["National"], pvi: 90, aging: 70, sales:  4, inventory: 24, monthlyPayment: 459, term: 60, totalDueAtSigning:    0 },
  { id: "hrv-sport-apr72",         year: "2026", make: "Honda", model: "HR-V", trim: "Sport 2WD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-50361aba-e638-49cc-9541-d3df45878d48.png", stock: 24, offerType: "APR",     tags: ["National"], pvi: 89, aging: 70, sales:  3, inventory: 24, monthlyPayment: 409, term: 72, totalDueAtSigning:    0 },
  { id: "hrv-sport-fin48",         year: "2026", make: "Honda", model: "HR-V", trim: "Sport 2WD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-50361aba-e638-49cc-9541-d3df45878d48.png", stock: 24, offerType: "Finance", tags: ["Regional"], pvi: 91, aging: 70, sales:  5, inventory: 24, monthlyPayment: 519, term: 48, totalDueAtSigning: 2199 },

  // HR-V Sport AWD
  { id: "hrv-sport-awd-l36",       year: "2026", make: "Honda", model: "HR-V", trim: "Sport AWD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-c4357bcb-d5c2-4b9b-a825-60ce5f0bf014.png", stock: 16, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 26, sales:  8, inventory: 16, monthlyPayment: 449, term: 36, totalDueAtSigning: 3999 },
  { id: "hrv-sport-awd-l24",       year: "2026", make: "Honda", model: "HR-V", trim: "Sport AWD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-c4357bcb-d5c2-4b9b-a825-60ce5f0bf014.png", stock: 16, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 26, sales:  6, inventory: 16, monthlyPayment: 489, term: 24, totalDueAtSigning: 4199 },
  { id: "hrv-sport-awd-apr60",     year: "2026", make: "Honda", model: "HR-V", trim: "Sport AWD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-c4357bcb-d5c2-4b9b-a825-60ce5f0bf014.png", stock: 16, offerType: "APR",     tags: ["National"], pvi: 89, aging: 26, sales:  4, inventory: 16, monthlyPayment: 479, term: 60, totalDueAtSigning:    0 },
  { id: "hrv-sport-awd-apr72",     year: "2026", make: "Honda", model: "HR-V", trim: "Sport AWD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-c4357bcb-d5c2-4b9b-a825-60ce5f0bf014.png", stock: 16, offerType: "APR",     tags: ["National"], pvi: 88, aging: 26, sales:  3, inventory: 16, monthlyPayment: 429, term: 72, totalDueAtSigning:    0 },
  { id: "hrv-sport-awd-fin48",     year: "2026", make: "Honda", model: "HR-V", trim: "Sport AWD",                image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-c4357bcb-d5c2-4b9b-a825-60ce5f0bf014.png", stock: 16, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 26, sales:  5, inventory: 16, monthlyPayment: 539, term: 48, totalDueAtSigning: 2199 },

  // HR-V EX-L 2WD
  { id: "hrv-exl-2wd-l36",         year: "2026", make: "Honda", model: "HR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-82df1d21-ecb8-4a4d-9e3b-d1ff76353052.png", stock: 13, offerType: "Lease",   tags: ["Regional"], pvi: 89, aging: 48, sales:  5, inventory: 13, monthlyPayment: 449, term: 36, totalDueAtSigning: 3999 },
  { id: "hrv-exl-2wd-l24",         year: "2026", make: "Honda", model: "HR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-82df1d21-ecb8-4a4d-9e3b-d1ff76353052.png", stock: 13, offerType: "Lease",   tags: ["Regional"], pvi: 88, aging: 48, sales:  4, inventory: 13, monthlyPayment: 489, term: 24, totalDueAtSigning: 4199 },
  { id: "hrv-exl-2wd-apr60",       year: "2026", make: "Honda", model: "HR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-82df1d21-ecb8-4a4d-9e3b-d1ff76353052.png", stock: 13, offerType: "APR",     tags: ["National"], pvi: 86, aging: 48, sales:  3, inventory: 13, monthlyPayment: 489, term: 60, totalDueAtSigning:    0 },
  { id: "hrv-exl-2wd-apr72",       year: "2026", make: "Honda", model: "HR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-82df1d21-ecb8-4a4d-9e3b-d1ff76353052.png", stock: 13, offerType: "APR",     tags: ["National"], pvi: 85, aging: 48, sales:  2, inventory: 13, monthlyPayment: 439, term: 72, totalDueAtSigning:    0 },
  { id: "hrv-exl-2wd-fin48",       year: "2026", make: "Honda", model: "HR-V", trim: "EX-L 2WD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-82df1d21-ecb8-4a4d-9e3b-d1ff76353052.png", stock: 13, offerType: "Finance", tags: ["Regional"], pvi: 88, aging: 48, sales:  3, inventory: 13, monthlyPayment: 549, term: 48, totalDueAtSigning: 2199 },

  // HR-V EX-L AWD
  { id: "hrv-exl-awd-l36",         year: "2026", make: "Honda", model: "HR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-9e72bcdf-340f-48ce-9024-4403630ec544.png", stock: 10, offerType: "Lease",   tags: ["Regional"], pvi: 88, aging: 55, sales:  4, inventory: 10, monthlyPayment: 469, term: 36, totalDueAtSigning: 4199 },
  { id: "hrv-exl-awd-l24",         year: "2026", make: "Honda", model: "HR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-9e72bcdf-340f-48ce-9024-4403630ec544.png", stock: 10, offerType: "Lease",   tags: ["Regional"], pvi: 87, aging: 55, sales:  3, inventory: 10, monthlyPayment: 509, term: 24, totalDueAtSigning: 4399 },
  { id: "hrv-exl-awd-apr60",       year: "2026", make: "Honda", model: "HR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-9e72bcdf-340f-48ce-9024-4403630ec544.png", stock: 10, offerType: "APR",     tags: ["National"], pvi: 85, aging: 55, sales:  2, inventory: 10, monthlyPayment: 519, term: 60, totalDueAtSigning:    0 },
  { id: "hrv-exl-awd-apr72",       year: "2026", make: "Honda", model: "HR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-9e72bcdf-340f-48ce-9024-4403630ec544.png", stock: 10, offerType: "APR",     tags: ["National"], pvi: 84, aging: 55, sales:  2, inventory: 10, monthlyPayment: 459, term: 72, totalDueAtSigning:    0 },
  { id: "hrv-exl-awd-fin48",       year: "2026", make: "Honda", model: "HR-V", trim: "EX-L AWD",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/hrv/jellybean-9e72bcdf-340f-48ce-9024-4403630ec544.png", stock: 10, offerType: "Finance", tags: ["Regional"], pvi: 87, aging: 55, sales:  3, inventory: 10, monthlyPayment: 579, term: 48, totalDueAtSigning: 2299 },

  // ── Honda Odyssey ─────────────────────────────────────────────────────────────

  // Odyssey Sport L 2025
  { id: "odyssey-sportl25-l39",    year: "2025", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2025/honda/odyssey/jellybean-41f49c4f-ae65-44dd-a407-fbffca32b5ea.png", stock:  8, offerType: "Lease",   tags: ["Regional"], pvi: 87, aging: 81, sales:  3, inventory:  8, monthlyPayment: 599, term: 39, totalDueAtSigning: 4999 },
  { id: "odyssey-sportl25-l27",    year: "2025", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2025/honda/odyssey/jellybean-41f49c4f-ae65-44dd-a407-fbffca32b5ea.png", stock:  8, offerType: "Lease",   tags: ["Regional"], pvi: 86, aging: 81, sales:  2, inventory:  8, monthlyPayment: 639, term: 27, totalDueAtSigning: 5199 },
  { id: "odyssey-sportl25-apr60",  year: "2025", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2025/honda/odyssey/jellybean-41f49c4f-ae65-44dd-a407-fbffca32b5ea.png", stock:  8, offerType: "APR",     tags: ["National"], pvi: 84, aging: 81, sales:  1, inventory:  8, monthlyPayment: 649, term: 60, totalDueAtSigning:    0 },
  { id: "odyssey-sportl25-apr72",  year: "2025", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2025/honda/odyssey/jellybean-41f49c4f-ae65-44dd-a407-fbffca32b5ea.png", stock:  8, offerType: "APR",     tags: ["National"], pvi: 83, aging: 81, sales:  1, inventory:  8, monthlyPayment: 579, term: 72, totalDueAtSigning:    0 },
  { id: "odyssey-sportl25-fin48",  year: "2025", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2025/honda/odyssey/jellybean-41f49c4f-ae65-44dd-a407-fbffca32b5ea.png", stock:  8, offerType: "Finance", tags: ["Regional"], pvi: 86, aging: 81, sales:  2, inventory:  8, monthlyPayment: 699, term: 48, totalDueAtSigning: 2499 },

  // Odyssey Sport L 2026
  { id: "odyssey-sportl-l39",      year: "2026", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-b3edc5fd-d7b0-4883-8bf9-fe445f400518.png", stock: 14, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 35, sales:  6, inventory: 14, monthlyPayment: 619, term: 39, totalDueAtSigning: 5199 },
  { id: "odyssey-sportl-l27",      year: "2026", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-b3edc5fd-d7b0-4883-8bf9-fe445f400518.png", stock: 14, offerType: "Lease",   tags: ["Regional"], pvi: 89, aging: 35, sales:  4, inventory: 14, monthlyPayment: 659, term: 27, totalDueAtSigning: 5399 },
  { id: "odyssey-sportl-apr60",    year: "2026", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-b3edc5fd-d7b0-4883-8bf9-fe445f400518.png", stock: 14, offerType: "APR",     tags: ["National"], pvi: 87, aging: 35, sales:  3, inventory: 14, monthlyPayment: 669, term: 60, totalDueAtSigning:    0 },
  { id: "odyssey-sportl-apr72",    year: "2026", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-b3edc5fd-d7b0-4883-8bf9-fe445f400518.png", stock: 14, offerType: "APR",     tags: ["National"], pvi: 86, aging: 35, sales:  2, inventory: 14, monthlyPayment: 599, term: 72, totalDueAtSigning:    0 },
  { id: "odyssey-sportl-fin48",    year: "2026", make: "Honda", model: "Odyssey", trim: "Sport L",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-b3edc5fd-d7b0-4883-8bf9-fe445f400518.png", stock: 14, offerType: "Finance", tags: ["Regional"], pvi: 89, aging: 35, sales:  4, inventory: 14, monthlyPayment: 719, term: 48, totalDueAtSigning: 2499 },

  // Odyssey EX-L 2026 (odyssey-exl = existing)
  { id: "odyssey-exl",             year: "2026", make: "Honda", model: "Odyssey", trim: "EX-L",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-dd433a83-3a52-4f0e-9d1a-0949179bc052.png", stock: 25, offerType: "Lease",   tags: ["Regional"], pvi: 96, aging: 77, sales: 33, inventory: 25, monthlyPayment: 999, term: 39, totalDueAtSigning: 7199 },
  { id: "odyssey-exl-l27",         year: "2026", make: "Honda", model: "Odyssey", trim: "EX-L",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-dd433a83-3a52-4f0e-9d1a-0949179bc052.png", stock: 25, offerType: "Lease",   tags: ["Regional"], pvi: 95, aging: 77, sales: 22, inventory: 25, monthlyPayment: 1049, term: 27, totalDueAtSigning: 7399 },
  { id: "odyssey-exl-apr60",       year: "2026", make: "Honda", model: "Odyssey", trim: "EX-L",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-dd433a83-3a52-4f0e-9d1a-0949179bc052.png", stock: 25, offerType: "APR",     tags: ["National"], pvi: 93, aging: 77, sales: 11, inventory: 25, monthlyPayment: 749, term: 60, totalDueAtSigning:    0 },
  { id: "odyssey-exl-apr72",       year: "2026", make: "Honda", model: "Odyssey", trim: "EX-L",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-dd433a83-3a52-4f0e-9d1a-0949179bc052.png", stock: 25, offerType: "APR",     tags: ["National"], pvi: 92, aging: 77, sales:  8, inventory: 25, monthlyPayment: 669, term: 72, totalDueAtSigning:    0 },
  { id: "odyssey-exl-fin48",       year: "2026", make: "Honda", model: "Odyssey", trim: "EX-L",                  image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-dd433a83-3a52-4f0e-9d1a-0949179bc052.png", stock: 25, offerType: "Finance", tags: ["Regional"], pvi: 94, aging: 77, sales: 14, inventory: 25, monthlyPayment: 799, term: 48, totalDueAtSigning: 2699 },

  // Odyssey Touring 2026
  { id: "odyssey-touring-l39",     year: "2026", make: "Honda", model: "Odyssey", trim: "Touring",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-ebf215a9-1e48-4b9e-9ecd-a24a8b5a1741.png", stock: 11, offerType: "Lease",   tags: ["Regional"], pvi: 93, aging: 42, sales:  5, inventory: 11, monthlyPayment: 769, term: 39, totalDueAtSigning: 6499 },
  { id: "odyssey-touring-l27",     year: "2026", make: "Honda", model: "Odyssey", trim: "Touring",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-ebf215a9-1e48-4b9e-9ecd-a24a8b5a1741.png", stock: 11, offerType: "Lease",   tags: ["Regional"], pvi: 92, aging: 42, sales:  4, inventory: 11, monthlyPayment: 819, term: 27, totalDueAtSigning: 6699 },
  { id: "odyssey-touring-apr60",   year: "2026", make: "Honda", model: "Odyssey", trim: "Touring",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-ebf215a9-1e48-4b9e-9ecd-a24a8b5a1741.png", stock: 11, offerType: "APR",     tags: ["National"], pvi: 90, aging: 42, sales:  3, inventory: 11, monthlyPayment: 819, term: 60, totalDueAtSigning:    0 },
  { id: "odyssey-touring-apr72",   year: "2026", make: "Honda", model: "Odyssey", trim: "Touring",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-ebf215a9-1e48-4b9e-9ecd-a24a8b5a1741.png", stock: 11, offerType: "APR",     tags: ["National"], pvi: 89, aging: 42, sales:  2, inventory: 11, monthlyPayment: 729, term: 72, totalDueAtSigning:    0 },
  { id: "odyssey-touring-fin48",   year: "2026", make: "Honda", model: "Odyssey", trim: "Touring",               image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-ebf215a9-1e48-4b9e-9ecd-a24a8b5a1741.png", stock: 11, offerType: "Finance", tags: ["Regional"], pvi: 91, aging: 42, sales:  3, inventory: 11, monthlyPayment: 879, term: 48, totalDueAtSigning: 2799 },

  // Odyssey Elite 2026
  { id: "odyssey-elite-l39",       year: "2026", make: "Honda", model: "Odyssey", trim: "Elite",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-d581ad20-bfc6-474f-a591-908d2bb3fd86.png", stock:  7, offerType: "Lease",   tags: ["Regional"], pvi: 91, aging: 58, sales:  3, inventory:  7, monthlyPayment: 849, term: 39, totalDueAtSigning: 6999 },
  { id: "odyssey-elite-l27",       year: "2026", make: "Honda", model: "Odyssey", trim: "Elite",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-d581ad20-bfc6-474f-a591-908d2bb3fd86.png", stock:  7, offerType: "Lease",   tags: ["Regional"], pvi: 90, aging: 58, sales:  2, inventory:  7, monthlyPayment: 899, term: 27, totalDueAtSigning: 7199 },
  { id: "odyssey-elite-apr60",     year: "2026", make: "Honda", model: "Odyssey", trim: "Elite",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-d581ad20-bfc6-474f-a591-908d2bb3fd86.png", stock:  7, offerType: "APR",     tags: ["National"], pvi: 88, aging: 58, sales:  2, inventory:  7, monthlyPayment: 889, term: 60, totalDueAtSigning:    0 },
  { id: "odyssey-elite-apr72",     year: "2026", make: "Honda", model: "Odyssey", trim: "Elite",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-d581ad20-bfc6-474f-a591-908d2bb3fd86.png", stock:  7, offerType: "APR",     tags: ["National"], pvi: 87, aging: 58, sales:  1, inventory:  7, monthlyPayment: 789, term: 72, totalDueAtSigning:    0 },
  { id: "odyssey-elite-fin48",     year: "2026", make: "Honda", model: "Odyssey", trim: "Elite",                 image: "https://public.dev-app.constech.io/jellybeans/2026/honda/odyssey/jellybean-d581ad20-bfc6-474f-a591-908d2bb3fd86.png", stock:  7, offerType: "Finance", tags: ["Regional"], pvi: 90, aging: 58, sales:  2, inventory:  7, monthlyPayment: 949, term: 48, totalDueAtSigning: 2999 },

  // ── BMW ──────────────────────────────────────────────────────────────────────
  { id: "bmw-m5-touring",          year: "2026", make: "BMW", model: "M5",   trim: "M5 Touring",                 image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071658/vw-funds/public/cars/M5_Touring.png",          stock:  4, offerType: "Lease",   tags: ["National"], pvi: 88, aging: 12, sales:  2, inventory:  4, monthlyPayment: 1689, term: 36, totalDueAtSigning: 13408 },
  { id: "bmw-x2-xdrive28i",        year: "2026", make: "BMW", model: "X2",   trim: "xDrive28i",                  image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071664/vw-funds/public/cars/X2.png",                  stock: 18, offerType: "Lease",   tags: ["National"], pvi: 94, aging: 34, sales: 11, inventory: 18, monthlyPayment:  609, term: 36, totalDueAtSigning:  5289 },
  { id: "bmw-x5-m60i",             year: "2026", make: "BMW", model: "X5",   trim: "M60i",                       image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071667/vw-funds/public/cars/X5_M60i.png",             stock:  9, offerType: "Lease",   tags: ["National"], pvi: 91, aging: 22, sales:  7, inventory:  9, monthlyPayment: 1159, term: 39, totalDueAtSigning:  8619 },
  { id: "bmw-x5m-competition",     year: "2026", make: "BMW", model: "X5 M", trim: "Competition",                image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071665/vw-funds/public/cars/X5_-_Competition.png",    stock:  3, offerType: "Lease",   tags: ["National"], pvi: 85, aging:  8, sales:  1, inventory:  3, monthlyPayment: 2079, term: 36, totalDueAtSigning: 10999 },
  { id: "bmw-x5m-competition-apr", year: "2026", make: "BMW", model: "X5 M", trim: "Competition",                image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071666/vw-funds/public/cars/X5_-_Competition2.png",   stock:  3, offerType: "APR",     tags: ["National"], pvi: 87, aging:  8, sales:  1, inventory:  3, monthlyPayment: 1710, term: 60, totalDueAtSigning:     0 },
  { id: "bmw-x6-m60i",             year: "2026", make: "BMW", model: "X6",   trim: "M60i",                       image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071668/vw-funds/public/cars/X6.png",                  stock:  6, offerType: "Lease",   tags: ["National"], pvi: 90, aging: 19, sales:  4, inventory:  6, monthlyPayment: 1319, term: 39, totalDueAtSigning:  8979 },

  // ── Mercedes-Benz ─────────────────────────────────────────────────────────────
  { id: "mercedes-e350-4matic",    year: "2026", make: "Mercedes-Benz", model: "E-Class", trim: "E350 4MATIC",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071660/vw-funds/public/cars/Mercedes_C.png",           stock: 14, offerType: "Lease",   tags: ["National"], pvi: 93, aging: 41, sales:  9, inventory: 14, monthlyPayment:  729, term: 24, totalDueAtSigning:  6623 },
];

// ─── Template Library ─────────────────────────────────────────────────────────
// Global pool of templates.
// tags.makes: empty array = universal (works with any OEM);
//             non-empty = restricted to listed makes only.
// products: number of offer slots the template renders simultaneously.

export const templateLibrary = [
  // ── Legacy single-product formats (hidden — superseded by CTA templates below) ──
  {
    id: "website-2000x500",
    name: "Honda_Lease_Website_2000x500",
    format: "Website Banner",
    width: 2000,
    height: 500,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
    hidden: true,
  },
  {
    id: "display-970x250",
    name: "Honda_Lease_Display_970x250",
    format: "Display Leaderboard",
    width: 970,
    height: 250,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
    hidden: true,
  },
  {
    id: "display-300x250",
    name: "Honda_Lease_Display_300x250",
    format: "Display Medium Rectangle",
    width: 300,
    height: 250,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
    hidden: true,
  },
  {
    id: "social-1080x1080",
    name: "Honda_Lease_Social_1080x1080",
    format: "Social Square",
    width: 1080,
    height: 1080,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
    hidden: true,
  },
  {
    id: "website-600x450",
    name: "Honda_Lease_Website_600x450",
    format: "Website Medium Banner",
    width: 600,
    height: 450,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
    hidden: true,
  },
  {
    id: "website-600x1067",
    name: "Honda_Lease_Website_600x1067",
    format: "Website Tall Banner",
    width: 600,
    height: 1067,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
    hidden: true,
  },
  // ── New single-product formats ──
  {
    id: "event-1920x200",
    name: "Honda_Lease_Event_1920x200",
    format: "Event Horizontal Banner",
    width: 1920,
    height: 200,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "display-728x90",
    name: "Honda_Lease_Display_728x90",
    format: "Display Leaderboard",
    width: 728,
    height: 90,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "display-300x600",
    name: "Honda_Lease_Display_300x600",
    format: "Display Half Page",
    width: 300,
    height: 600,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "display-160x600",
    name: "Honda_Lease_Display_160x600",
    format: "Display Wide Skyscraper",
    width: 160,
    height: 600,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "event-1900x776",
    name: "Honda_Lease_Event_1900x776",
    format: "Event Wide Banner",
    width: 1900,
    height: 776,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  // ── BMW CTA templates ──
  {
    id: "bmw-cta-display-300x250",
    name: "BMW_CTA_Display_300x250",
    format: "Display Medium Rectangle",
    width: 300,
    height: 250,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "bmw-cta-display-160x600",
    name: "BMW_CTA_Display_160x600",
    format: "Display Wide Skyscraper",
    width: 160,
    height: 600,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "bmw-cta-display-300x600",
    name: "BMW_CTA_Display_300x600",
    format: "Display Half Page",
    width: 300,
    height: 600,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "bmw-cta-display-970x250",
    name: "BMW_CTA_Display_970x250",
    format: "Display Leaderboard",
    width: 970,
    height: 250,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "bmw-cta-display-728x90",
    name: "BMW_CTA_Display_728x90",
    format: "Display Banner",
    width: 728,
    height: 90,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "bmw-cta-social-1080x1080",
    name: "BMW_CTA_Social_1080x1080",
    format: "Social Square",
    width: 1080,
    height: 1080,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "bmw-cta-website-600x450",
    name: "BMW_CTA_Website_600x450",
    format: "Website Medium Banner",
    width: 600,
    height: 450,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "bmw-cta-event-1920x200",
    name: "BMW_CTA_Event_1920x200",
    format: "Event Horizontal Banner",
    width: 1920,
    height: 200,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "bmw-cta-event-1900x776",
    name: "BMW_CTA_Event_1900x776",
    format: "Event Wide Banner",
    width: 1900,
    height: 776,
    brand: "BMW",
    products: 1,
    tags: { makes: ["BMW"] },
    logoSlots: ["primary-square", "event-square"],
  },
  // ── Honda CTA templates ──
  {
    id: "honda-cta-display-300x250",
    name: "Honda_CTA_Display_300x250",
    format: "Display Medium Rectangle",
    width: 300,
    height: 250,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "honda-cta-display-160x600",
    name: "Honda_CTA_Display_160x600",
    format: "Display Wide Skyscraper",
    width: 160,
    height: 600,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "honda-cta-display-300x600",
    name: "Honda_CTA_Display_300x600",
    format: "Display Half Page",
    width: 300,
    height: 600,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "honda-cta-display-970x250",
    name: "Honda_CTA_Display_970x250",
    format: "Display Leaderboard",
    width: 970,
    height: 250,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "honda-cta-display-728x90",
    name: "Honda_CTA_Display_728x90",
    format: "Display Banner",
    width: 728,
    height: 90,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "honda-cta-social-1080x1080",
    name: "Honda_CTA_Social_1080x1080",
    format: "Social Square",
    width: 1080,
    height: 1080,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "honda-cta-website-600x450",
    name: "Honda_CTA_Website_600x450",
    format: "Website Medium Banner",
    width: 600,
    height: 450,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "honda-cta-event-1920x200",
    name: "Honda_CTA_Event_1920x200",
    format: "Event Horizontal Banner",
    width: 1920,
    height: 200,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "honda-cta-event-1900x776",
    name: "Honda_CTA_Event_1900x776",
    format: "Event Wide Banner",
    width: 1900,
    height: 776,
    brand: "Honda",
    products: 1,
    tags: { makes: ["Honda"] },
    logoSlots: ["primary-square", "event-square"],
  },
  // ── Spiriva (pharma — ISI-split layout, no product slots) ──
  {
    id: "spiriva-300x600",
    name: "Spiriva_300x600",
    format: "Display Half Page",
    width: 300,
    height: 600,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-160x600",
    name: "Spiriva_160x600",
    format: "Display Wide Skyscraper",
    width: 160,
    height: 600,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-300x250",
    name: "Spiriva_300x250",
    format: "Display Medium Rectangle",
    width: 300,
    height: 250,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-728x90",
    name: "Spiriva_728x90",
    format: "Display Leaderboard",
    width: 728,
    height: 90,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-320x50",
    name: "Spiriva_320x50",
    format: "Mobile Banner",
    width: 320,
    height: 50,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },
  {
    id: "spiriva-300x50",
    name: "Spiriva_300x50",
    format: "Mobile Banner Wide",
    width: 300,
    height: 50,
    brand: "Spiriva",
    products: 0,
    tags: { makes: ["Spiriva"] },
    logoSlots: ["primary-square"],
  },

  // ── Multi-product, universal (no OEM restriction) ──
  {
    id: "website-1969x1080-3prod",
    name: "Honda_3_Images_1969x1080",
    format: "Website Wide Banner 3-Up",
    width: 1969,
    height: 1080,
    brand: "",
    products: 3,
    tags: { makes: [] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "social-1080x1080-3prod",
    name: "Honda_3_Images_1080x1080",
    format: "Social Square 3-Up",
    width: 1080,
    height: 1080,
    brand: "",
    products: 3,
    tags: { makes: [] },
    logoSlots: ["primary-square", "event-square"],
  },
  {
    id: "social-1080x1080-keymsg",
    name: "Honda_3_Images_KeyMessage_1080x1080",
    format: "Social Square Key Message 3-Up",
    width: 1080,
    height: 1080,
    brand: "",
    products: 3,
    tags: { makes: [] },
    logoSlots: ["primary-square", "event-square"],
  },
];

export type Template = typeof templateLibrary[0];
export type Offer = typeof offerLibrary[0];

// ─── Compatibility ────────────────────────────────────────────────────────────
// A template is compatible with an offer when either:
//  a) the template has no make restriction (universal), or
//  b) the offer's make is in the template's make tag list.

export function isCompatible(template: Template, offer: Offer): boolean {
  if (!template.tags.makes.length) return true;
  return template.tags.makes.includes(offer.make);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | "Template"
  | "In Progress"
  | "Awaiting Approval"
  | "Needs Edits"
  | "Approved"
  | "Assets Created"
  | "Changes Made"
  | "Done"
  | "Expired"
  | "Archived";

export const projects = [
  {
    id: "honda-demo",
    dealerName: "Honda of Anywhere",
    ctaText: "Shop Now",
    leaseLabel: "",
    finePrint: "",
    name: "Single Products",
    code: "WF58329_HNDANY_SingleProducts_Jan26",
    status: "In Progress" as ProjectStatus,
    dateRange: "Jan 1, 2026 - Jan 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Honda",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
      "event-1920x200",
      "display-728x90",
      "display-300x600",
      "display-160x600",
      "event-1900x776",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
  {
    id: "honda-multi-demo",
    dealerName: "Honda of Anywhere",
    ctaText: "Shop Now",
    leaseLabel: "",
    finePrint: "",
    name: "Multi-Product",
    code: "WF58330_HNDANY_MultiProduct_Jan26",
    status: "In Progress" as ProjectStatus,
    dateRange: "Jan 1, 2026 - Jan 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Honda",
    templateIds: [
      "website-1969x1080-3prod",
      "social-1080x1080-3prod",
      "social-1080x1080-keymsg",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
  {
    id: "honda-mixed-demo",
    dealerName: "Honda of Anywhere",
    ctaText: "Shop Now",
    leaseLabel: "",
    finePrint: "",
    name: "Mixed Templates",
    code: "WF58331_HNDANY_MixedTemplates_Jan26",
    status: "In Progress" as ProjectStatus,
    dateRange: "Jan 1, 2026 - Jan 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Honda",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
      "event-1920x200",
      "display-728x90",
      "display-300x600",
      "display-160x600",
      "event-1900x776",
      "website-1969x1080-3prod",
      "social-1080x1080-3prod",
      "social-1080x1080-keymsg",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
  {
    id: "multi-brands-demo",
    dealerName: "Multiple Brands",
    ctaText: "Shop Now",
    leaseLabel: "",
    finePrint: "",
    name: "Multiple Brands",
    code: "WF61240_MULTIBR_MultiOffers_May26",
    status: "Assets Created" as ProjectStatus,
    dateRange: "May 1, 2026 - May 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Multi",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
      "event-1920x200",
      "display-728x90",
      "display-300x600",
      "display-160x600",
      "event-1900x776",
    ],
    offerIds: [
      "bmw-m5-touring",
      "bmw-x2-xdrive28i",
      "bmw-x5-m60i",
      "bmw-x5m-competition",
      "bmw-x5m-competition-apr",
      "bmw-x6-m60i",
      "mercedes-e350-4matic",
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
  {
    id: "spiriva-april2026",
    dealerName: "Spiriva",
    ctaText: "Shop Now",
    leaseLabel: "",
    finePrint: "",
    name: "Spiriva_April2026",
    code: "WF63012_SPIRIVA_April2026_Pharma",
    status: "Assets Created" as ProjectStatus,
    dateRange: "Apr 1, 2026 - Apr 30, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Spiriva",
    templateIds: [] as string[],
    offerIds: [] as string[],
  },
  {
    id: "bmw-spring2026",
    dealerName: "BMW Seattle",
    ctaText: "Shop Now",
    leaseLabel: "",
    finePrint: "",
    name: "WASEABMW Spring Offers",
    code: "WF66948_WASEABMW_SpringOffers_Mar26",
    status: "Awaiting Approval" as ProjectStatus,
    dateRange: "Mar 1, 2026 - Mar 31, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "BMW",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
      "event-1920x200",
      "display-728x90",
      "display-300x600",
      "display-160x600",
      "event-1900x776",
    ],
    offerIds: [
      "bmw-m5-touring",
      "bmw-x2-xdrive28i",
      "bmw-x5-m60i",
    ],
  },
  {
    id: "honda-citylifestyle",
    dealerName: "Honda of Anywhere",
    ctaText: "Shop Now",
    leaseLabel: "",
    finePrint: "",
    name: "CityLifeStyle Magazine",
    code: "WF63239_HNDANY_CityLifeStyleMagazine",
    status: "Approved" as ProjectStatus,
    dateRange: "Feb 1, 2026 - Feb 28, 2026",
    assignee: { name: "Maite Espino", avatar: "/avatars/maite.jpg" },
    oem: "Honda",
    templateIds: [
      "website-2000x500",
      "social-1080x1080",
      "website-600x450",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
    ],
  },

  // ── Improvers showcase ────────────────────────────────────────────────────────
  {
    id: "honda-city-improvers",
    dealerName: "Honda City",
    ctaText: "Shop Now",
    leaseLabel: "",
    finePrint: "",
    name: "Improvers Summer Campaign",
    code: "WF72501_HNDCTY_ImpSummer_Jun26",
    status: "Approved" as ProjectStatus,
    dateRange: "Jun 1, 2026 - Jun 30, 2026",
    assignee: { name: "Jorge Verlindo", avatar: "" },
    oem: "Honda",
    templateIds: [
      "website-2000x500",
      "display-970x250",
      "display-300x250",
      "social-1080x1080",
      "website-600x450",
      "website-600x1067",
      "event-1920x200",
      "display-728x90",
      "display-300x600",
      "display-160x600",
      "event-1900x776",
    ],
    offerIds: [
      "crv-trailsport",
      "hrv-sport",
      "crv-lx",
      "odyssey-exl",
      "civic-hybrid",
    ],
  },
];

export type Project = typeof projects[0];

// ─── Per-project helpers ──────────────────────────────────────────────────────

export function getProjectById(id: string): Project {
  return projects.find((p) => p.id === id) ?? projects[0];
}

export function getProjectTemplates(projectId: string): Template[] {
  const proj = getProjectById(projectId);
  return proj.templateIds
    .map((id) => templateLibrary.find((t) => t.id === id))
    .filter((t): t is Template => !!t);
}

export function getProjectOffers(projectId: string): Offer[] {
  const proj = getProjectById(projectId);
  return proj.offerIds
    .map((id) => offerLibrary.find((o) => o.id === id))
    .filter((o): o is Offer => !!o);
}

// ─── Static data (shared across all projects) ─────────────────────────────────

/** All possible tasks — used as a registry for ID lookups. */
export const taskRegistry = [
  { id: "offers",          label: "Offers",       count: 5,   href: "offers" },
  { id: "data",            label: "Data",                     href: "data" },
  { id: "templates",       label: "Templates",    count: 6,   href: "templates" },
  { id: "logos-backgrounds", label: "Styles",                 href: "logos-backgrounds" },
  { id: "preview",         label: "Preview",      count: 180, href: "preview" },
  { id: "assets",          label: "Assets",                   href: "assets" },
  { id: "ad-shells",       label: "Ad Shells",                href: "ad-shells" },
  { id: "pre-approval",    label: "Pre-Approval",             href: "pre-approval" },
  { id: "legal-review",    label: "Legal Review",             href: "legal-review" },
  { id: "campaigns",       label: "Campaigns",                href: "campaigns" },
];

/** Default task order for automotive projects (no Data task). */
export const tasks = taskRegistry.filter((t) =>
  ["offers", "templates", "logos-backgrounds", "preview", "assets", "ad-shells", "pre-approval", "legal-review", "campaigns"].includes(t.id)
);

// ─── Per-project overrides ────────────────────────────────────────────────────
// Use this to customize logo and task list per project without touching the
// shared Project type or adding optional fields to every project object.

export const PROJECT_OVERRIDES: Record<string, { logoUrl?: string; taskIds?: string[] }> = {
  "honda-city-improvers": {
    logoUrl: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071713/vw-funds/public/logos/Honda-Logo.png",
  },
  "spiriva-april2026": {
    logoUrl: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071714/vw-funds/public/logos/Spiriva.png",
    taskIds: [
      "data",
      "templates",
      "logos-backgrounds",
      "preview",
      "assets",
      "ad-shells",
      "pre-approval",
      "legal-review",
      "campaigns",
    ],
  },
};

/** Returns the ordered task list for a given project (falls back to global `tasks`). */
export function getProjectTasks(projectId: string): typeof tasks {
  const override = PROJECT_OVERRIDES[projectId];
  if (override?.taskIds) {
    return override.taskIds
      .map((id) => taskRegistry.find((t) => t.id === id))
      .filter((t): t is (typeof taskRegistry)[0] => !!t);
  }
  return tasks;
}

/** Returns the sidebar logo URL for a given project. */
export function getProjectLogoUrl(projectId: string): string {
  return PROJECT_OVERRIDES[projectId]?.logoUrl ?? "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071713/vw-funds/public/logos/Honda-Logo.png";
}

export type BrandKitLogo = {
  id: string;
  label: string;
  sublabel: string;
  image: string;
};

export type BrandKit = {
  id: string;
  name: string;
  oem: string;
  colors: string[];
  logos: BrandKitLogo[];
};

export const brandKits: BrandKit[] = [
  {
    id: "honda",
    name: "Honda",
    oem: "Honda",
    colors: ["#000000", "#CC0000"],
    logos: [
      { id: "primary-square-positive",  label: "Primary Square",     sublabel: "Positive",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071648/vw-funds/public/brand-kits/honda/primary-square-positive.png" },
      { id: "primary-square-positive2", label: "Primary Square",     sublabel: "Positive 2", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071649/vw-funds/public/brand-kits/honda/primary-square-positive2.png" },
      { id: "primary-square-negative",  label: "Primary Square",     sublabel: "Negative",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071647/vw-funds/public/brand-kits/honda/primary-square-negative.png" },
      { id: "event-square-positive",    label: "Event Square",       sublabel: "Positive",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071647/vw-funds/public/brand-kits/honda/event-square-positive.png" },
      { id: "event-square-negative",    label: "Event Square",       sublabel: "Negative",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071646/vw-funds/public/brand-kits/honda/event-square-negative.png" },
      { id: "event-horizontal-positive",  label: "Event Horizontal", sublabel: "Positive",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071641/vw-funds/public/brand-kits/honda/event-horizontal-positive.png" },
      { id: "event-horizontal-positive2", label: "Event Horizontal", sublabel: "Positive 2", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071642/vw-funds/public/brand-kits/honda/event-horizontal-positive2.png" },
      { id: "event-horizontal-positive3", label: "Event Horizontal", sublabel: "Positive 3", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071643/vw-funds/public/brand-kits/honda/event-horizontal-positive3.png" },
      { id: "event-horizontal-positive4", label: "Event Horizontal", sublabel: "Positive 4", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071644/vw-funds/public/brand-kits/honda/event-horizontal-positive4.png" },
      { id: "event-horizontal-positive5", label: "Event Horizontal", sublabel: "Positive 5", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071645/vw-funds/public/brand-kits/honda/event-horizontal-positive5.png" },
      { id: "event-horizontal-negative",  label: "Event Horizontal", sublabel: "Negative",   image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071639/vw-funds/public/brand-kits/honda/event-horizontal-negative.png" },
      { id: "event-horizontal-negative2", label: "Event Horizontal", sublabel: "Negative 2", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071640/vw-funds/public/brand-kits/honda/event-horizontal-negative2.png" },
    ],
  },
  {
    id: "bmw",
    name: "BMW",
    oem: "BMW",
    colors: ["#000000", "#1C69D4"],
    logos: [
      { id: "primary-square-positive", label: "Primary Square", sublabel: "Positive", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071638/vw-funds/public/brand-kits/bmw/primary-square-positive.png" },
      { id: "primary-square-negative", label: "Primary Square", sublabel: "Negative", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071638/vw-funds/public/brand-kits/bmw/primary-square-negative.png" },
    ],
  },
  {
    id: "spiriva",
    name: "Spiriva",
    oem: "Spiriva",
    colors: ["#000000", "#16a34a"],
    logos: [
      { id: "primary-logo", label: "Primary Logo", sublabel: "Main", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071714/vw-funds/public/logos/Spiriva.png" },
    ],
  },
  {
    id: "mercedes",
    name: "Mercedes-Benz",
    oem: "Mercedes-Benz",
    colors: ["#000000", "#000000"],
    logos: [
      { id: "primary-square-positive",   label: "Primary Square",    sublabel: "Positive", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071651/vw-funds/public/brand-kits/mercedes/primary-square-positive.png" },
      { id: "primary-square-negative",   label: "Primary Square",    sublabel: "Negative", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071651/vw-funds/public/brand-kits/mercedes/primary-square-negative.png" },
      { id: "event-square-negative",     label: "Event Square",      sublabel: "Negative", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071650/vw-funds/public/brand-kits/mercedes/event-square-negative.png" },
      { id: "event-horizontal-negative", label: "Event Horizontal",  sublabel: "Negative", image: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071649/vw-funds/public/brand-kits/mercedes/event-horizontal-negative.png" },
    ],
  },
];

export const backgroundCollections = [
  {
    id: "dirt-road",
    name: "Dirt Road",
    type: "Background Collection",
    sizes: 6,
    folder: "Background Collections",
    color: "#c8a86b",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071536/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Display_300x250_1.png",
    images: {
      "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071542/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Website_2000x500_1.png",
      "display-970x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071539/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Display_970x250_1.png",
      "display-300x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071536/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Display_300x250_1.png",
      "social-1080x1080": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071540/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Social_1080x1080_1.png",
      "website-600x450":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071544/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Website_600x540_1.png",
      "website-600x1067": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071543/vw-funds/public/backgrounds/Dirt-Road-HO_251027_1_Website_600x1067_1.png",
    },
  },
  {
    id: "gold-flare",
    name: "Gold Flare",
    type: "Background Collection",
    sizes: 6,
    folder: "Background Collections",
    color: "#e8a020",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071581/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Display_300x250_1.png",
    images: {
      "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071586/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Website_2000x500_1.png",
      "display-970x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071584/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Display_970x250_1.png",
      "display-300x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071581/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Display_300x250_1.png",
      "social-1080x1080": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071585/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Social_1080x1080_1.png",
      "website-600x450":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071588/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Website_600x540_1.png",
      "website-600x1067": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071587/vw-funds/public/backgrounds/Gold-Flare-HO_251027_3_Website_600x1067_1.png",
    },
  },
  {
    id: "purple-city",
    name: "Purple City",
    type: "Background Collection",
    sizes: 6,
    folder: "Background Collections",
    color: "#7060a0",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071599/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Display_300x250_1.png",
    images: {
      "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071607/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Website_2000x500_1.png",
      "display-970x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071602/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Display_970x250_1.png",
      "display-300x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071599/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Display_300x250_1.png",
      "social-1080x1080": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071603/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Social_1080x1080_1.png",
      "website-600x450":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071609/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Website_600x450_1.png",
      "website-600x1067": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071608/vw-funds/public/backgrounds/Purple-City-HO_251229_D_Keeler_Website_600x1067_1.png",
    },
  },
  {
    id: "snow-house",
    name: "Snow House",
    type: "Background Collection",
    sizes: 6,
    folder: "Background Collections",
    color: "#b8cce0",
    thumbnail: "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071611/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Display_300x250_1.png",
    images: {
      "website-2000x500": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071619/vw-funds/public/backgrounds/Snow-House-HO_251120_3_Website_2000x500_1.png",
      "display-970x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071613/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Display_970x250_1.png",
      "display-300x250":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071611/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Display_300x250_1.png",
      "social-1080x1080": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071615/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Social_1080x1080_1.png",
      "website-600x450":  "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071618/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Website_600x540_1.png",
      "website-600x1067": "https://res.cloudinary.com/dvq75cqna/image/upload/v1780071617/vw-funds/public/backgrounds/Snow-House-HO_251120_2_Website_600x1067_1.png",
    },
  },
  ...lifestyleImages,
  ...generatedBackgroundCollections,
];

// ─── Backward-compat aliases ──────────────────────────────────────────────────
// Pages that haven't been updated yet can keep importing these.
// Gradually migrate each page to use getProjectTemplates/getProjectOffers.

export const project = projects[0];
export const offers = offerLibrary;
export const templates = getProjectTemplates("honda-demo");
