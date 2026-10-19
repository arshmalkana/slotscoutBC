# inbox

Files a person drops in by hand. The pipeline copies each new file into `raw/<YYYY-MM>/inbox/` with its SHA-256 on the next `make pull` and never edits what is here.

## BC Laws regulations (until the King's Printer confirms API use in writing)

BC Laws' robots.txt allows only Googlebot and Bingbot, so SlotScout does not crawl it (Addendum A 6.1). Each month, open each regulation below in a browser and save it here:

| Regulation | Save as | Page |
| --- | --- | --- |
| Closed Areas Regulation, B.C. Reg. 76/84 | `bclaws/76_84_00_multi.html` | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/76_84_00_multi |
| Motor Vehicle Prohibition Regulation, B.C. Reg. 196/99 | `bclaws/196_99.html` | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/196_99 |
| Hunting Regulation, B.C. Reg. 190/84 | `bclaws/190_84.html` | https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/190_84 |

Use "Save page as, web page, HTML only", or copy the text into a `.txt` file with the same name. Keep the "current to" and "last amended" lines at the top. Then run `make pull && make split`.

## Other files

- `bylaws/<register key>/<anything>.pdf` (for example `bylaws/muni:City of Mission/discharge-bylaw.pdf`): a bylaw a person downloaded because the finder could not reach it or the site blocks automated access. You can also add the document's URL under `documents` for that site in `data/bylaw-sites.json`.
- `synopsis/`: Hunting and Trapping Regulations Synopsis PDFs used to cross-check shapes.

Text excerpts a person has typed or pasted from a source document go in `excerpts/` as `.txt` with a first line `Source: <where it came from>`; they are treated as unconfirmed until checked against the official consolidation.
