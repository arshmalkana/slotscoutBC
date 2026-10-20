# Agent-mode extraction work list

Generated 2026-10-20T16:18:08.204Z by `make extract` (mode: agent; no ANTHROPIC_API_KEY in .env).

Run 1: Claude Code reads each brief in `queue/agent/run1/` and writes the answer file it names. Run 2: for each brief in `queue/agent/run2/`, start a fresh subagent and give it only that brief (it holds the prompt, schema and source text, never the run-1 answer); it replies with file paths only, so nothing of run 2 reaches run 1. Then run `make build`.

Progress: run 1 72 of 426 done (354 left); run 2 72 of 426 done (354 left).

| Task | Kind | Title | Images | Run 1 | Run 2 |
| --- | --- | --- | ---: | --- | --- |
| bylaw-076d777eef8b | bylaw | Squamish-Lillooet Regional District: RB_1294 Electoral Area D Firearms Bylaw (Consoldiatio |  | [brief](agent/run1/bylaw-076d777eef8b.md) | [brief](agent/run2/bylaw-076d777eef8b.md) |
| bylaw-235ffc2cecf6 | bylaw | Squamish-Lillooet Regional District: Firearms Electoral Area A / Squamish-Lillooet Regiona |  | [brief](agent/run1/bylaw-235ffc2cecf6.md) | [brief](agent/run2/bylaw-235ffc2cecf6.md) |
| bylaw-41a6f2f6af37 | bylaw | Village of Belcarra: Firearms Control Bylaw No. 498-2016 |  | [brief](agent/run1/bylaw-41a6f2f6af37.md) | [brief](agent/run2/bylaw-41a6f2f6af37.md) |
| bylaw-48033c8b463c | bylaw | City of Richmond: Firearm Discharge Regulation Bylaw 4183 (1983) |  | [brief](agent/run1/bylaw-48033c8b463c.md) | [brief](agent/run2/bylaw-48033c8b463c.md) |
| bylaw-89ac67b44e6c | bylaw | City of Chilliwack: Firearms Regulation Bylaw 2740 (C) |  | [brief](agent/run1/bylaw-89ac67b44e6c.md) | [brief](agent/run2/bylaw-89ac67b44e6c.md) |
| bylaw-c913f73e206a | bylaw | City of Langley: Firearms Bylaw |  | [brief](agent/run1/bylaw-c913f73e206a.md) | [brief](agent/run2/bylaw-c913f73e206a.md) |
| closed_area-0100fbb4e3f6 | closed_area | Closed Areas Regulation, Schedule 8, section 28.1 (5(15)) |  | [brief](agent/run1/closed_area-0100fbb4e3f6.md) | [brief](agent/run2/closed_area-0100fbb4e3f6.md) |
| closed_area-01877715a204 | closed_area | Closed Areas Regulation, Schedule 5, section 45 (Lakelse Lake) |  | [brief](agent/run1/closed_area-01877715a204.md) | [brief](agent/run2/closed_area-01877715a204.md) |
| closed_area-021e54f769c2 | closed_area | Closed Areas Regulation, Schedule 4, section 3 ($20/hr) |  | [brief](agent/run1/closed_area-021e54f769c2.md) | [brief](agent/run2/closed_area-021e54f769c2.md) |
| closed_area-0252865671b1 | closed_area | Closed Areas Regulation, Schedule 6, section 9 |  | [brief](agent/run1/closed_area-0252865671b1.md) | [brief](agent/run2/closed_area-0252865671b1.md) |
| closed_area-03698f3cea89 | closed_area | Closed Areas Regulation, Schedule 9, section 4 (Barnston Island) |  | [brief](agent/run1/closed_area-03698f3cea89.md) | [brief](agent/run2/closed_area-03698f3cea89.md) |
| closed_area-03b96ca199dc | closed_area | Closed Areas Regulation, Schedule 8, section 9.1 (1***) |  | [brief](agent/run1/closed_area-03b96ca199dc.md) | [brief](agent/run2/closed_area-03b96ca199dc.md) |
| closed_area-072e8f6c6e08 | closed_area | Closed Areas Regulation, Schedule 5, section 95 (Equity Mines) |  | [brief](agent/run1/closed_area-072e8f6c6e08.md) | [brief](agent/run2/closed_area-072e8f6c6e08.md) |
| closed_area-07e70da5db1a | closed_area | Closed Areas Regulation, Schedule 3, section 10 (Similkameen Mining Company Limited) |  | [brief](agent/run1/closed_area-07e70da5db1a.md) | [brief](agent/run2/closed_area-07e70da5db1a.md) |
| closed_area-07ff6e1fc5ae | closed_area | Closed Areas Regulation, Schedule 3, section 61 (Elkview Operations) |  | [brief](agent/run1/closed_area-07ff6e1fc5ae.md) | [brief](agent/run2/closed_area-07ff6e1fc5ae.md) |
| closed_area-0acc7f98623c | closed_area | Closed Areas Regulation, Schedule 5, section 55 (Yale) |  | [brief](agent/run1/closed_area-0acc7f98623c.md) | [brief](agent/run2/closed_area-0acc7f98623c.md) |
| closed_area-0ae001096ed8 | closed_area | Closed Areas Regulation, Schedule 6, section 25 |  | [brief](agent/run1/closed_area-0ae001096ed8.md) | [brief](agent/run2/closed_area-0ae001096ed8.md) |
| closed_area-0b1cebfa9f5c | closed_area | Closed Areas Regulation, Schedule 3, section 44 (Nitinat River) |  | [brief](agent/run1/closed_area-0b1cebfa9f5c.md) | [brief](agent/run2/closed_area-0b1cebfa9f5c.md) |
| closed_area-0b573d6afd60 | closed_area | Closed Areas Regulation, Schedule 1, section 1 (Bergenham and Moberly) |  | [brief](agent/run1/closed_area-0b573d6afd60.md) | [brief](agent/run2/closed_area-0b573d6afd60.md) |
| closed_area-0b6276017c6b | closed_area | Closed Areas Regulation, Schedule 5, section 28 (Highways) |  | done | done |
| closed_area-0cb50d07636d | closed_area | Closed Areas Regulation, Schedule 3, section 40 (Lazo Marsh) |  | [brief](agent/run1/closed_area-0cb50d07636d.md) | [brief](agent/run2/closed_area-0cb50d07636d.md) |
| closed_area-0cc441cb8ada | closed_area | Closed Areas Regulation, Schedule 8, section 13 (Black bear) |  | [brief](agent/run1/closed_area-0cc441cb8ada.md) | [brief](agent/run2/closed_area-0cc441cb8ada.md) |
| closed_area-0d1a02e85383 | closed_area | Closed Areas Regulation, Schedule 5, section 11 (Bowen Island) |  | done | done |
| closed_area-0d2935f2f4a7 | closed_area | Closed Areas Regulation, Schedule 5, section 124 (Gillies Bay and Shelter Point Roads) |  | [brief](agent/run1/closed_area-0d2935f2f4a7.md) | [brief](agent/run2/closed_area-0d2935f2f4a7.md) |
| closed_area-0daeb334a4fe | closed_area | Closed Areas Regulation, Schedule 5, section 110 (Windermere) |  | [brief](agent/run1/closed_area-0daeb334a4fe.md) | [brief](agent/run2/closed_area-0daeb334a4fe.md) |
| closed_area-0ea0dae28265 | closed_area | Closed Areas Regulation, Schedule 3, section 68 (Burnt River) |  | [brief](agent/run1/closed_area-0ea0dae28265.md) | [brief](agent/run2/closed_area-0ea0dae28265.md) |
| closed_area-0eab0fc7d7e1 | closed_area | Closed Areas Regulation, Schedule 1, section 4 (George C. Reifel) |  | done | done |
| closed_area-0eb03c49fc60 | closed_area | Closed Areas Regulation, Schedule 3, section 45 (Cowichan Lake) |  | [brief](agent/run1/closed_area-0eb03c49fc60.md) | [brief](agent/run2/closed_area-0eb03c49fc60.md) |
| closed_area-0f804b062df6 | closed_area | Closed Areas Regulation, Schedule 5, section 20 (Charlie Lake) |  | [brief](agent/run1/closed_area-0f804b062df6.md) | [brief](agent/run2/closed_area-0f804b062df6.md) |
| closed_area-11d4c437f8f3 | closed_area | Closed Areas Regulation, Schedule 6, section 35 (10(30)) |  | [brief](agent/run1/closed_area-11d4c437f8f3.md) | [brief](agent/run2/closed_area-11d4c437f8f3.md) |
| closed_area-127444e32082 | closed_area | Closed Areas Regulation, Schedule 5, section 62 (Squamish) |  | done | done |
| closed_area-136c089f2ac4 | closed_area | Closed Areas Regulation, Schedule 3, section 57 (Edgewater) |  | [brief](agent/run1/closed_area-136c089f2ac4.md) | [brief](agent/run2/closed_area-136c089f2ac4.md) |
| closed_area-13d68a479aa9 | closed_area | Closed Areas Regulation, Schedule 9, section 28 (Quadra Island) |  | [brief](agent/run1/closed_area-13d68a479aa9.md) | [brief](agent/run2/closed_area-13d68a479aa9.md) |
| closed_area-13e77c6688c4 | closed_area | Closed Areas Regulation, Schedule 7, section 35 (Creston Valley Wildlife Management Area) |  | [brief](agent/run1/closed_area-13e77c6688c4.md) | [brief](agent/run2/closed_area-13e77c6688c4.md) |
| closed_area-148a26bd2ac6 | closed_area | Closed Areas Regulation, Schedule 8, section 1 (Bag Limit) |  | [brief](agent/run1/closed_area-148a26bd2ac6.md) | [brief](agent/run2/closed_area-148a26bd2ac6.md) |
| closed_area-148f1a23c5f0 | closed_area | Closed Areas Regulation, Schedule 5, section 56 (Popkum) |  | done | done |
| closed_area-1677e574a18b | closed_area | Closed Areas Regulation, Schedule 6, section 7 (15(15)***) |  | [brief](agent/run1/closed_area-1677e574a18b.md) | [brief](agent/run2/closed_area-1677e574a18b.md) |
| closed_area-16fcff23e8ac | closed_area | Closed Areas Regulation, Schedule 6, section 12 (Repealed. [B.C. Reg. 301/2010, App. 2, s. |  | [brief](agent/run1/closed_area-16fcff23e8ac.md) | [brief](agent/run2/closed_area-16fcff23e8ac.md) |
| closed_area-1874837ee201 | closed_area | Closed Areas Regulation, Schedule 1, section 10 (Serpentine River) |  | done | done |
| closed_area-18e8a4ff6c25 | closed_area | Closed Areas Regulation, Schedule 5, section 130 (Roberts Bank Superport and Tsawwassen Fe |  | [brief](agent/run1/closed_area-18e8a4ff6c25.md) | [brief](agent/run2/closed_area-18e8a4ff6c25.md) |
| closed_area-192ad6ccdffc | closed_area | Closed Areas Regulation, Schedule 3, section 16 (Argenta Marsh Wildlife Management Area) |  | [brief](agent/run1/closed_area-192ad6ccdffc.md) | [brief](agent/run2/closed_area-192ad6ccdffc.md) |
| closed_area-195cdbe9083d | closed_area | Closed Areas Regulation, Schedule 10, section 3 (One Island Pasture) |  | [brief](agent/run1/closed_area-195cdbe9083d.md) | [brief](agent/run2/closed_area-195cdbe9083d.md) |
| closed_area-19e6bc37a1a7 | closed_area | Closed Areas Regulation, Schedule 9, section 10 (Chilliwack Valley) |  | [brief](agent/run1/closed_area-19e6bc37a1a7.md) | [brief](agent/run2/closed_area-19e6bc37a1a7.md) |
| closed_area-1abac367b0ea | closed_area | Closed Areas Regulation, Schedule 6, section 11 |  | [brief](agent/run1/closed_area-1abac367b0ea.md) | [brief](agent/run2/closed_area-1abac367b0ea.md) |
| closed_area-1c864322ab1b | closed_area | Closed Areas Regulation, Schedule 9, section 1 |  | [brief](agent/run1/closed_area-1c864322ab1b.md) | [brief](agent/run2/closed_area-1c864322ab1b.md) |
| closed_area-1d9516a666ac | closed_area | Closed Areas Regulation, Schedule 5, section 48 (Naramata) |  | [brief](agent/run1/closed_area-1d9516a666ac.md) | [brief](agent/run2/closed_area-1d9516a666ac.md) |
| closed_area-1df0a76d5f63 | closed_area | Closed Areas Regulation, Schedule 5, section 49 (Huntingdon and Sumas Mountain) |  | done | done |
| closed_area-1f81b09f2ce0 | closed_area | Closed Areas Regulation, Schedule 8, section 19 |  | [brief](agent/run1/closed_area-1f81b09f2ce0.md) | [brief](agent/run2/closed_area-1f81b09f2ce0.md) |
| closed_area-21ac16bd1ce9 | closed_area | Closed Areas Regulation, Schedule 1, section 9 (Robert W. Starratt) |  | [brief](agent/run1/closed_area-21ac16bd1ce9.md) | [brief](agent/run2/closed_area-21ac16bd1ce9.md) |
| closed_area-23eef6d92e2b | closed_area | Closed Areas Regulation, Schedule 2, section 1 (Stum Lake) |  | [brief](agent/run1/closed_area-23eef6d92e2b.md) | [brief](agent/run2/closed_area-23eef6d92e2b.md) |
| closed_area-248cbf405437 | closed_area | Closed Areas Regulation, Schedule 6, section 23 |  | [brief](agent/run1/closed_area-248cbf405437.md) | [brief](agent/run2/closed_area-248cbf405437.md) |
| closed_area-24f920e861f1 | closed_area | Closed Areas Regulation, Schedule 7, section 37 (Silver Star Recreation Area) |  | [brief](agent/run1/closed_area-24f920e861f1.md) | [brief](agent/run2/closed_area-24f920e861f1.md) |
| closed_area-25e3acf5b869 | closed_area | Closed Areas Regulation, Schedule 6, section 32 (8(24)) |  | [brief](agent/run1/closed_area-25e3acf5b869.md) | [brief](agent/run2/closed_area-25e3acf5b869.md) |
| closed_area-263b02ea6ff2 | closed_area | Closed Areas Regulation, Schedule 3, section 3 (Until after the fire danger class falls to |  | [brief](agent/run1/closed_area-263b02ea6ff2.md) | [brief](agent/run2/closed_area-263b02ea6ff2.md) |
| closed_area-266b636890f8 | closed_area | Closed Areas Regulation, Schedule 4, section 4 ($23/hr) |  | [brief](agent/run1/closed_area-266b636890f8.md) | [brief](agent/run2/closed_area-266b636890f8.md) |
| closed_area-274c23183e9d | closed_area | Closed Areas Regulation, Schedule 3, section 58 (Mudge Island) |  | [brief](agent/run1/closed_area-274c23183e9d.md) | [brief](agent/run2/closed_area-274c23183e9d.md) |
| closed_area-29bbb915c6d5 | closed_area | Closed Areas Regulation, Schedule 5, section 75 (Okanagan Falls) |  | [brief](agent/run1/closed_area-29bbb915c6d5.md) | [brief](agent/run2/closed_area-29bbb915c6d5.md) |
| closed_area-29dc15dfa8b1 | closed_area | Closed Areas Regulation, Schedule 5.1, section 13 (Squamish River Valley) |  | [brief](agent/run1/closed_area-29dc15dfa8b1.md) | [brief](agent/run2/closed_area-29dc15dfa8b1.md) |
| closed_area-2ad6b47296bf | closed_area | Closed Areas Regulation, Schedule 5, section 58 (Masset) |  | [brief](agent/run1/closed_area-2ad6b47296bf.md) | [brief](agent/run2/closed_area-2ad6b47296bf.md) |
| closed_area-2bd9ae98e085 | closed_area | Closed Areas Regulation, Schedule 5, section 47 (Sandspit) |  | [brief](agent/run1/closed_area-2bd9ae98e085.md) | [brief](agent/run2/closed_area-2bd9ae98e085.md) |
| closed_area-2d26d5c573b6 | closed_area | Closed Areas Regulation, Schedule 7, section 54 (Fontas) |  | [brief](agent/run1/closed_area-2d26d5c573b6.md) | [brief](agent/run2/closed_area-2d26d5c573b6.md) |
| closed_area-2d4f2b514c92 | closed_area | Closed Areas Regulation, Schedule 6, section 26 |  | [brief](agent/run1/closed_area-2d4f2b514c92.md) | [brief](agent/run2/closed_area-2d4f2b514c92.md) |
| closed_area-2e6b184452c7 | closed_area | Closed Areas Regulation, Schedule 5, section 122 (Quinsam Coal Mine) |  | [brief](agent/run1/closed_area-2e6b184452c7.md) | [brief](agent/run2/closed_area-2e6b184452c7.md) |
| closed_area-30e75254a992 | closed_area | Closed Areas Regulation, Schedule 7, section 39 (Cody Caves) |  | [brief](agent/run1/closed_area-30e75254a992.md) | [brief](agent/run2/closed_area-30e75254a992.md) |
| closed_area-313c49b86faa | closed_area | Closed Areas Regulation, Schedule 5, section 114 (Westcan Terminals) |  | [brief](agent/run1/closed_area-313c49b86faa.md) | [brief](agent/run2/closed_area-313c49b86faa.md) |
| closed_area-32db226f2734 | closed_area | Closed Areas Regulation, Schedule 8, section 31 (5(15)) |  | [brief](agent/run1/closed_area-32db226f2734.md) | [brief](agent/run2/closed_area-32db226f2734.md) |
| closed_area-34ae02e94d34 | closed_area | Closed Areas Regulation, Schedule 3, section 66 (Marble Canyon Park) |  | [brief](agent/run1/closed_area-34ae02e94d34.md) | [brief](agent/run2/closed_area-34ae02e94d34.md) |
| closed_area-352dcfa80f26 | closed_area | Closed Areas Regulation, Schedule 8, section 16 |  | [brief](agent/run1/closed_area-352dcfa80f26.md) | [brief](agent/run2/closed_area-352dcfa80f26.md) |
| closed_area-3558f4f221ec | closed_area | Closed Areas Regulation, Schedule 8, section 32 (1***) |  | [brief](agent/run1/closed_area-3558f4f221ec.md) | [brief](agent/run2/closed_area-3558f4f221ec.md) |
| closed_area-356886b5f503 | closed_area | Closed Areas Regulation, Schedule 7, section 7 (Murtle Lake Nature Conservancy) |  | [brief](agent/run1/closed_area-356886b5f503.md) | [brief](agent/run2/closed_area-356886b5f503.md) |
| closed_area-35cec8c76c29 | closed_area | Closed Areas Regulation, Schedule 1, section 3 (Delkatla) |  | [brief](agent/run1/closed_area-35cec8c76c29.md) | [brief](agent/run2/closed_area-35cec8c76c29.md) |
| closed_area-36c6775829a4 | closed_area | Closed Areas Regulation, Schedule 3, section 69 (Nisg̱a'a Highway) |  | [brief](agent/run1/closed_area-36c6775829a4.md) | [brief](agent/run2/closed_area-36c6775829a4.md) |
| closed_area-37a13a57a9cc | closed_area | Closed Areas Regulation, Schedule 8, section 25 (3(9)) |  | [brief](agent/run1/closed_area-37a13a57a9cc.md) | [brief](agent/run2/closed_area-37a13a57a9cc.md) |
| closed_area-3af30a61ad1c | closed_area | Closed Areas Regulation, Schedule 7, section 53 (Highway 3 — Loop Bridge and Alexander Bri |  | [brief](agent/run1/closed_area-3af30a61ad1c.md) | [brief](agent/run2/closed_area-3af30a61ad1c.md) |
| closed_area-3b08aa1eba58 | closed_area | Closed Areas Regulation, Schedule 5, section 100 (Snootli Creek Park) |  | [brief](agent/run1/closed_area-3b08aa1eba58.md) | [brief](agent/run2/closed_area-3b08aa1eba58.md) |
| closed_area-3c49f8d2fad3 | closed_area | Closed Areas Regulation, Schedule 6, section 21.1 |  | [brief](agent/run1/closed_area-3c49f8d2fad3.md) | [brief](agent/run2/closed_area-3c49f8d2fad3.md) |
| closed_area-3c7c0d0bd18a | closed_area | Closed Areas Regulation, Schedule 7, section 6 (Lot 495 N.W.D.) |  | [brief](agent/run1/closed_area-3c7c0d0bd18a.md) | [brief](agent/run2/closed_area-3c7c0d0bd18a.md) |
| closed_area-3cdccdb7d537 | closed_area | Closed Areas Regulation, Schedule 5, section 3 (Ganges) |  | [brief](agent/run1/closed_area-3cdccdb7d537.md) | [brief](agent/run2/closed_area-3cdccdb7d537.md) |
| closed_area-3d53777dd996 | closed_area | Closed Areas Regulation, Schedule 2, section 0 (Fire Weather Index) |  | [brief](agent/run1/closed_area-3d53777dd996.md) | [brief](agent/run2/closed_area-3d53777dd996.md) |
| closed_area-3de27ca3ef20 | closed_area | Closed Areas Regulation, Schedule 9, section 2 (Pemberton) |  | [brief](agent/run1/closed_area-3de27ca3ef20.md) | [brief](agent/run2/closed_area-3de27ca3ef20.md) |
| closed_area-3e1fbbb359db | closed_area | Closed Areas Regulation, Schedule 5.1, section 6 (Jones Lake and Lorenzetta Forest Service |  | [brief](agent/run1/closed_area-3e1fbbb359db.md) | [brief](agent/run2/closed_area-3e1fbbb359db.md) |
| closed_area-3ea11c617621 | closed_area | Closed Areas Regulation, Schedule 3, section 24 (Kamloops) |  | [brief](agent/run1/closed_area-3ea11c617621.md) | [brief](agent/run2/closed_area-3ea11c617621.md) |
| closed_area-3ee32f8313b2 | closed_area | Closed Areas Regulation, Schedule 5, section 113 (Fort St. John Sewage Lagoons) |  | [brief](agent/run1/closed_area-3ee32f8313b2.md) | [brief](agent/run2/closed_area-3ee32f8313b2.md) |
| closed_area-4183800e83f3 | closed_area | Closed Areas Regulation, Schedule 3, section 5 (Salmon Arm) |  | [brief](agent/run1/closed_area-4183800e83f3.md) | [brief](agent/run2/closed_area-4183800e83f3.md) |
| closed_area-41c78944a554 | closed_area | Closed Areas Regulation, Schedule 5, section 106 (Babine River) |  | [brief](agent/run1/closed_area-41c78944a554.md) | [brief](agent/run2/closed_area-41c78944a554.md) |
| closed_area-421bac59608a | closed_area | Closed Areas Regulation, Schedule 7, section 44 (Gwillim Lake Park) |  | [brief](agent/run1/closed_area-421bac59608a.md) | [brief](agent/run2/closed_area-421bac59608a.md) |
| closed_area-42b6ed3d8717 | closed_area | Closed Areas Regulation, Schedule 8, section 27 (8(24)) |  | [brief](agent/run1/closed_area-42b6ed3d8717.md) | [brief](agent/run2/closed_area-42b6ed3d8717.md) |
| closed_area-42c72f39fa7c | closed_area | Closed Areas Regulation, Schedule 5, section 93 (Cold Fish Lake Camp) |  | [brief](agent/run1/closed_area-42c72f39fa7c.md) | [brief](agent/run2/closed_area-42c72f39fa7c.md) |
| closed_area-4317cdfbb8dc | closed_area | Closed Areas Regulation, Schedule 5, section 125 (Comox Harbour) |  | [brief](agent/run1/closed_area-4317cdfbb8dc.md) | [brief](agent/run2/closed_area-4317cdfbb8dc.md) |
| closed_area-43a8e84771ab | closed_area | Closed Areas Regulation, Schedule 5, section 32 (Sooke and Metchosin) |  | [brief](agent/run1/closed_area-43a8e84771ab.md) | [brief](agent/run2/closed_area-43a8e84771ab.md) |
| closed_area-43ff03316408 | closed_area | Closed Areas Regulation, Schedule 9, section 7 (Cultus Lake) |  | [brief](agent/run1/closed_area-43ff03316408.md) | [brief](agent/run2/closed_area-43ff03316408.md) |
| closed_area-4444eb27f7fa | closed_area | Closed Areas Regulation, Schedule 3, section 25 (Stone Mountain) |  | [brief](agent/run1/closed_area-4444eb27f7fa.md) | [brief](agent/run2/closed_area-4444eb27f7fa.md) |
| closed_area-4539937d1c5e | closed_area | Closed Areas Regulation, Schedule 5, section 37 (Red Rock Seed Orchard) |  | [brief](agent/run1/closed_area-4539937d1c5e.md) | [brief](agent/run2/closed_area-4539937d1c5e.md) |
| closed_area-45759128e829 | closed_area | Closed Areas Regulation, Schedule 5, section 7 (Englishman River) |  | [brief](agent/run1/closed_area-45759128e829.md) | [brief](agent/run2/closed_area-45759128e829.md) |
| closed_area-45f547b7e5ab | closed_area | Closed Areas Regulation, Schedule 5, section 27 (Cherry Point) |  | [brief](agent/run1/closed_area-45f547b7e5ab.md) | [brief](agent/run2/closed_area-45f547b7e5ab.md) |
| closed_area-4600d2cc1abb | closed_area | Closed Areas Regulation, Schedule 6, section 36 (10(30)) |  | [brief](agent/run1/closed_area-4600d2cc1abb.md) | [brief](agent/run2/closed_area-4600d2cc1abb.md) |
| closed_area-480ce265e33d | closed_area | Closed Areas Regulation, Schedule 9, section 3 (Naramata) |  | [brief](agent/run1/closed_area-480ce265e33d.md) | [brief](agent/run2/closed_area-480ce265e33d.md) |
| closed_area-48c464c0692c | closed_area | Closed Areas Regulation, Schedule 5, section 127 (Willow Heights Wildlife Reserve) |  | [brief](agent/run1/closed_area-48c464c0692c.md) | [brief](agent/run2/closed_area-48c464c0692c.md) |
| closed_area-496623fa03b6 | closed_area | Closed Areas Regulation, Schedule 9, section 26 (Stamp Lagoon) |  | [brief](agent/run1/closed_area-496623fa03b6.md) | [brief](agent/run2/closed_area-496623fa03b6.md) |
| closed_area-4a654364d8f2 | closed_area | Closed Areas Regulation, Schedule 5, section 53 (Hope) |  | done | done |
| closed_area-4a801b80a26e | closed_area | Closed Areas Regulation, Schedule 5.1, section 1 (Definition) |  | [brief](agent/run1/closed_area-4a801b80a26e.md) | [brief](agent/run2/closed_area-4a801b80a26e.md) |
| closed_area-4b9727d32439 | closed_area | Closed Areas Regulation, Schedule 3, section 15 (Walter Clough Wildlife Management Area) |  | [brief](agent/run1/closed_area-4b9727d32439.md) | [brief](agent/run2/closed_area-4b9727d32439.md) |
| closed_area-4bbf3dd2b549 | closed_area | Closed Areas Regulation, Schedule 6, section 29 (10 per day) |  | [brief](agent/run1/closed_area-4bbf3dd2b549.md) | [brief](agent/run2/closed_area-4bbf3dd2b549.md) |
| closed_area-4f2652982661 | closed_area | Closed Areas Regulation, Schedule 1, section 8 (Reidemann) |  | done | done |
| closed_area-5009e9ffd0e5 | closed_area | Closed Areas Regulation, Schedule 5, section 17 (Ocean Falls) |  | [brief](agent/run1/closed_area-5009e9ffd0e5.md) | [brief](agent/run2/closed_area-5009e9ffd0e5.md) |
| closed_area-5041d362c8c5 | closed_area | Closed Areas Regulation, Schedule 1, section 7 (McGillivray Creek) |  | done | done |
| closed_area-50da718482b9 | closed_area | Closed Areas Regulation, Schedule 6, section 21 (Repealed. [B.C. Reg. 108/2024, App. 1, s. |  | [brief](agent/run1/closed_area-50da718482b9.md) | [brief](agent/run2/closed_area-50da718482b9.md) |
| closed_area-51c6a56c1490 | closed_area | Closed Areas Regulation, Schedule 5, section 64 (Sechelt) |  | done | done |
| closed_area-51e1c4b66b5f | closed_area | Closed Areas Regulation, Schedule 5, section 35 (Mayo Lake) |  | [brief](agent/run1/closed_area-51e1c4b66b5f.md) | [brief](agent/run2/closed_area-51e1c4b66b5f.md) |
| closed_area-51eb4b23dd2e | closed_area | Closed Areas Regulation, Schedule 6, section 17 |  | [brief](agent/run1/closed_area-51eb4b23dd2e.md) | [brief](agent/run2/closed_area-51eb4b23dd2e.md) |
| closed_area-51ff61babc64 | closed_area | Closed Areas Regulation, Schedule 8, section 22 (5(15)***) |  | [brief](agent/run1/closed_area-51ff61babc64.md) | [brief](agent/run2/closed_area-51ff61babc64.md) |
| closed_area-52b7c20ee624 | closed_area | Closed Areas Regulation, Schedule 5.1, section 11 (Francis Lake, Sts'ailes (West) and Weav |  | [brief](agent/run1/closed_area-52b7c20ee624.md) | [brief](agent/run2/closed_area-52b7c20ee624.md) |
| closed_area-5372487dcc64 | closed_area | Closed Areas Regulation, Schedule 7, section 27 (Provincial Parks) |  | [brief](agent/run1/closed_area-5372487dcc64.md) | [brief](agent/run2/closed_area-5372487dcc64.md) |
| closed_area-53a5b927508a | closed_area | Closed Areas Regulation, Schedule 5, section 57 (Greenhills Operations) |  | [brief](agent/run1/closed_area-53a5b927508a.md) | [brief](agent/run2/closed_area-53a5b927508a.md) |
| closed_area-543aa5388820 | closed_area | Closed Areas Regulation, Schedule 3, section 28 (North Kitsumkalum) |  | [brief](agent/run1/closed_area-543aa5388820.md) | [brief](agent/run2/closed_area-543aa5388820.md) |
| closed_area-54fb2ce0f1ac | closed_area | Closed Areas Regulation, Schedule 5, section 15 (Williams Lake) |  | [brief](agent/run1/closed_area-54fb2ce0f1ac.md) | [brief](agent/run2/closed_area-54fb2ce0f1ac.md) |
| closed_area-582ad093e4d6 | closed_area | Closed Areas Regulation, Schedule 5, section 116 (Fry Creek Recreation Area) |  | [brief](agent/run1/closed_area-582ad093e4d6.md) | [brief](agent/run2/closed_area-582ad093e4d6.md) |
| closed_area-590cdbe7c7c4 | closed_area | Closed Areas Regulation, Schedule 11, section 5 (Management Unit 1-1) |  | [brief](agent/run1/closed_area-590cdbe7c7c4.md) | [brief](agent/run2/closed_area-590cdbe7c7c4.md) |
| closed_area-5962314ecaf6 | closed_area | Closed Areas Regulation, Schedule 5, section 76 (Kaleden) |  | [brief](agent/run1/closed_area-5962314ecaf6.md) | [brief](agent/run2/closed_area-5962314ecaf6.md) |
| closed_area-59f1c18295ac | closed_area | Closed Areas Regulation, Schedule 6, section 31 (5(15)) |  | [brief](agent/run1/closed_area-59f1c18295ac.md) | [brief](agent/run2/closed_area-59f1c18295ac.md) |
| closed_area-5ab1e0988d03 | closed_area | Closed Areas Regulation, Schedule 8, section 18 (NBL) |  | [brief](agent/run1/closed_area-5ab1e0988d03.md) | [brief](agent/run2/closed_area-5ab1e0988d03.md) |
| closed_area-5afc49511572 | closed_area | Closed Areas Regulation, Schedule 9, section 14 (Sechelt) |  | [brief](agent/run1/closed_area-5afc49511572.md) | [brief](agent/run2/closed_area-5afc49511572.md) |
| closed_area-5b6028a05c49 | closed_area | Closed Areas Regulation, Schedule 5, section 21 (Cowichan Bay) |  | [brief](agent/run1/closed_area-5b6028a05c49.md) | [brief](agent/run2/closed_area-5b6028a05c49.md) |
| closed_area-5ba50ac3daef | closed_area | Closed Areas Regulation, Schedule 8, section 23 (2(6)) |  | [brief](agent/run1/closed_area-5ba50ac3daef.md) | [brief](agent/run2/closed_area-5ba50ac3daef.md) |
| closed_area-5c12d953847a | closed_area | Closed Areas Regulation, Schedule 3, section 49 (Kinuseo Falls) |  | [brief](agent/run1/closed_area-5c12d953847a.md) | [brief](agent/run2/closed_area-5c12d953847a.md) |
| closed_area-5e64f75a4166 | closed_area | Closed Areas Regulation, Schedule 5, section 16 (Provincial Gaol Camp No. 1) |  | done | done |
| closed_area-60b5690762fb | closed_area | Closed Areas Regulation, Schedule 5, section 77 (Coal Mountain Operations) |  | [brief](agent/run1/closed_area-60b5690762fb.md) | [brief](agent/run2/closed_area-60b5690762fb.md) |
| closed_area-60c1985e638c | closed_area | Closed Areas Regulation, Schedule 3, section 31 (Roderick Haig-Brown Recreation Area) |  | [brief](agent/run1/closed_area-60c1985e638c.md) | [brief](agent/run2/closed_area-60c1985e638c.md) |
| closed_area-60caff708fc7 | closed_area | Closed Areas Regulation, Schedule 7, section 40 (Norbury Lake Park) |  | [brief](agent/run1/closed_area-60caff708fc7.md) | [brief](agent/run2/closed_area-60caff708fc7.md) |
| closed_area-6127655a5f49 | closed_area | Closed Areas Regulation, Schedule 11, section 1 (Nicomen) |  | done | done |
| closed_area-61fb525e4277 | closed_area | Closed Areas Regulation, Schedule 1, section 14 (Ward Lake) |  | [brief](agent/run1/closed_area-61fb525e4277.md) | [brief](agent/run2/closed_area-61fb525e4277.md) |
| closed_area-627972e88135 | closed_area | Closed Areas Regulation, Schedule 7, section 34 (Golden Bear Access Road) |  | [brief](agent/run1/closed_area-627972e88135.md) | [brief](agent/run2/closed_area-627972e88135.md) |
| closed_area-63ea82cb1ca6 | closed_area | Closed Areas Regulation, Schedule 6, section 4 |  | [brief](agent/run1/closed_area-63ea82cb1ca6.md) | [brief](agent/run2/closed_area-63ea82cb1ca6.md) |
| closed_area-640aecc71b61 | closed_area | Closed Areas Regulation, Schedule 5, section 84 (Upper Halfway) |  | [brief](agent/run1/closed_area-640aecc71b61.md) | [brief](agent/run2/closed_area-640aecc71b61.md) |
| closed_area-641094842b62 | closed_area | Closed Areas Regulation, Schedule 3, section 55 (Sun Peaks Resort) |  | [brief](agent/run1/closed_area-641094842b62.md) | [brief](agent/run2/closed_area-641094842b62.md) |
| closed_area-645422c3e1ed | closed_area | Closed Areas Regulation, Schedule 7, section 5 (Bowen Island) |  | [brief](agent/run1/closed_area-645422c3e1ed.md) | [brief](agent/run2/closed_area-645422c3e1ed.md) |
| closed_area-6777138b4e90 | closed_area | Closed Areas Regulation, Schedule 5, section 85 (Sylvester Road) |  | done | done |
| closed_area-67b0183ecd14 | closed_area | Closed Areas Regulation, Schedule 8, section 30 (10(30)) |  | [brief](agent/run1/closed_area-67b0183ecd14.md) | [brief](agent/run2/closed_area-67b0183ecd14.md) |
| closed_area-67b6ca2784ec | closed_area | Closed Areas Regulation, Schedule 6, section 30.1 (10(30)) |  | [brief](agent/run1/closed_area-67b6ca2784ec.md) | [brief](agent/run2/closed_area-67b6ca2784ec.md) |
| closed_area-682129cef8fe | closed_area | Closed Areas Regulation, Schedule 3, section 13 (Tabor Mountain) |  | [brief](agent/run1/closed_area-682129cef8fe.md) | [brief](agent/run2/closed_area-682129cef8fe.md) |
| closed_area-6a68b7bacb9d | closed_area | Closed Areas Regulation, Schedule 6, section 18 (Black bear) |  | [brief](agent/run1/closed_area-6a68b7bacb9d.md) | [brief](agent/run2/closed_area-6a68b7bacb9d.md) |
| closed_area-6b935849eed9 | closed_area | Closed Areas Regulation, Schedule 6, section 6 |  | [brief](agent/run1/closed_area-6b935849eed9.md) | [brief](agent/run2/closed_area-6b935849eed9.md) |
| closed_area-6bd6b676b987 | closed_area | Closed Areas Regulation, Schedule 8, section 7 (Repealed. [B.C. Reg. 66/2018, App. 1, s. 8 |  | [brief](agent/run1/closed_area-6bd6b676b987.md) | [brief](agent/run2/closed_area-6bd6b676b987.md) |
| closed_area-6c4ef7212408 | closed_area | Closed Areas Regulation, Schedule 3, section 56 (Radium) |  | [brief](agent/run1/closed_area-6c4ef7212408.md) | [brief](agent/run2/closed_area-6c4ef7212408.md) |
| closed_area-6c6af88f8c0f | closed_area | Closed Areas Regulation, Schedule 1, section 12 (Tunkwa Lake) |  | [brief](agent/run1/closed_area-6c6af88f8c0f.md) | [brief](agent/run2/closed_area-6c6af88f8c0f.md) |
| closed_area-6d13a853fe86 | closed_area | Closed Areas Regulation, Schedule 7, section 49 (Khutzeymateen Park) |  | [brief](agent/run1/closed_area-6d13a853fe86.md) | [brief](agent/run2/closed_area-6d13a853fe86.md) |
| closed_area-6d314ca89488 | closed_area | Closed Areas Regulation, Schedule 7, section 52 (Whistler Olympic Park) |  | [brief](agent/run1/closed_area-6d314ca89488.md) | [brief](agent/run2/closed_area-6d314ca89488.md) |
| closed_area-6d8dd9929daf | closed_area | Closed Areas Regulation, Schedule 6, section 27 (NBL) |  | [brief](agent/run1/closed_area-6d8dd9929daf.md) | [brief](agent/run2/closed_area-6d8dd9929daf.md) |
| closed_area-6e88d0855982 | closed_area | Closed Areas Regulation, Schedule 3, section 23 (Mt. Bergeron — Tumbler Ridge) |  | [brief](agent/run1/closed_area-6e88d0855982.md) | [brief](agent/run2/closed_area-6e88d0855982.md) |
| closed_area-70664c906dd8 | closed_area | Closed Areas Regulation, Schedule 10, section 2 (Groundbirch) |  | [brief](agent/run1/closed_area-70664c906dd8.md) | [brief](agent/run2/closed_area-70664c906dd8.md) |
| closed_area-7101e28aeb15 | closed_area | Closed Areas Regulation, Schedule 5.1, section 12 (Chehalis Forest Service Road) |  | [brief](agent/run1/closed_area-7101e28aeb15.md) | [brief](agent/run2/closed_area-7101e28aeb15.md) |
| closed_area-712ace3e0b96 | closed_area | Closed Areas Regulation, Schedule 3, section 54 (Centennial Beach) |  | done | done |
| closed_area-7227cdd7b1d5 | closed_area | Closed Areas Regulation, Schedule 5, section 94 (Williams Lake River) |  | [brief](agent/run1/closed_area-7227cdd7b1d5.md) | [brief](agent/run2/closed_area-7227cdd7b1d5.md) |
| closed_area-722d3e8a0cb4 | closed_area | Closed Areas Regulation, Schedule 5, section 115 (Mount Judge Howay Park) |  | [brief](agent/run1/closed_area-722d3e8a0cb4.md) | [brief](agent/run2/closed_area-722d3e8a0cb4.md) |
| closed_area-73ecc2f0ea6c | closed_area | Closed Areas Regulation, Schedule 5, section 14 (Gibralter Mines) |  | [brief](agent/run1/closed_area-73ecc2f0ea6c.md) | [brief](agent/run2/closed_area-73ecc2f0ea6c.md) |
| closed_area-742ba7f0a802 | closed_area | Closed Areas Regulation, Schedule 5.1, section 3 (Liumchen East Forest Service Road etc.) |  | [brief](agent/run1/closed_area-742ba7f0a802.md) | [brief](agent/run2/closed_area-742ba7f0a802.md) |
| closed_area-748920feccc8 | closed_area | Closed Areas Regulation, Schedule 8, section 2 (1***) |  | [brief](agent/run1/closed_area-748920feccc8.md) | [brief](agent/run2/closed_area-748920feccc8.md) |
| closed_area-78cdb74f80b0 | closed_area | Closed Areas Regulation, Schedule 5, section 63 (Nicomen) |  | done | done |
| closed_area-791a07f07fba | closed_area | Closed Areas Regulation, Schedule 8, section 27.1 (10(30)) |  | [brief](agent/run1/closed_area-791a07f07fba.md) | [brief](agent/run2/closed_area-791a07f07fba.md) |
| closed_area-793dd0d43b00 | closed_area | Closed Areas Regulation, Schedule 7, section 46 (Lukwa Lake) |  | [brief](agent/run1/closed_area-793dd0d43b00.md) | [brief](agent/run2/closed_area-793dd0d43b00.md) |
| closed_area-7bb2b4b39cba | closed_area | Closed Areas Regulation, Schedule 5, section 41 (Line Creek Operations) |  | [brief](agent/run1/closed_area-7bb2b4b39cba.md) | [brief](agent/run2/closed_area-7bb2b4b39cba.md) |
| closed_area-7c28c3f7cb47 | closed_area | Closed Areas Regulation, Schedule 11, section 4 (Grand Forks) |  | done | done |
| closed_area-7c90e5e9b9ff | closed_area | Closed Areas Regulation, Schedule 9, section 15 (Skaha Lake) |  | [brief](agent/run1/closed_area-7c90e5e9b9ff.md) | [brief](agent/run2/closed_area-7c90e5e9b9ff.md) |
| closed_area-7d9d290b825b | closed_area | Closed Areas Regulation, Schedule 6, section 22 (Repealed. [B.C. Reg. 66/2018, App. 1, s.  |  | [brief](agent/run1/closed_area-7d9d290b825b.md) | [brief](agent/run2/closed_area-7d9d290b825b.md) |
| closed_area-7de004ecd63d | closed_area | Closed Areas Regulation, Schedule 3, section 29 (Pacific Rim (Westcoast) National Park) |  | [brief](agent/run1/closed_area-7de004ecd63d.md) | [brief](agent/run2/closed_area-7de004ecd63d.md) |
| closed_area-7e3c4fc75330 | closed_area | Closed Areas Regulation, Schedule 3, section 53 (De Courcey Island) |  | [brief](agent/run1/closed_area-7e3c4fc75330.md) | [brief](agent/run2/closed_area-7e3c4fc75330.md) |
| closed_area-7fe0d774a8bc | closed_area | Closed Areas Regulation, Schedule 9, section 17 (Lakelse Lake) |  | [brief](agent/run1/closed_area-7fe0d774a8bc.md) | [brief](agent/run2/closed_area-7fe0d774a8bc.md) |
| closed_area-803fc49b87ef | closed_area | Closed Areas Regulation, Schedule 7, section 21 (Atlin Park) |  | [brief](agent/run1/closed_area-803fc49b87ef.md) | [brief](agent/run2/closed_area-803fc49b87ef.md) |
| closed_area-813ffefafcb6 | closed_area | Closed Areas Regulation, Schedule 6, section 38 (10(30)) |  | [brief](agent/run1/closed_area-813ffefafcb6.md) | [brief](agent/run2/closed_area-813ffefafcb6.md) |
| closed_area-81716842855a | closed_area | Closed Areas Regulation, Schedule 9, section 9 (Nicomen) |  | [brief](agent/run1/closed_area-81716842855a.md) | [brief](agent/run2/closed_area-81716842855a.md) |
| closed_area-8197cb69eec9 | closed_area | Closed Areas Regulation, Schedule 5, section 61 (Evans Lake) |  | done | done |
| closed_area-81d1d79d88d5 | closed_area | Closed Areas Regulation, Schedule 7, section 55 (Lord River) |  | [brief](agent/run1/closed_area-81d1d79d88d5.md) | [brief](agent/run2/closed_area-81d1d79d88d5.md) |
| closed_area-82905bb9883a | closed_area | Closed Areas Regulation, Schedule 6, section 39.2 (5(15)) |  | [brief](agent/run1/closed_area-82905bb9883a.md) | [brief](agent/run2/closed_area-82905bb9883a.md) |
| closed_area-83f3078f7e12 | closed_area | Closed Areas Regulation, Schedule 5, section 60 (Whistler) |  | done | done |
| closed_area-84557f653493 | closed_area | Closed Areas Regulation, Schedule 5, section 46 (Queen Charlotte City) |  | [brief](agent/run1/closed_area-84557f653493.md) | [brief](agent/run2/closed_area-84557f653493.md) |
| closed_area-85bdb6115292 | closed_area | Closed Areas Regulation, Schedule 8, section 28 (10(30)) |  | [brief](agent/run1/closed_area-85bdb6115292.md) | [brief](agent/run2/closed_area-85bdb6115292.md) |
| closed_area-863fd52d3a7a | closed_area | Closed Areas Regulation, Schedule 8, section 21 (10 per day) |  | [brief](agent/run1/closed_area-863fd52d3a7a.md) | [brief](agent/run2/closed_area-863fd52d3a7a.md) |
| closed_area-875c830ae710 | closed_area | Closed Areas Regulation, Schedule 3, section 63 (Sea to Sky Highway) |  | done | done |
| closed_area-877ccb5c1797 | closed_area | Closed Areas Regulation, Schedule 8, section 12 |  | [brief](agent/run1/closed_area-877ccb5c1797.md) | [brief](agent/run2/closed_area-877ccb5c1797.md) |
| closed_area-87f3b2ea98cd | closed_area | Closed Areas Regulation, Schedule 5.1, section 5 (Bench, Foley and Nesakwatch Forest Servi |  | [brief](agent/run1/closed_area-87f3b2ea98cd.md) | [brief](agent/run2/closed_area-87f3b2ea98cd.md) |
| closed_area-87fa28fa5749 | closed_area | Closed Areas Regulation, Schedule 9, section 19 (Naikoon Park) |  | [brief](agent/run1/closed_area-87fa28fa5749.md) | [brief](agent/run2/closed_area-87fa28fa5749.md) |
| closed_area-8911c2b7142e | closed_area | Closed Areas Regulation, Schedule 5, section 98 (Texada Junction) |  | [brief](agent/run1/closed_area-8911c2b7142e.md) | [brief](agent/run2/closed_area-8911c2b7142e.md) |
| closed_area-89521eb848d2 | closed_area | Closed Areas Regulation, Schedule 6, section 8 (15(15)***) |  | [brief](agent/run1/closed_area-89521eb848d2.md) | [brief](agent/run2/closed_area-89521eb848d2.md) |
| closed_area-8b3b6ff8fff4 | closed_area | Closed Areas Regulation, Schedule 3, section 64 (Callaghan Road) |  | done | done |
| closed_area-8b76c61060a2 | closed_area | Closed Areas Regulation, Schedule 5, section 44 (Link Island) |  | [brief](agent/run1/closed_area-8b76c61060a2.md) | [brief](agent/run2/closed_area-8b76c61060a2.md) |
| closed_area-8beefa67d6dd | closed_area | Closed Areas Regulation, Schedule 8, section 17 (NBL) |  | [brief](agent/run1/closed_area-8beefa67d6dd.md) | [brief](agent/run2/closed_area-8beefa67d6dd.md) |
| closed_area-8ef01cf6c2b2 | closed_area | Closed Areas Regulation, Schedule 8, section 14.1 (Bearded turkey) |  | [brief](agent/run1/closed_area-8ef01cf6c2b2.md) | [brief](agent/run2/closed_area-8ef01cf6c2b2.md) |
| closed_area-8f2c2f85631c | closed_area | Closed Areas Regulation, Schedule 5, section 34 (Rose Lake) |  | [brief](agent/run1/closed_area-8f2c2f85631c.md) | [brief](agent/run2/closed_area-8f2c2f85631c.md) |
| closed_area-9088142b449a | closed_area | Closed Areas Regulation, Schedule 8, section 14 (Repealed. [B.C. Reg. 80/2012, App. 2, s.  |  | [brief](agent/run1/closed_area-9088142b449a.md) | [brief](agent/run2/closed_area-9088142b449a.md) |
| closed_area-922330221646 | closed_area | Closed Areas Regulation, Schedule 5, section 103 (Sea Island) |  | [brief](agent/run1/closed_area-922330221646.md) | [brief](agent/run2/closed_area-922330221646.md) |
| closed_area-924a465f9344 | closed_area | Closed Areas Regulation, Schedule 3, section 67 (Shaman Island) |  | [brief](agent/run1/closed_area-924a465f9344.md) | [brief](agent/run2/closed_area-924a465f9344.md) |
| closed_area-929a35580138 | closed_area | Closed Areas Regulation, Schedule 5, section 89 (Grantham Road) |  | [brief](agent/run1/closed_area-929a35580138.md) | [brief](agent/run2/closed_area-929a35580138.md) |
| closed_area-92a8d505245f | closed_area | Closed Areas Regulation, Schedule 6, section 8.3 |  | [brief](agent/run1/closed_area-92a8d505245f.md) | [brief](agent/run2/closed_area-92a8d505245f.md) |
| closed_area-92fccd4a3dbb | closed_area | Closed Areas Regulation, Schedule 8, section 20 (1***) |  | [brief](agent/run1/closed_area-92fccd4a3dbb.md) | [brief](agent/run2/closed_area-92fccd4a3dbb.md) |
| closed_area-93f68aa3b8e8 | closed_area | Closed Areas Regulation, Schedule 9, section 29 (Nanaimo to Ladysmith) |  | [brief](agent/run1/closed_area-93f68aa3b8e8.md) | [brief](agent/run2/closed_area-93f68aa3b8e8.md) |
| closed_area-940cf05ceb0a | closed_area | Closed Areas Regulation, Schedule 13, section 1 (Delta/Surrey Dykes) |  | done | done |
| closed_area-94601a9eab6a | closed_area | Closed Areas Regulation, Schedule 8, section 3 (1***) |  | [brief](agent/run1/closed_area-94601a9eab6a.md) | [brief](agent/run2/closed_area-94601a9eab6a.md) |
| closed_area-947165249e83 | closed_area | Closed Areas Regulation, Schedule 6, section 28 |  | [brief](agent/run1/closed_area-947165249e83.md) | [brief](agent/run2/closed_area-947165249e83.md) |
| closed_area-96179964fba7 | closed_area | Closed Areas Regulation, Schedule 5.1, section 10 (Norrish Creek watershed) |  | [brief](agent/run1/closed_area-96179964fba7.md) | [brief](agent/run2/closed_area-96179964fba7.md) |
| closed_area-9670c4697d09 | closed_area | Closed Areas Regulation, Schedule 5, section 129 (Dokie) |  | [brief](agent/run1/closed_area-9670c4697d09.md) | [brief](agent/run2/closed_area-9670c4697d09.md) |
| closed_area-972747f11374 | closed_area | Closed Areas Regulation, Schedule 7, section 45 (Woodhus Slough) |  | [brief](agent/run1/closed_area-972747f11374.md) | [brief](agent/run2/closed_area-972747f11374.md) |
| closed_area-972a03223949 | closed_area | Closed Areas Regulation, Schedule 6, section 13 (Repealed. [B.C. Reg. 115/2018, App. 2, s. |  | [brief](agent/run1/closed_area-972a03223949.md) | [brief](agent/run2/closed_area-972a03223949.md) |
| closed_area-980705317588 | closed_area | Closed Areas Regulation, Schedule 8, section 15 (2**) |  | [brief](agent/run1/closed_area-980705317588.md) | [brief](agent/run2/closed_area-980705317588.md) |
| closed_area-98eddadc6136 | closed_area | Closed Areas Regulation, Schedule 5, section 135 (Cowichan River Park) |  | [brief](agent/run1/closed_area-98eddadc6136.md) | [brief](agent/run2/closed_area-98eddadc6136.md) |
| closed_area-9b59f9b918fa | closed_area | Closed Areas Regulation, Schedule 7, section 13 (Mount Assiniboine Park) |  | [brief](agent/run1/closed_area-9b59f9b918fa.md) | [brief](agent/run2/closed_area-9b59f9b918fa.md) |
| closed_area-9b7d9de9b9cb | closed_area | Closed Areas Regulation, Schedule 3, section 46 (Trophy Mountain) |  | [brief](agent/run1/closed_area-9b7d9de9b9cb.md) | [brief](agent/run2/closed_area-9b7d9de9b9cb.md) |
| closed_area-9d45c703bc77 | closed_area | Closed Areas Regulation, Schedule 3, section 50 (Ucluelet) |  | [brief](agent/run1/closed_area-9d45c703bc77.md) | [brief](agent/run2/closed_area-9d45c703bc77.md) |
| closed_area-9da07260896a | closed_area | Closed Areas Regulation, Schedule 8, section 29 (5(15)) |  | [brief](agent/run1/closed_area-9da07260896a.md) | [brief](agent/run2/closed_area-9da07260896a.md) |
| closed_area-9ea63c70def6 | closed_area | Closed Areas Regulation, Schedule 6, section 10 (Repealed. [B.C. Reg. 175/2010, App. 2, s. |  | [brief](agent/run1/closed_area-9ea63c70def6.md) | [brief](agent/run2/closed_area-9ea63c70def6.md) |
| closed_area-9f0b435a4d9d | closed_area | Closed Areas Regulation, Schedule 5, section 59 (Shoemaker Bay) |  | [brief](agent/run1/closed_area-9f0b435a4d9d.md) | [brief](agent/run2/closed_area-9f0b435a4d9d.md) |
| closed_area-9f252596b5ec | closed_area | Closed Areas Regulation, Schedule 5, section 6 (Skookumchuck Pulp Mill) |  | [brief](agent/run1/closed_area-9f252596b5ec.md) | [brief](agent/run2/closed_area-9f252596b5ec.md) |
| closed_area-9fa85d240017 | closed_area | Closed Areas Regulation, Schedule 5, section 96 (Miworth) |  | [brief](agent/run1/closed_area-9fa85d240017.md) | [brief](agent/run2/closed_area-9fa85d240017.md) |
| closed_area-9fc7d119bd43 | closed_area | Closed Areas Regulation, Schedule 5, section 73 (Michael Lake) |  | [brief](agent/run1/closed_area-9fc7d119bd43.md) | [brief](agent/run2/closed_area-9fc7d119bd43.md) |
| closed_area-a0c98f6887a9 | closed_area | Closed Areas Regulation, Schedule 5, section 140 (Lafarge to Pritchard) |  | [brief](agent/run1/closed_area-a0c98f6887a9.md) | [brief](agent/run2/closed_area-a0c98f6887a9.md) |
| closed_area-a0cbf4ca619a | closed_area | Closed Areas Regulation, Schedule 5, section 105 (Dawson Creek Environmental Demonstration |  | [brief](agent/run1/closed_area-a0cbf4ca619a.md) | [brief](agent/run2/closed_area-a0cbf4ca619a.md) |
| closed_area-a16f5f7092c9 | closed_area | Closed Areas Regulation, Schedule 8, section 6 (1***) |  | [brief](agent/run1/closed_area-a16f5f7092c9.md) | [brief](agent/run2/closed_area-a16f5f7092c9.md) |
| closed_area-a2a8642b00f9 | closed_area | Closed Areas Regulation, Schedule 7, section 15 (Tweedsmuir Park) |  | [brief](agent/run1/closed_area-a2a8642b00f9.md) | [brief](agent/run2/closed_area-a2a8642b00f9.md) |
| closed_area-a47e44d3516a | closed_area | Closed Areas Regulation, Schedule 4, section 7 ($30/hr) |  | [brief](agent/run1/closed_area-a47e44d3516a.md) | [brief](agent/run2/closed_area-a47e44d3516a.md) |
| closed_area-a4cf1eb992cb | closed_area | Closed Areas Regulation, Schedule 5.1, section 14 (Chehalis Fleetwood) |  | [brief](agent/run1/closed_area-a4cf1eb992cb.md) | [brief](agent/run2/closed_area-a4cf1eb992cb.md) |
| closed_area-a57206789b29 | closed_area | Closed Areas Regulation, Schedule 8, section 10 (1***) |  | [brief](agent/run1/closed_area-a57206789b29.md) | [brief](agent/run2/closed_area-a57206789b29.md) |
| closed_area-a7229e02db67 | closed_area | Closed Areas Regulation, Schedule 4, section 2 ($18/hr) |  | [brief](agent/run1/closed_area-a7229e02db67.md) | [brief](agent/run2/closed_area-a7229e02db67.md) |
| closed_area-a837b1f42b11 | closed_area | Closed Areas Regulation, Schedule 3, section 38 (Okanagan Connector Highway) |  | [brief](agent/run1/closed_area-a837b1f42b11.md) | [brief](agent/run2/closed_area-a837b1f42b11.md) |
| closed_area-a85a7462494a | closed_area | Closed Areas Regulation, Schedule 5, section 136 (Crawford Bay) |  | [brief](agent/run1/closed_area-a85a7462494a.md) | [brief](agent/run2/closed_area-a85a7462494a.md) |
| closed_area-a88e2d2b3d98 | closed_area | Closed Areas Regulation, Schedule 4, section 10 ($41/hr) |  | [brief](agent/run1/closed_area-a88e2d2b3d98.md) | [brief](agent/run2/closed_area-a88e2d2b3d98.md) |
| closed_area-a8b183cad90c | closed_area | Closed Areas Regulation, Schedule 5.1, section 9 (Hatzic) |  | [brief](agent/run1/closed_area-a8b183cad90c.md) | [brief](agent/run2/closed_area-a8b183cad90c.md) |
| closed_area-aa3ec933e110 | closed_area | Closed Areas Regulation, Schedule 1, section 15 (Elizabeth Lake) |  | [brief](agent/run1/closed_area-aa3ec933e110.md) | [brief](agent/run2/closed_area-aa3ec933e110.md) |
| closed_area-aa80b2ac19ef | closed_area | Closed Areas Regulation, Schedule 6, section 2 |  | [brief](agent/run1/closed_area-aa80b2ac19ef.md) | [brief](agent/run2/closed_area-aa80b2ac19ef.md) |
| closed_area-ac440232377e | closed_area | Closed Areas Regulation, Schedule 9, section 30 (Ladysmith to Malahat) |  | [brief](agent/run1/closed_area-ac440232377e.md) | [brief](agent/run2/closed_area-ac440232377e.md) |
| closed_area-acd77c4532e4 | closed_area | Closed Areas Regulation, Schedule 9, section 11 (Sechelt) |  | [brief](agent/run1/closed_area-acd77c4532e4.md) | [brief](agent/run2/closed_area-acd77c4532e4.md) |
| closed_area-ad2fd0ae08a4 | closed_area | Closed Areas Regulation, Schedule 5, section 133 (Buckley Bay) |  | [brief](agent/run1/closed_area-ad2fd0ae08a4.md) | [brief](agent/run2/closed_area-ad2fd0ae08a4.md) |
| closed_area-afbefd3a9a25 | closed_area | Closed Areas Regulation, Schedule 3, section 30 (Garibaldi Park) |  | done | done |
| closed_area-b08384fd9d55 | closed_area | Closed Areas Regulation, Schedule 5.1, section 8 (Lost Creek Forest Service Road etc.) |  | [brief](agent/run1/closed_area-b08384fd9d55.md) | [brief](agent/run2/closed_area-b08384fd9d55.md) |
| closed_area-b08a6fcea994 | closed_area | Closed Areas Regulation, Schedule 9, section 23 (Savary Island) |  | [brief](agent/run1/closed_area-b08a6fcea994.md) | [brief](agent/run2/closed_area-b08a6fcea994.md) |
| closed_area-b0a08c674fb6 | closed_area | Closed Areas Regulation, Schedule 5, section 128 (Upper Carmi Road) |  | [brief](agent/run1/closed_area-b0a08c674fb6.md) | [brief](agent/run2/closed_area-b0a08c674fb6.md) |
| closed_area-b1deaa6310a3 | closed_area | Closed Areas Regulation, Schedule 5, section 134 (Nanoose Bay) |  | [brief](agent/run1/closed_area-b1deaa6310a3.md) | [brief](agent/run2/closed_area-b1deaa6310a3.md) |
| closed_area-b229324a8c23 | closed_area | Closed Areas Regulation, Schedule 8, section 11 |  | [brief](agent/run1/closed_area-b229324a8c23.md) | [brief](agent/run2/closed_area-b229324a8c23.md) |
| closed_area-b343b46f7078 | closed_area | Closed Areas Regulation, Schedule 8, section 8 (1***) |  | [brief](agent/run1/closed_area-b343b46f7078.md) | [brief](agent/run2/closed_area-b343b46f7078.md) |
| closed_area-b36506a255f5 | closed_area | Closed Areas Regulation, Schedule 3, section 22 (Pitt Wildlife Management Area) |  | done | done |
| closed_area-b387904933a0 | closed_area | Closed Areas Regulation, Schedule 5, section 81 (Fording Mountain) |  | [brief](agent/run1/closed_area-b387904933a0.md) | [brief](agent/run2/closed_area-b387904933a0.md) |
| closed_area-b40d0646e16e | closed_area | Closed Areas Regulation, Schedule 6, section 24 (1***) |  | [brief](agent/run1/closed_area-b40d0646e16e.md) | [brief](agent/run2/closed_area-b40d0646e16e.md) |
| closed_area-b40eb8094861 | closed_area | Closed Areas Regulation, Schedule 3, section 26 (Nekite River) |  | [brief](agent/run1/closed_area-b40eb8094861.md) | [brief](agent/run2/closed_area-b40eb8094861.md) |
| closed_area-b43261f95a1a | closed_area | Closed Areas Regulation, Schedule 7, section 38 (Sunshine Meadows) |  | [brief](agent/run1/closed_area-b43261f95a1a.md) | [brief](agent/run2/closed_area-b43261f95a1a.md) |
| closed_area-b573c3ea39cd | closed_area | Closed Areas Regulation, Schedule 5, section 120 (Tow Hill) |  | [brief](agent/run1/closed_area-b573c3ea39cd.md) | [brief](agent/run2/closed_area-b573c3ea39cd.md) |
| closed_area-b5afb440abe0 | closed_area | Closed Areas Regulation, Schedule 5, section 91 (Waugh Lake — Skookumchuck) |  | done | done |
| closed_area-b689a1205feb | closed_area | Closed Areas Regulation, Schedule 3, section 6 (Swan Lake) |  | [brief](agent/run1/closed_area-b689a1205feb.md) | [brief](agent/run2/closed_area-b689a1205feb.md) |
| closed_area-b6dad8f5fdc9 | closed_area | Closed Areas Regulation, Schedule 9, section 22 (Highways) |  | [brief](agent/run1/closed_area-b6dad8f5fdc9.md) | [brief](agent/run2/closed_area-b6dad8f5fdc9.md) |
| closed_area-b734f9a7c42b | closed_area | Closed Areas Regulation, Schedule 5, section 67 (Blubber Bay) |  | done | done |
| closed_area-b76454a96fa3 | closed_area | Closed Areas Regulation, Schedule 3, section 60 (East Moberly Lake 169) |  | [brief](agent/run1/closed_area-b76454a96fa3.md) | [brief](agent/run2/closed_area-b76454a96fa3.md) |
| closed_area-b8e60c7af3da | closed_area | Closed Areas Regulation, Schedule 6, section 1 (Bag Limit) |  | [brief](agent/run1/closed_area-b8e60c7af3da.md) | [brief](agent/run2/closed_area-b8e60c7af3da.md) |
| closed_area-ba0d1970b2f0 | closed_area | Closed Areas Regulation, Schedule 5, section 68 (Lund) |  | done | done |
| closed_area-baa3c97b7c30 | closed_area | Closed Areas Regulation, Schedule 4, section 6 ($27/hr) |  | [brief](agent/run1/closed_area-baa3c97b7c30.md) | [brief](agent/run2/closed_area-baa3c97b7c30.md) |
| closed_area-bb03a902f9e7 | closed_area | Closed Areas Regulation, Schedule 1, section 2 (Columbia Lake and River) |  | [brief](agent/run1/closed_area-bb03a902f9e7.md) | [brief](agent/run2/closed_area-bb03a902f9e7.md) |
| closed_area-bb2003a9e247 | closed_area | Closed Areas Regulation, Schedule 1, section 17 (Gwaii Haanas National Park Reserve) |  | [brief](agent/run1/closed_area-bb2003a9e247.md) | [brief](agent/run2/closed_area-bb2003a9e247.md) |
| closed_area-bbf55687984c | closed_area | Closed Areas Regulation, Schedule 5, section 66 (Saltery Bay) |  | done | done |
| closed_area-bc6812e4d86d | closed_area | Closed Areas Regulation, Schedule 5, section 18 (Kumdis Bay) |  | [brief](agent/run1/closed_area-bc6812e4d86d.md) | [brief](agent/run2/closed_area-bc6812e4d86d.md) |
| closed_area-bdf422a1e0ef | closed_area | Closed Areas Regulation, Schedule 5.1, section 4 (McGuire and Tamihi Creek Forest Service  |  | [brief](agent/run1/closed_area-bdf422a1e0ef.md) | [brief](agent/run2/closed_area-bdf422a1e0ef.md) |
| closed_area-be412adb6737 | closed_area | Closed Areas Regulation, Schedule 1, section 6 (McDougall) |  | [brief](agent/run1/closed_area-be412adb6737.md) | [brief](agent/run2/closed_area-be412adb6737.md) |
| closed_area-bf6c414e2ff2 | closed_area | Closed Areas Regulation, Schedule 6, section 15 |  | [brief](agent/run1/closed_area-bf6c414e2ff2.md) | [brief](agent/run2/closed_area-bf6c414e2ff2.md) |
| closed_area-c0e4691a394f | closed_area | Closed Areas Regulation, Schedule 7, section 33 (Tweedsmuir Park) |  | [brief](agent/run1/closed_area-c0e4691a394f.md) | [brief](agent/run2/closed_area-c0e4691a394f.md) |
| closed_area-c10be1199abe | closed_area | Closed Areas Regulation, Schedule 3, section 62 (Coal Mountain Operations) |  | [brief](agent/run1/closed_area-c10be1199abe.md) | [brief](agent/run2/closed_area-c10be1199abe.md) |
| closed_area-c199f54bf6b9 | closed_area | Closed Areas Regulation, Schedule 5, section 31 (Blind Bay) |  | [brief](agent/run1/closed_area-c199f54bf6b9.md) | [brief](agent/run2/closed_area-c199f54bf6b9.md) |
| closed_area-c2600b0c366d | closed_area | Closed Areas Regulation, Schedule 5.1, section 2 (Silver Skagit Forest Service Road) |  | [brief](agent/run1/closed_area-c2600b0c366d.md) | [brief](agent/run2/closed_area-c2600b0c366d.md) |
| closed_area-c3365bebc244 | closed_area | Closed Areas Regulation, Schedule 3, section 9 (Highway 3) |  | done | done |
| closed_area-c33ab027aa7f | closed_area | Closed Areas Regulation, Schedule 5, section 5 (Buntzen Lake) |  | done | done |
| closed_area-c52bdedb91b5 | closed_area | Closed Areas Regulation, Schedule 5.1, section 7 (Florence Lake Forest Service Road) |  | [brief](agent/run1/closed_area-c52bdedb91b5.md) | [brief](agent/run2/closed_area-c52bdedb91b5.md) |
| closed_area-c5568fbbe8cb | closed_area | Closed Areas Regulation, Schedule 4, section 1 (Rate) |  | [brief](agent/run1/closed_area-c5568fbbe8cb.md) | [brief](agent/run2/closed_area-c5568fbbe8cb.md) |
| closed_area-c55939ae3cf2 | closed_area | Closed Areas Regulation, Schedule 5, section 123 (Selkirk) |  | [brief](agent/run1/closed_area-c55939ae3cf2.md) | [brief](agent/run2/closed_area-c55939ae3cf2.md) |
| closed_area-c5b6f96f777e | closed_area | Closed Areas Regulation, Schedule 5, section 99 (Village of 100 Mile House) |  | [brief](agent/run1/closed_area-c5b6f96f777e.md) | [brief](agent/run2/closed_area-c5b6f96f777e.md) |
| closed_area-c650801a1d87 | closed_area | Closed Areas Regulation, Schedule 3, section 52 (JeweI Lake) |  | [brief](agent/run1/closed_area-c650801a1d87.md) | [brief](agent/run2/closed_area-c650801a1d87.md) |
| closed_area-c6cc854c801b | closed_area | Closed Areas Regulation, Schedule 6, section 14 |  | [brief](agent/run1/closed_area-c6cc854c801b.md) | [brief](agent/run2/closed_area-c6cc854c801b.md) |
| closed_area-c74bef942e36 | closed_area | Closed Areas Regulation, Schedule 4, section 9 ($36/hr) |  | [brief](agent/run1/closed_area-c74bef942e36.md) | [brief](agent/run2/closed_area-c74bef942e36.md) |
| closed_area-c7909362ffcf | closed_area | Closed Areas Regulation, Schedule 5, section 8 (Todagin Mountain) |  | [brief](agent/run1/closed_area-c7909362ffcf.md) | [brief](agent/run2/closed_area-c7909362ffcf.md) |
| closed_area-c9afd1801ed4 | closed_area | Closed Areas Regulation, Schedule 5, section 88 (City of Terrace) |  | [brief](agent/run1/closed_area-c9afd1801ed4.md) | [brief](agent/run2/closed_area-c9afd1801ed4.md) |
| closed_area-c9bca3f9152c | closed_area | Closed Areas Regulation, Schedule 5, section 74 (Burrard Inlet) |  | done | done |
| closed_area-caf4fa112b37 | closed_area | Closed Areas Regulation, Schedule 5, section 92 (Hemlock Valley) |  | [brief](agent/run1/closed_area-caf4fa112b37.md) | [brief](agent/run2/closed_area-caf4fa112b37.md) |
| closed_area-cb146daf0d87 | closed_area | Closed Areas Regulation, Schedule 5, section 9 (Logan Lake) |  | [brief](agent/run1/closed_area-cb146daf0d87.md) | [brief](agent/run2/closed_area-cb146daf0d87.md) |
| closed_area-cc03fd81f55a | closed_area | Closed Areas Regulation, Schedule 3, section 43 (Road 248) |  | [brief](agent/run1/closed_area-cc03fd81f55a.md) | [brief](agent/run2/closed_area-cc03fd81f55a.md) |
| closed_area-cc3875e7afd5 | closed_area | Closed Areas Regulation, Schedule 3, section 36 (Conkle Lake Park) |  | [brief](agent/run1/closed_area-cc3875e7afd5.md) | [brief](agent/run2/closed_area-cc3875e7afd5.md) |
| closed_area-cc6e36386a65 | closed_area | Closed Areas Regulation, Schedule 8, section 15.1 |  | [brief](agent/run1/closed_area-cc6e36386a65.md) | [brief](agent/run2/closed_area-cc6e36386a65.md) |
| closed_area-cc7b6fac8034 | closed_area | Closed Areas Regulation, Schedule 5, section 4 (McQueen, Griffin and Isobel Lakes) |  | [brief](agent/run1/closed_area-cc7b6fac8034.md) | [brief](agent/run2/closed_area-cc7b6fac8034.md) |
| closed_area-ccce4720d726 | closed_area | Closed Areas Regulation, Schedule 8, section 24 (10(30)) |  | [brief](agent/run1/closed_area-ccce4720d726.md) | [brief](agent/run2/closed_area-ccce4720d726.md) |
| closed_area-ccd09dd05a2e | closed_area | Closed Areas Regulation, Schedule 1, section 13 (Wasa Slough) |  | [brief](agent/run1/closed_area-ccd09dd05a2e.md) | [brief](agent/run2/closed_area-ccd09dd05a2e.md) |
| closed_area-cd144b7732d9 | closed_area | Closed Areas Regulation, Schedule 9, section 27 (Campbell River to Nanaimo) |  | [brief](agent/run1/closed_area-cd144b7732d9.md) | [brief](agent/run2/closed_area-cd144b7732d9.md) |
| closed_area-cd82418ecd72 | closed_area | Closed Areas Regulation, Schedule 6, section 37 (10(20)) |  | [brief](agent/run1/closed_area-cd82418ecd72.md) | [brief](agent/run2/closed_area-cd82418ecd72.md) |
| closed_area-cdbe692ac085 | closed_area | Closed Areas Regulation, Schedule 3, section 12 (Addington Marsh) |  | done | done |
| closed_area-ce315984d6c4 | closed_area | Closed Areas Regulation, Schedule 5, section 78 (Highland Valley) |  | [brief](agent/run1/closed_area-ce315984d6c4.md) | [brief](agent/run2/closed_area-ce315984d6c4.md) |
| closed_area-cef3c426bb15 | closed_area | Closed Areas Regulation, Schedule 6, section 13.1 |  | [brief](agent/run1/closed_area-cef3c426bb15.md) | [brief](agent/run2/closed_area-cef3c426bb15.md) |
| closed_area-cf077be575c9 | closed_area | Closed Areas Regulation, Schedule 3, section 19 (The Province) |  | [brief](agent/run1/closed_area-cf077be575c9.md) | [brief](agent/run2/closed_area-cf077be575c9.md) |
| closed_area-d07c6335443c | closed_area | Closed Areas Regulation, Schedule 7, section 42 (Eskers Park) |  | [brief](agent/run1/closed_area-d07c6335443c.md) | [brief](agent/run2/closed_area-d07c6335443c.md) |
| closed_area-d08f342f86e2 | closed_area | Closed Areas Regulation, Schedule 7, section 56 (Chilko — Newton) |  | [brief](agent/run1/closed_area-d08f342f86e2.md) | [brief](agent/run2/closed_area-d08f342f86e2.md) |
| closed_area-d105f232e3d5 | closed_area | Closed Areas Regulation, Schedule 6, section 40 (5(15)) |  | [brief](agent/run1/closed_area-d105f232e3d5.md) | [brief](agent/run2/closed_area-d105f232e3d5.md) |
| closed_area-d1a919bcf3b4 | closed_area | Closed Areas Regulation, Schedule 5, section 139 (Hudson Bay Mountain/Smithers Community F |  | [brief](agent/run1/closed_area-d1a919bcf3b4.md) | [brief](agent/run2/closed_area-d1a919bcf3b4.md) |
| closed_area-d22d12dfbac7 | closed_area | Closed Areas Regulation, Schedule 1, section 5 (Lucy Island) |  | [brief](agent/run1/closed_area-d22d12dfbac7.md) | [brief](agent/run2/closed_area-d22d12dfbac7.md) |
| closed_area-d2ba50267fc5 | closed_area | Closed Areas Regulation, Schedule 5, section 65 (Gillies Bay) |  | done | done |
| closed_area-d31eb1640730 | closed_area | Closed Areas Regulation, Schedule 5, section 126 (Houston Community Forest) |  | [brief](agent/run1/closed_area-d31eb1640730.md) | [brief](agent/run2/closed_area-d31eb1640730.md) |
| closed_area-d4115c46e536 | closed_area | Closed Areas Regulation, Schedule 5, section 119 (Lion's Bay) |  | [brief](agent/run1/closed_area-d4115c46e536.md) | [brief](agent/run2/closed_area-d4115c46e536.md) |
| closed_area-d462a3b1da15 | closed_area | Closed Areas Regulation, Schedule 6, section 33 (8(24)) |  | [brief](agent/run1/closed_area-d462a3b1da15.md) | [brief](agent/run2/closed_area-d462a3b1da15.md) |
| closed_area-d51ffbf6ebed | closed_area | Closed Areas Regulation, Schedule 8, section 5 (1***) |  | [brief](agent/run1/closed_area-d51ffbf6ebed.md) | [brief](agent/run2/closed_area-d51ffbf6ebed.md) |
| closed_area-d583d82de69a | closed_area | Closed Areas Regulation, Schedule 5, section 23 (Nanaimo) |  | done | done |
| closed_area-d5e4d665e2b6 | closed_area | Closed Areas Regulation, Schedule 8, section 9 (1***) |  | [brief](agent/run1/closed_area-d5e4d665e2b6.md) | [brief](agent/run2/closed_area-d5e4d665e2b6.md) |
| closed_area-d6598280f56b | closed_area | Closed Areas Regulation, Schedule 3, section 42 (Cathedral Park) |  | [brief](agent/run1/closed_area-d6598280f56b.md) | [brief](agent/run2/closed_area-d6598280f56b.md) |
| closed_area-d884f78f044d | closed_area | Closed Areas Regulation, Schedule 9, section 25 (Port Clements) |  | [brief](agent/run1/closed_area-d884f78f044d.md) | [brief](agent/run2/closed_area-d884f78f044d.md) |
| closed_area-d8cf10ff55f7 | closed_area | Closed Areas Regulation, Schedule 3, section 1 (Duration) |  | [brief](agent/run1/closed_area-d8cf10ff55f7.md) | [brief](agent/run2/closed_area-d8cf10ff55f7.md) |
| closed_area-d9c45470876b | closed_area | Closed Areas Regulation, Schedule 5, section 87 (Mascot Gold Mines Limited) |  | [brief](agent/run1/closed_area-d9c45470876b.md) | [brief](agent/run2/closed_area-d9c45470876b.md) |
| closed_area-d9d23bcbf28e | closed_area | Closed Areas Regulation, Schedule 3, section 4 (After 3 consecutive days of DGR IV, cease  |  | [brief](agent/run1/closed_area-d9d23bcbf28e.md) | [brief](agent/run2/closed_area-d9d23bcbf28e.md) |
| closed_area-d9de42ac005c | closed_area | Closed Areas Regulation, Schedule 5, section 137 (White-Moscow Forest Service Road) |  | [brief](agent/run1/closed_area-d9de42ac005c.md) | [brief](agent/run2/closed_area-d9de42ac005c.md) |
| closed_area-da396085511d | closed_area | Closed Areas Regulation, Schedule 5, section 104 (Tatlow Road) |  | [brief](agent/run1/closed_area-da396085511d.md) | [brief](agent/run2/closed_area-da396085511d.md) |
| closed_area-da6f00893419 | closed_area | Closed Areas Regulation, Schedule 6, section 8.4 |  | [brief](agent/run1/closed_area-da6f00893419.md) | [brief](agent/run2/closed_area-da6f00893419.md) |
| closed_area-dd89608614f5 | closed_area | Closed Areas Regulation, Schedule 6, section 16 |  | [brief](agent/run1/closed_area-dd89608614f5.md) | [brief](agent/run2/closed_area-dd89608614f5.md) |
| closed_area-deab91d218ff | closed_area | Closed Areas Regulation, Schedule 5, section 118 (Central Road) |  | [brief](agent/run1/closed_area-deab91d218ff.md) | [brief](agent/run2/closed_area-deab91d218ff.md) |
| closed_area-deda442dcc3f | closed_area | Closed Areas Regulation, Schedule 9, section 20 (Canal Flats) |  | [brief](agent/run1/closed_area-deda442dcc3f.md) | [brief](agent/run2/closed_area-deda442dcc3f.md) |
| closed_area-def6756bacd8 | closed_area | Closed Areas Regulation, Schedule 6, section 39.1 (5(15)) |  | [brief](agent/run1/closed_area-def6756bacd8.md) | [brief](agent/run2/closed_area-def6756bacd8.md) |
| closed_area-df60c7ca1269 | closed_area | Closed Areas Regulation, Schedule 5, section 121 (Brenda Mines) |  | [brief](agent/run1/closed_area-df60c7ca1269.md) | [brief](agent/run2/closed_area-df60c7ca1269.md) |
| closed_area-dfd8de0457c3 | closed_area | Closed Areas Regulation, Schedule 3, section 17 (North Thormanby Island) |  | done | done |
| closed_area-dff079c6ff74 | closed_area | Closed Areas Regulation, Schedule 6, section 8.2 |  | [brief](agent/run1/closed_area-dff079c6ff74.md) | [brief](agent/run2/closed_area-dff079c6ff74.md) |
| closed_area-e17e750d7522 | closed_area | Closed Areas Regulation, Schedule 11, section 3 (Keats Island) |  | done | done |
| closed_area-e3dffa585f62 | closed_area | Closed Areas Regulation, Schedule 5, section 33 (Elbow Lake) |  | done | done |
| closed_area-e3ebdc2bc251 | closed_area | Closed Areas Regulation, Schedule 5, section 138 (Whiteswan Forest Service Road) |  | [brief](agent/run1/closed_area-e3ebdc2bc251.md) | [brief](agent/run2/closed_area-e3ebdc2bc251.md) |
| closed_area-e4ac8f7c0b20 | closed_area | Closed Areas Regulation, Schedule 9, section 12 (Powell River) |  | [brief](agent/run1/closed_area-e4ac8f7c0b20.md) | [brief](agent/run2/closed_area-e4ac8f7c0b20.md) |
| closed_area-e4d7759229ff | closed_area | Closed Areas Regulation, Schedule 5, section 38 (Wells) |  | [brief](agent/run1/closed_area-e4d7759229ff.md) | [brief](agent/run2/closed_area-e4d7759229ff.md) |
| closed_area-e6b41aa9f32e | closed_area | Closed Areas Regulation, Schedule 6, section 19 (Youth seasons) |  | [brief](agent/run1/closed_area-e6b41aa9f32e.md) | [brief](agent/run2/closed_area-e6b41aa9f32e.md) |
| closed_area-e9bfe2257eb9 | closed_area | Closed Areas Regulation, Schedule 6, section 5 |  | [brief](agent/run1/closed_area-e9bfe2257eb9.md) | [brief](agent/run2/closed_area-e9bfe2257eb9.md) |
| closed_area-e9f649f8a86b | closed_area | Closed Areas Regulation, Schedule 5, section 2 (University of British Columbia Endowment L |  | done | done |
| closed_area-eb758c8bf01b | closed_area | Closed Areas Regulation, Schedule 7, section 50 (Spatsizi Plateau Wilderness Park) |  | [brief](agent/run1/closed_area-eb758c8bf01b.md) | [brief](agent/run2/closed_area-eb758c8bf01b.md) |
| closed_area-edcdc35825c5 | closed_area | Closed Areas Regulation, Schedule 4, section 8 ($32/hr) |  | [brief](agent/run1/closed_area-edcdc35825c5.md) | [brief](agent/run2/closed_area-edcdc35825c5.md) |
| closed_area-f0914f8382cd | closed_area | Closed Areas Regulation, Schedule 5, section 111 (Fairmont) |  | [brief](agent/run1/closed_area-f0914f8382cd.md) | [brief](agent/run2/closed_area-f0914f8382cd.md) |
| closed_area-f2a3f3fb134a | closed_area | Closed Areas Regulation, Schedule 6, section 3 |  | [brief](agent/run1/closed_area-f2a3f3fb134a.md) | [brief](agent/run2/closed_area-f2a3f3fb134a.md) |
| closed_area-f2c50e7e3ad6 | closed_area | Closed Areas Regulation, Schedule 3, section 59 (Fording River/Greenhills Operations) |  | [brief](agent/run1/closed_area-f2c50e7e3ad6.md) | [brief](agent/run2/closed_area-f2c50e7e3ad6.md) |
| closed_area-f358473b99fa | closed_area | Closed Areas Regulation, Schedule 5, section 69 (Vananda) |  | done | done |
| closed_area-f4174a580f47 | closed_area | Closed Areas Regulation, Schedule 7, section 36 (Kakwa Recreation Area) |  | [brief](agent/run1/closed_area-f4174a580f47.md) | [brief](agent/run2/closed_area-f4174a580f47.md) |
| closed_area-f489d36199cf | closed_area | Closed Areas Regulation, Schedule 6, section 39 (10(30)) |  | [brief](agent/run1/closed_area-f489d36199cf.md) | [brief](agent/run2/closed_area-f489d36199cf.md) |
| closed_area-f4d1342fedfb | closed_area | Closed Areas Regulation, Schedule 5, section 19 (Kathlyn Lake) |  | [brief](agent/run1/closed_area-f4d1342fedfb.md) | [brief](agent/run2/closed_area-f4d1342fedfb.md) |
| closed_area-f5767a44367e | closed_area | Closed Areas Regulation, Schedule 6, section 30 (10(30)**) |  | [brief](agent/run1/closed_area-f5767a44367e.md) | [brief](agent/run2/closed_area-f5767a44367e.md) |
| closed_area-f5772e0db982 | closed_area | Closed Areas Regulation, Schedule 5, section 86 (York Lake) |  | [brief](agent/run1/closed_area-f5772e0db982.md) | [brief](agent/run2/closed_area-f5772e0db982.md) |
| closed_area-f66ecbc87b1c | closed_area | Closed Areas Regulation, Schedule 6, section 8.1 |  | [brief](agent/run1/closed_area-f66ecbc87b1c.md) | [brief](agent/run2/closed_area-f66ecbc87b1c.md) |
| closed_area-f7176ff14d14 | closed_area | Closed Areas Regulation, Schedule 3, section 48 (Radar Lake) |  | [brief](agent/run1/closed_area-f7176ff14d14.md) | [brief](agent/run2/closed_area-f7176ff14d14.md) |
| closed_area-f7886ed930ac | closed_area | Closed Areas Regulation, Schedule 3, section 2 (Until after the fire danger class falls be |  | [brief](agent/run1/closed_area-f7886ed930ac.md) | [brief](agent/run2/closed_area-f7886ed930ac.md) |
| closed_area-fa8a2bf44d0e | closed_area | Closed Areas Regulation, Schedule 3, section 37 (Line Creek Operations) |  | [brief](agent/run1/closed_area-fa8a2bf44d0e.md) | [brief](agent/run2/closed_area-fa8a2bf44d0e.md) |
| closed_area-fbc4c10d0635 | closed_area | Closed Areas Regulation, Schedule 7, section 48 (Beaver Lodge Trust Lands) |  | [brief](agent/run1/closed_area-fbc4c10d0635.md) | [brief](agent/run2/closed_area-fbc4c10d0635.md) |
| closed_area-fc20af1f4697 | closed_area | Closed Areas Regulation, Schedule 6, section 34 (10(30)) |  | [brief](agent/run1/closed_area-fc20af1f4697.md) | [brief](agent/run2/closed_area-fc20af1f4697.md) |
| closed_area-fcc814f881b9 | closed_area | Closed Areas Regulation, Schedule 8, section 26 (5(15)) |  | [brief](agent/run1/closed_area-fcc814f881b9.md) | [brief](agent/run2/closed_area-fcc814f881b9.md) |
| closed_area-fcf3aa1a90a9 | closed_area | Closed Areas Regulation, Schedule 3, section 47 (Saturna Island East End) |  | [brief](agent/run1/closed_area-fcf3aa1a90a9.md) | [brief](agent/run2/closed_area-fcf3aa1a90a9.md) |
| closed_area-fd0047930905 | closed_area | Closed Areas Regulation, Schedule 4, section 5 ($25/hr) |  | [brief](agent/run1/closed_area-fd0047930905.md) | [brief](agent/run2/closed_area-fd0047930905.md) |
| closed_area-fdc8f5f73006 | closed_area | Closed Areas Regulation, Schedule 5, section 29 (Paaren's Beach) |  | [brief](agent/run1/closed_area-fdc8f5f73006.md) | [brief](agent/run2/closed_area-fdc8f5f73006.md) |
| closed_area-fdf49db5ccbb | closed_area | Closed Areas Regulation, Schedule 8.1, section 1 (Burns Bog) |  | [brief](agent/run1/closed_area-fdf49db5ccbb.md) | [brief](agent/run2/closed_area-fdf49db5ccbb.md) |
| closed_area-fe32d4221af5 | closed_area | Closed Areas Regulation, Schedule 3, section 65 (Kalamalka Lake Park) |  | [brief](agent/run1/closed_area-fe32d4221af5.md) | [brief](agent/run2/closed_area-fe32d4221af5.md) |
| closed_area-ff51660c811d | closed_area | Closed Areas Regulation, Schedule 8, section 4 (1***) |  | [brief](agent/run1/closed_area-ff51660c811d.md) | [brief](agent/run2/closed_area-ff51660c811d.md) |
| dm_notice-03c32c50b081 | dm_notice | District Manager notice DCR-9ef086bc-dcr_sdfmap | 1 | [brief](agent/run1/dm_notice-03c32c50b081.md) | [brief](agent/run2/dm_notice-03c32c50b081.md) |
| dm_notice-05c0310fae1e | dm_notice | District Manager notice DCS-8f7c4b60-cascades_bridges2011dli | 1 | [brief](agent/run1/dm_notice-05c0310fae1e.md) | [brief](agent/run2/dm_notice-05c0310fae1e.md) |
| dm_notice-22dd748d910e | dm_notice | District Manager notice DQC-8d4c7fb4-bonanza_fsr_822907_closure | 2 | [brief](agent/run1/dm_notice-22dd748d910e.md) | [brief](agent/run2/dm_notice-22dd748d910e.md) |
| dm_notice-2802248371a5 | dm_notice | District Manager notice DCK-d8b34b6d-807402_03_04_05_06_fs_301_-_fsr_discontinue_and_close | 2 | [brief](agent/run1/dm_notice-2802248371a5.md) | [brief](agent/run2/dm_notice-2802248371a5.md) |
| dm_notice-29dca3b77417 | dm_notice | District Manager notice DVA-792bd4d5-project_flyer_driftwood_rebuild | 1 | [brief](agent/run1/dm_notice-29dca3b77417.md) | [brief](agent/run2/dm_notice-29dca3b77417.md) |
| dm_notice-2c0d741e9593 | dm_notice | District Manager notice DCS-01301b15-bridge_inspections_2015_hillshade_south_cascades_all_ | 1 | [brief](agent/run1/dm_notice-2c0d741e9593.md) | [brief](agent/run2/dm_notice-2c0d741e9593.md) |
| dm_notice-3d059f53d684 | dm_notice | District Manager notice DCK-4d024dd5-american_fsr_road_closure_february_9_2026 | 1 | [brief](agent/run1/dm_notice-3d059f53d684.md) | [brief](agent/run2/dm_notice-3d059f53d684.md) |
| dm_notice-4070e3bd7662 | dm_notice | District Manager notice DSE-b217a506-incomappleux_road_deactivation_appendix_a | 6 | [brief](agent/run1/dm_notice-4070e3bd7662.md) | [brief](agent/run2/dm_notice-4070e3bd7662.md) |
| dm_notice-44498c299211 | dm_notice | District Manager notice DSI-dc65a045-lucky_fsr_road_closure | 1 | [brief](agent/run1/dm_notice-44498c299211.md) | [brief](agent/run2/dm_notice-44498c299211.md) |
| dm_notice-46ba800f14c9 | dm_notice | District Manager notice DSI-2654b71d-camper_creek_mainline_gate_map | 1 | [brief](agent/run1/dm_notice-46ba800f14c9.md) | [brief](agent/run2/dm_notice-46ba800f14c9.md) |
| dm_notice-47a88e4ebc3a | dm_notice | District Manager notice DCK-79c52629-fs301_december_13_2024 | 5 | [brief](agent/run1/dm_notice-47a88e4ebc3a.md) | [brief](agent/run2/dm_notice-47a88e4ebc3a.md) |
| dm_notice-49cd6b83a58f | dm_notice | District Manager notice DCK-691e2b1a-hunter_fsr_variance_to_closure |  | [brief](agent/run1/dm_notice-49cd6b83a58f.md) | [brief](agent/run2/dm_notice-49cd6b83a58f.md) |
| dm_notice-4f6e71edc2b2 | dm_notice | District Manager notice DSI-5f111aca-kmu_gate_location_overview_map | 1 | [brief](agent/run1/dm_notice-4f6e71edc2b2.md) | [brief](agent/run2/dm_notice-4f6e71edc2b2.md) |
| dm_notice-579cf5cd7f21 | dm_notice | District Manager notice DCK-e487c48e-ck-2519_-_2024_inspection_signed | 4 | [brief](agent/run1/dm_notice-579cf5cd7f21.md) | [brief](agent/run2/dm_notice-579cf5cd7f21.md) |
| dm_notice-5f3168c65333 | dm_notice | District Manager notice DSI-66e61e93-gate_location_map_braden_mainline_and_tr11 | 1 | [brief](agent/run1/dm_notice-5f3168c65333.md) | [brief](agent/run2/dm_notice-5f3168c65333.md) |
| dm_notice-6398af6abce1 | dm_notice | District Manager notice DSC-335a98d1-a94817_bk_forest_service_road | 1 | [brief](agent/run1/dm_notice-6398af6abce1.md) | [brief](agent/run2/dm_notice-6398af6abce1.md) |
| dm_notice-67beb0c6c436 | dm_notice | District Manager notice DCK-8347a650-71w27vb_fsr_closures_amended_july_22 |  | [brief](agent/run1/dm_notice-67beb0c6c436.md) | [brief](agent/run2/dm_notice-67beb0c6c436.md) |
| dm_notice-6af5c393acaa | dm_notice | District Manager notice DCR-13a23bfb-johnhart_cw_nocamporder | 1 | [brief](agent/run1/dm_notice-6af5c393acaa.md) | [brief](agent/run2/dm_notice-6af5c393acaa.md) |
| dm_notice-73cb89e48ec4 | dm_notice | District Manager notice DSE-2cb2b189-incomappleux_br2deact | 1 | [brief](agent/run1/dm_notice-73cb89e48ec4.md) | [brief](agent/run2/dm_notice-73cb89e48ec4.md) |
| dm_notice-77caf144ff96 | dm_notice | District Manager notice DCK-8eb16f04-squeah_fsr_-_2020_road_closure |  | [brief](agent/run1/dm_notice-77caf144ff96.md) | [brief](agent/run2/dm_notice-77caf144ff96.md) |
| dm_notice-7b2528a6e93b | dm_notice | District Manager notice DCK-9a9e782c-notice_of_clousre_harrison_east_fsr_-_rescinded |  | [brief](agent/run1/dm_notice-7b2528a6e93b.md) | [brief](agent/run2/dm_notice-7b2528a6e93b.md) |
| dm_notice-8bee35a919ef | dm_notice | District Manager notice DVA-3faae646-dsn_road_restictions_2026_spring_road_bans_bulletin_3 |  | [brief](agent/run1/dm_notice-8bee35a919ef.md) | [brief](agent/run2/dm_notice-8bee35a919ef.md) |
| dm_notice-8ec7980480be | dm_notice | District Manager notice DSI-8a4bec36-news_release_-_access_changes_implemented_to_protect_ | 1 | [brief](agent/run1/dm_notice-8ec7980480be.md) | [brief](agent/run2/dm_notice-8ec7980480be.md) |
| dm_notice-92978222c14a | dm_notice | District Manager notice DVA-d66840c9-upper_driftwood_deactivation_advertisement | 1 | [brief](agent/run1/dm_notice-92978222c14a.md) | [brief](agent/run2/dm_notice-92978222c14a.md) |
| dm_notice-92e470efc593 | dm_notice | District Manager notice DCK-a36f6f84-fsr_road_closure_notice_december_storm_damage | 1 | [brief](agent/run1/dm_notice-92e470efc593.md) | [brief](agent/run2/dm_notice-92e470efc593.md) |
| dm_notice-95ecee4475f1 | dm_notice | District Manager notice DCK-15d8fff4-east_anderson_fsr_road_closure_april_24_2026 |  | [brief](agent/run1/dm_notice-95ecee4475f1.md) | [brief](agent/run2/dm_notice-95ecee4475f1.md) |
| dm_notice-97424f8299a4 | dm_notice | District Manager notice DCK-94372f1a-mowhokam_east_fsr_closure |  | [brief](agent/run1/dm_notice-97424f8299a4.md) | [brief](agent/run2/dm_notice-97424f8299a4.md) |
| dm_notice-97f046c45b28 | dm_notice | District Manager notice DQC-25fa270a-hanagover_fsr_822906_closure | 2 | [brief](agent/run1/dm_notice-97f046c45b28.md) | [brief](agent/run2/dm_notice-97f046c45b28.md) |
| dm_notice-9c489efe855d | dm_notice | District Manager notice DSI-a9fec493-walbran700_gate_location_map_2026mar9 | 1 | [brief](agent/run1/dm_notice-9c489efe855d.md) | [brief](agent/run2/dm_notice-9c489efe855d.md) |
| dm_notice-a124c86ffc0e | dm_notice | District Manager notice DQC-6a1cfbef-2024_06_07_bill_brown_closure | 1 | [brief](agent/run1/dm_notice-a124c86ffc0e.md) | [brief](agent/run2/dm_notice-a124c86ffc0e.md) |
| dm_notice-ab3397e9c6ff | dm_notice | District Manager notice DSI-7d1cff67-canal_main_closure | 1 | [brief](agent/run1/dm_notice-ab3397e9c6ff.md) | [brief](agent/run2/dm_notice-ab3397e9c6ff.md) |
| dm_notice-b0adad5bdb6a | dm_notice | District Manager notice DVA-70228e68-dsn_road_restrictions_bulletin_4 |  | [brief](agent/run1/dm_notice-b0adad5bdb6a.md) | [brief](agent/run2/dm_notice-b0adad5bdb6a.md) |
| dm_notice-b993cee8f4fb | dm_notice | District Manager notice DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_ | 1 | [brief](agent/run1/dm_notice-b993cee8f4fb.md) | [brief](agent/run2/dm_notice-b993cee8f4fb.md) |
| dm_notice-c1e6d9138000 | dm_notice | District Manager notice DCK-0c70d269-bucklin_fsr_-_2019_road_closure | 1 | [brief](agent/run1/dm_notice-c1e6d9138000.md) | [brief](agent/run2/dm_notice-c1e6d9138000.md) |
| dm_notice-c6525eac1608 | dm_notice | District Manager notice DCK-1379e235-radium_fsr_fs301 | 2 | [brief](agent/run1/dm_notice-c6525eac1608.md) | [brief](agent/run2/dm_notice-c6525eac1608.md) |
| dm_notice-cea83dc5881f | dm_notice | District Manager notice DCK-42f99435-1045201_-_discontinue_and_close_with_exhibit_a | 2 | [brief](agent/run1/dm_notice-cea83dc5881f.md) | [brief](agent/run2/dm_notice-cea83dc5881f.md) |
| dm_notice-cef07fda7a23 | dm_notice | District Manager notice DCK-cfd72836-ac8126-19-01_bcts | 1 | [brief](agent/run1/dm_notice-cef07fda7a23.md) | [brief](agent/run2/dm_notice-cef07fda7a23.md) |
| dm_notice-d24da5cb8e78 | dm_notice | District Manager notice DSI-c4f696e7-map_tfl46_bugaboo_main_gate_location | 1 | [brief](agent/run1/dm_notice-d24da5cb8e78.md) | [brief](agent/run2/dm_notice-d24da5cb8e78.md) |
| dm_notice-d9d8ff1688d2 | dm_notice | District Manager notice DSE-e4e6b5f8-trout_lake_rady_creek_deactivation_prescription_map | 6 | [brief](agent/run1/dm_notice-d9d8ff1688d2.md) | [brief](agent/run2/dm_notice-d9d8ff1688d2.md) |
| dm_notice-df452475dbca | dm_notice | District Manager notice DQC-57ce8ede-delkatla_10891_closure | 2 | [brief](agent/run1/dm_notice-df452475dbca.md) | [brief](agent/run2/dm_notice-df452475dbca.md) |
| dm_notice-e0657aa9e807 | dm_notice | District Manager notice DSI-98c8d0df-map_gate_fsr5833_br01 | 1 | [brief](agent/run1/dm_notice-e0657aa9e807.md) | [brief](agent/run2/dm_notice-e0657aa9e807.md) |
| dm_notice-e4567d912726 | dm_notice | District Manager notice DSE-68d293da-faq_document_for_incomappleux_deactivation | 1 | [brief](agent/run1/dm_notice-e4567d912726.md) | [brief](agent/run2/dm_notice-e4567d912726.md) |
| dm_notice-e9ebadf5a862 | dm_notice | District Manager notice DCK-cdff3673-bench_fsr_road_closure |  | [brief](agent/run1/dm_notice-e9ebadf5a862.md) | [brief](agent/run2/dm_notice-e9ebadf5a862.md) |
| dm_notice-eaadcf02224f | dm_notice | District Manager notice DCK-668dd9ac-rup_obligations_and_expectations_-_august_18_2021_sig | 2 | [brief](agent/run1/dm_notice-eaadcf02224f.md) | [brief](agent/run2/dm_notice-eaadcf02224f.md) |
| dm_notice-f09d0a71d96e | dm_notice | District Manager notice DSI-c2357ace-map-banon_fsr_gate_location | 1 | [brief](agent/run1/dm_notice-f09d0a71d96e.md) | [brief](agent/run2/dm_notice-f09d0a71d96e.md) |
| dm_notice-f78eb0b3d8dc | dm_notice | District Manager notice DCK-1f93b9e0-cypress_lake_fsr_fs301 | 2 | [brief](agent/run1/dm_notice-f78eb0b3d8dc.md) | [brief](agent/run2/dm_notice-f78eb0b3d8dc.md) |
| road_notice-1c9098e8d135 | road_notice | Dore River – Br.2 FSR (8493.02) |  | done | done |
| road_notice-27cbe81c8759 | road_notice | Chuc 20600 (5506.34) |  | done | done |
| road_notice-2dfa8620da6e | road_notice | Yalakom River FSR 7649.01 (updated Sept 3, 2026) |  | done | done |
| road_notice-2e98b98eea59 | road_notice | Chuchinka-Colbourne FSR (July 16, 2026) |  | done | done |
| road_notice-305afdc68d2e | road_notice | Woodbury Fletcher FSR 0198.02 (May 29, 2026) |  | done | done |
| road_notice-34ab84673962 | road_notice | Jumbo Creek FSR |  | done | done |
| road_notice-3b209d4870dc | road_notice | Bowron FSR 7141.01 (October 8, 2026) |  | done | done |
| road_notice-436cb9ce3a27 | road_notice | Chuchinka-Colbourne FSR (5506.04) |  | done | done |
| road_notice-4a79977a9c88 | road_notice | Bonaparte-Komori 6315.15 (May 27,2025) |  | done | done |
| road_notice-59378955a6ad | road_notice | Morice River FSR 4656-01 (September 4, 2026) |  | done | done |
| road_notice-5ee6f2f9d918 | road_notice | Driftwood FSR 7822.01 - 15km Notice (Summer 2026) |  | done | done |
| road_notice-67c8e5619bb2 | road_notice | Clusko River – Aneko Creek FSR (4600rd) - Project#: 7356.04 |  | done | done |
| road_notice-694c9c949f21 | road_notice | Stawamus/Indian River FSR |  | done | done |
| road_notice-7236bbb51a24 | road_notice | Tom Cole Mountain 7670.01 (updated Sept 3, 2026) |  | done | done |
| road_notice-7dee7073507f | road_notice | Redding Creek FSR 0252.05 (September 2, 2026) |  | done | done |
| road_notice-8150c3e15b48 | road_notice | Bleeker FSR 8631.01 (September 28 - October 31, 2026) |  | done | done |
| road_notice-83206bc5517e | road_notice | Maxan Thompson Connector FSR 7735-26 (September 8 - 14, 2026) |  | done | done |
| road_notice-8c70e4ba161f | road_notice | Spout-Oie FSR 6411.01 (May 27, 2025) |  | done | done |
| road_notice-9079a7718b9f | road_notice | Sanca Creek FSR 0189.01 (September 15 to October 9, 2026) |  | done | done |
| road_notice-9243ad7b4d4c | road_notice | Goat Range Park Br FSR 7051.02 (June 13, 2025) |  | done | done |
| road_notice-92443fbd9a1f | road_notice | Caribou Mountain FSR 9137.01 (November 13, 2025) |  | done | done |
| road_notice-a16e2f9adcea | road_notice | Squamish River FSR |  | done | done |
| road_notice-adf87b7adf9d | road_notice | Seymour River FSR 7271.01 (September 15, 2025) |  | done | done |
| road_notice-aebe76499bd2 | road_notice | McClatchie Creek FSR 5466.06 (August 2024) |  | done | done |
| road_notice-b52b74a709de | road_notice | Planned Bridge Maintenance (updated Sept 3, 2026) |  | done | done |
| road_notice-b5f179a1efdc | road_notice | Lillooet South FSR |  | done | done |
| road_notice-c9412ce03a2c | road_notice | Scottie Creek FSR 5451.01 (September 1 - September 25, 2026) |  | done | done |
| road_notice-d35c4cfa553b | road_notice | Otter Creek FSR 0564.03 (September 19, 2026) |  | done | done |
| road_notice-d744d0570ff0 | road_notice | Hunter Creek FSR 6086.01 (July 14, 2026) |  | done | done |
| road_notice-dcd926671461 | road_notice | Dore FSR 8493.01 (August 17, 2026) |  | done | done |
| road_notice-e6f5d7094fe2 | road_notice | Caribou FSR 10998.01 (2016) |  | done | done |
| road_notice-f5b65a1fa713 | road_notice | Adams Lake West FSR 7458.01 (September 19, 2023) |  | done | done |
| road_notice-f63a651bc0d9 | road_notice | Sechelt Roberts Branch 01 & 02 - FSR 7575 01 & 02 |  | done | done |
