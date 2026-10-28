# inbox

Files a person drops in by hand. The pipeline copies each new file into `raw/<YYYY-MM>/inbox/` with its SHA-256 on the next `make pull` and never edits what is here.

## BC Laws regulations (until the King's Printer confirms API use in writing)

BC Laws' robots.txt allows only Googlebot and Bingbot, so SlotScout does not crawl it (Addendum A 6.1). Each month, open each regulation below in a browser and save it here:

| Regulation | Save as | Page |
| --- | --- | --- |
| Closed Areas Regulation, B.C. Reg. 76/84 | `bclaws/76_84_00_multi.txt` (saved) | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/76_84_00_multi |
| Hunting Regulation, B.C. Reg. 190/84 | `bclaws/190_84_00_multi.txt` | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/190_84_00_multi |
| Park, Conservancy and Recreation Area Regulation, B.C. Reg. 180/90 | `bclaws/180_90_00_multi.txt` | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/180_90_00_multi |
| Forest Recreation Regulation, B.C. Reg. 16/2004 | `bclaws/16_2004.txt` | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/16_2004 |
| Wildfire Regulation, B.C. Reg. 38/2005 | `bclaws/38_2005.txt` | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/38_2005 |
| Motor Vehicle Prohibition Regulation, B.C. Reg. 18/2024 | `bclaws/18_2024.txt` | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/18_2024 |

The Hunting and Park regulations come in parts; save the complete page (`_00_multi`), not one part. The plain `190_84` page returned 404 on 2026-10-20 (`notes/`) for that reason. B.C. Reg. 18/2024 replaced the Motor Vehicle Prohibition Regulation, B.C. Reg. 196/99, on March 1, 2024 (196/99 repeal notice saved in `notes/` on 2026-10-20).

Saved so far (all six): `bclaws/76_84_00_multi.txt`, the Closed Areas Regulation consolidation current to October 13, 2026 (last amended July 1, 2026 by B.C. Reg. 97/2026), copied in by a person on 2026-10-20; and, saved by Arsh on 2026-10-28 as PDFs of the BC Laws pages, each current to October 20, 2026: `bclaws/190_84_00_multi.pdf` (Hunting, last amended October 1, 2026 by B.C. Reg. 66/2026), `bclaws/180_90_00_multi.pdf` (Park, Conservancy and Recreation Area, last amended October 1, 2026 by B.C. Reg. 68/2026), `bclaws/16_2004.pdf` (Forest Recreation), `bclaws/38_2005.pdf` (Wildfire) and `bclaws/18_2024.pdf` (Motor Vehicle Prohibition).

Use "Save page as, web page, HTML only", or copy the text into a `.txt` file with the same name. Keep the "current to" and "last amended" lines at the top. Then run `make pull && make split`.

## Other files

- `notes/`: what a person saw on a source page (a repeal notice, a broken link), kept with the date so the pipeline's notes can be traced.

- `bylaws/<register key>/<anything>.pdf` (for example `bylaws/muni:City of Mission/discharge-bylaw.pdf`): a bylaw a person downloaded because the finder could not reach it or the site blocks automated access. You can also add the document's URL under `documents` for that site in `data/bylaw-sites.json`.
- `synopsis/`: Hunting and Trapping Regulations Synopsis PDFs used to cross-check shapes.

Text excerpts a person has typed or pasted from a source document go in `excerpts/` as `.txt` with a first line `Source: <where it came from>`; they are treated as unconfirmed until checked against the official consolidation.
