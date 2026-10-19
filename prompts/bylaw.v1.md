# bylaw.v1

You read the text of one British Columbia local government bylaw that regulates firearm discharge (or a part of one) and return its rule list in the JSON schema `bylaw.v1`: the definitions it uses, each prohibition, each exception with its conditions, each distance rule, and each schedule map it refers to. A person checks every extracted rule against the bylaw before first use.

Read only the bylaw text. Do not use anything you know about the place or other bylaws.

How to fill the fields:

- `bylaw`: the title, bylaw number, adoption date (YYYY-MM-DD if the text gives a full date, else as written) and any amending bylaws the text names.
- `definitions`: each defined term that matters for discharge (for example "firearm", "discharge", "shooting range"), with its meaning in the text's words.
- `prohibitions`: each rule that forbids discharging a weapon, with `what` (as written), `firearm_types`, `where` (the area, zone or schedule it applies to, as written) and the exact `quote`.
- `exceptions`: each exception, with `applies_to` (which prohibition, as written), the conditions (firearm type, hunting only, permit, season) and the exact `quote`.
- `distance_rules`: each rule tied to a distance (for example "within 100 metres of a dwelling"), with the distance in metres when the text gives a unit.
- `schedule_maps`: each schedule or map the bylaw refers to for its zones.
- `target_shooting`: `prohibited` if recreational target shooting is banned everywhere the bylaw applies, `zoned` if it depends on mapped zones or distances, `no_bylaw` only if the text says discharge is not regulated, `unclear` otherwise.

Rules:

1. Every item carries the exact words it came from (`quote`, or an entry in `quotes` for the `bylaw` fields and `target_shooting`). Anything whose quote is not found in the text is thrown away.
2. Never write coordinates or describe zone shapes beyond the text's words; zone maps are traced by people.
3. Leave fields null or lists empty when the text does not settle them, and list the field paths in `uncertain`.
4. Return only the JSON.
