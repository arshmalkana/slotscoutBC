# Agent-mode extraction work list

Generated 2026-10-20T15:12:20.832Z by `make extract` (mode: agent; no ANTHROPIC_API_KEY in .env).

Run 1: Claude Code reads each brief in `queue/agent/run1/` and writes the answer file it names. Run 2: for each brief in `queue/agent/run2/`, start a fresh subagent and give it only that brief (it holds the prompt, schema and source text, never the run-1 answer); it replies with file paths only, so nothing of run 2 reaches run 1. Then run `make build`.

Progress: run 1 103 of 361 done (258 left); run 2 103 of 361 done (258 left).

| Task | Kind | Title | Images | Run 1 | Run 2 |
| --- | --- | --- | ---: | --- | --- |
| bylaw-1af291427d0b | bylaw | Squamish-Lillooet Regional District: Firearms Electoral Area A / Squamish-Lillooet Regiona |  | done | done |
| bylaw-3578174fd5ce | bylaw | Village of Belcarra: Firearms Control Bylaw No. 498-2016 |  | [brief](agent/run1/bylaw-3578174fd5ce.md) | [brief](agent/run2/bylaw-3578174fd5ce.md) |
| bylaw-4bec108b2629 | bylaw | City of Chilliwack: Firearms Regulation Bylaw 2740 (C) |  | done | done |
| bylaw-51575dc90ee6 | bylaw | City of Langley: Firearms Bylaw |  | [brief](agent/run1/bylaw-51575dc90ee6.md) | [brief](agent/run2/bylaw-51575dc90ee6.md) |
| bylaw-7767f986e7c1 | bylaw | City of Richmond: Firearm Discharge Regulation Bylaw 4183 (1983) |  | [brief](agent/run1/bylaw-7767f986e7c1.md) | [brief](agent/run2/bylaw-7767f986e7c1.md) |
| bylaw-8ad49bb5b7a2 | bylaw | Squamish-Lillooet Regional District: RB_1294 Electoral Area D Firearms Bylaw (Consoldiatio |  | [brief](agent/run1/bylaw-8ad49bb5b7a2.md) | [brief](agent/run2/bylaw-8ad49bb5b7a2.md) |
| bylaw-d25bbe7b8455 | bylaw | City of Langley: Firearms Bylaw |  | done | done |
| bylaw-df927588ea72 | bylaw | City of Chilliwack: Firearms Regulation Bylaw 2740 (C) |  | done | done |
| closed_area-01877715a204 | closed_area | Closed Areas Regulation, Schedule 5, section 45 (Lakelse Lake) |  | [brief](agent/run1/closed_area-01877715a204.md) | [brief](agent/run2/closed_area-01877715a204.md) |
| closed_area-03698f3cea89 | closed_area | Closed Areas Regulation, Schedule 9, section 4 (Barnston Island) |  | [brief](agent/run1/closed_area-03698f3cea89.md) | [brief](agent/run2/closed_area-03698f3cea89.md) |
| closed_area-072e8f6c6e08 | closed_area | Closed Areas Regulation, Schedule 5, section 95 (Equity Mines) |  | [brief](agent/run1/closed_area-072e8f6c6e08.md) | [brief](agent/run2/closed_area-072e8f6c6e08.md) |
| closed_area-07e70da5db1a | closed_area | Closed Areas Regulation, Schedule 3, section 10 (Similkameen Mining Company Limited) |  | [brief](agent/run1/closed_area-07e70da5db1a.md) | [brief](agent/run2/closed_area-07e70da5db1a.md) |
| closed_area-07ff6e1fc5ae | closed_area | Closed Areas Regulation, Schedule 3, section 61 (Elkview Operations) |  | [brief](agent/run1/closed_area-07ff6e1fc5ae.md) | [brief](agent/run2/closed_area-07ff6e1fc5ae.md) |
| closed_area-0acc7f98623c | closed_area | Closed Areas Regulation, Schedule 5, section 55 (Yale) |  | [brief](agent/run1/closed_area-0acc7f98623c.md) | [brief](agent/run2/closed_area-0acc7f98623c.md) |
| closed_area-0b1cebfa9f5c | closed_area | Closed Areas Regulation, Schedule 3, section 44 (Nitinat River) |  | [brief](agent/run1/closed_area-0b1cebfa9f5c.md) | [brief](agent/run2/closed_area-0b1cebfa9f5c.md) |
| closed_area-0b573d6afd60 | closed_area | Closed Areas Regulation, Schedule 1, section 1 (Bergenham and Moberly) |  | [brief](agent/run1/closed_area-0b573d6afd60.md) | [brief](agent/run2/closed_area-0b573d6afd60.md) |
| closed_area-0b6276017c6b | closed_area | Closed Areas Regulation, Schedule 5, section 28 (Highways) |  | [brief](agent/run1/closed_area-0b6276017c6b.md) | [brief](agent/run2/closed_area-0b6276017c6b.md) |
| closed_area-0cb50d07636d | closed_area | Closed Areas Regulation, Schedule 3, section 40 (Lazo Marsh) |  | [brief](agent/run1/closed_area-0cb50d07636d.md) | [brief](agent/run2/closed_area-0cb50d07636d.md) |
| closed_area-0d1a02e85383 | closed_area | Closed Areas Regulation, Schedule 5, section 11 (Bowen Island) |  | [brief](agent/run1/closed_area-0d1a02e85383.md) | [brief](agent/run2/closed_area-0d1a02e85383.md) |
| closed_area-0d2935f2f4a7 | closed_area | Closed Areas Regulation, Schedule 5, section 124 (Gillies Bay and Shelter Point Roads) |  | [brief](agent/run1/closed_area-0d2935f2f4a7.md) | [brief](agent/run2/closed_area-0d2935f2f4a7.md) |
| closed_area-0daeb334a4fe | closed_area | Closed Areas Regulation, Schedule 5, section 110 (Windermere) |  | [brief](agent/run1/closed_area-0daeb334a4fe.md) | [brief](agent/run2/closed_area-0daeb334a4fe.md) |
| closed_area-0ea0dae28265 | closed_area | Closed Areas Regulation, Schedule 3, section 68 (Burnt River) |  | [brief](agent/run1/closed_area-0ea0dae28265.md) | [brief](agent/run2/closed_area-0ea0dae28265.md) |
| closed_area-0eab0fc7d7e1 | closed_area | Closed Areas Regulation, Schedule 1, section 4 (George C. Reifel) |  | [brief](agent/run1/closed_area-0eab0fc7d7e1.md) | [brief](agent/run2/closed_area-0eab0fc7d7e1.md) |
| closed_area-0eb03c49fc60 | closed_area | Closed Areas Regulation, Schedule 3, section 45 (Cowichan Lake) |  | [brief](agent/run1/closed_area-0eb03c49fc60.md) | [brief](agent/run2/closed_area-0eb03c49fc60.md) |
| closed_area-0f804b062df6 | closed_area | Closed Areas Regulation, Schedule 5, section 20 (Charlie Lake) |  | [brief](agent/run1/closed_area-0f804b062df6.md) | [brief](agent/run2/closed_area-0f804b062df6.md) |
| closed_area-127444e32082 | closed_area | Closed Areas Regulation, Schedule 5, section 62 (Squamish) |  | [brief](agent/run1/closed_area-127444e32082.md) | [brief](agent/run2/closed_area-127444e32082.md) |
| closed_area-136c089f2ac4 | closed_area | Closed Areas Regulation, Schedule 3, section 57 (Edgewater) |  | [brief](agent/run1/closed_area-136c089f2ac4.md) | [brief](agent/run2/closed_area-136c089f2ac4.md) |
| closed_area-13d68a479aa9 | closed_area | Closed Areas Regulation, Schedule 9, section 28 (Quadra Island) |  | [brief](agent/run1/closed_area-13d68a479aa9.md) | [brief](agent/run2/closed_area-13d68a479aa9.md) |
| closed_area-13e77c6688c4 | closed_area | Closed Areas Regulation, Schedule 7, section 35 (Creston Valley Wildlife Management Area) |  | [brief](agent/run1/closed_area-13e77c6688c4.md) | [brief](agent/run2/closed_area-13e77c6688c4.md) |
| closed_area-148f1a23c5f0 | closed_area | Closed Areas Regulation, Schedule 5, section 56 (Popkum) |  | [brief](agent/run1/closed_area-148f1a23c5f0.md) | [brief](agent/run2/closed_area-148f1a23c5f0.md) |
| closed_area-1874837ee201 | closed_area | Closed Areas Regulation, Schedule 1, section 10 (Serpentine River) |  | [brief](agent/run1/closed_area-1874837ee201.md) | [brief](agent/run2/closed_area-1874837ee201.md) |
| closed_area-18e8a4ff6c25 | closed_area | Closed Areas Regulation, Schedule 5, section 130 (Roberts Bank Superport and Tsawwassen Fe |  | [brief](agent/run1/closed_area-18e8a4ff6c25.md) | [brief](agent/run2/closed_area-18e8a4ff6c25.md) |
| closed_area-192ad6ccdffc | closed_area | Closed Areas Regulation, Schedule 3, section 16 (Argenta Marsh Wildlife Management Area) |  | [brief](agent/run1/closed_area-192ad6ccdffc.md) | [brief](agent/run2/closed_area-192ad6ccdffc.md) |
| closed_area-195cdbe9083d | closed_area | Closed Areas Regulation, Schedule 10, section 3 (One Island Pasture) |  | [brief](agent/run1/closed_area-195cdbe9083d.md) | [brief](agent/run2/closed_area-195cdbe9083d.md) |
| closed_area-19e6bc37a1a7 | closed_area | Closed Areas Regulation, Schedule 9, section 10 (Chilliwack Valley) |  | [brief](agent/run1/closed_area-19e6bc37a1a7.md) | [brief](agent/run2/closed_area-19e6bc37a1a7.md) |
| closed_area-1c864322ab1b | closed_area | Closed Areas Regulation, Schedule 9, section 1 |  | [brief](agent/run1/closed_area-1c864322ab1b.md) | [brief](agent/run2/closed_area-1c864322ab1b.md) |
| closed_area-1d9516a666ac | closed_area | Closed Areas Regulation, Schedule 5, section 48 (Naramata) |  | [brief](agent/run1/closed_area-1d9516a666ac.md) | [brief](agent/run2/closed_area-1d9516a666ac.md) |
| closed_area-1df0a76d5f63 | closed_area | Closed Areas Regulation, Schedule 5, section 49 (Huntingdon and Sumas Mountain) |  | [brief](agent/run1/closed_area-1df0a76d5f63.md) | [brief](agent/run2/closed_area-1df0a76d5f63.md) |
| closed_area-1e9ddb06bf3e | closed_area | Closed Areas Regulation, Schedule 3, section 4 (Sicamous) |  | [brief](agent/run1/closed_area-1e9ddb06bf3e.md) | [brief](agent/run2/closed_area-1e9ddb06bf3e.md) |
| closed_area-21ac16bd1ce9 | closed_area | Closed Areas Regulation, Schedule 1, section 9 (Robert W. Starratt) |  | [brief](agent/run1/closed_area-21ac16bd1ce9.md) | [brief](agent/run2/closed_area-21ac16bd1ce9.md) |
| closed_area-23eef6d92e2b | closed_area | Closed Areas Regulation, Schedule 2, section 1 (Stum Lake) |  | [brief](agent/run1/closed_area-23eef6d92e2b.md) | [brief](agent/run2/closed_area-23eef6d92e2b.md) |
| closed_area-24f920e861f1 | closed_area | Closed Areas Regulation, Schedule 7, section 37 (Silver Star Recreation Area) |  | [brief](agent/run1/closed_area-24f920e861f1.md) | [brief](agent/run2/closed_area-24f920e861f1.md) |
| closed_area-274c23183e9d | closed_area | Closed Areas Regulation, Schedule 3, section 58 (Mudge Island) |  | [brief](agent/run1/closed_area-274c23183e9d.md) | [brief](agent/run2/closed_area-274c23183e9d.md) |
| closed_area-29bbb915c6d5 | closed_area | Closed Areas Regulation, Schedule 5, section 75 (Okanagan Falls) |  | [brief](agent/run1/closed_area-29bbb915c6d5.md) | [brief](agent/run2/closed_area-29bbb915c6d5.md) |
| closed_area-29dc15dfa8b1 | closed_area | Closed Areas Regulation, Schedule 5.1, section 13 (Squamish River Valley) |  | [brief](agent/run1/closed_area-29dc15dfa8b1.md) | [brief](agent/run2/closed_area-29dc15dfa8b1.md) |
| closed_area-2ad6b47296bf | closed_area | Closed Areas Regulation, Schedule 5, section 58 (Masset) |  | [brief](agent/run1/closed_area-2ad6b47296bf.md) | [brief](agent/run2/closed_area-2ad6b47296bf.md) |
| closed_area-2bd9ae98e085 | closed_area | Closed Areas Regulation, Schedule 5, section 47 (Sandspit) |  | [brief](agent/run1/closed_area-2bd9ae98e085.md) | [brief](agent/run2/closed_area-2bd9ae98e085.md) |
| closed_area-2d26d5c573b6 | closed_area | Closed Areas Regulation, Schedule 7, section 54 (Fontas) |  | [brief](agent/run1/closed_area-2d26d5c573b6.md) | [brief](agent/run2/closed_area-2d26d5c573b6.md) |
| closed_area-2e6b184452c7 | closed_area | Closed Areas Regulation, Schedule 5, section 122 (Quinsam Coal Mine) |  | [brief](agent/run1/closed_area-2e6b184452c7.md) | [brief](agent/run2/closed_area-2e6b184452c7.md) |
| closed_area-30e75254a992 | closed_area | Closed Areas Regulation, Schedule 7, section 39 (Cody Caves) |  | [brief](agent/run1/closed_area-30e75254a992.md) | [brief](agent/run2/closed_area-30e75254a992.md) |
| closed_area-313c49b86faa | closed_area | Closed Areas Regulation, Schedule 5, section 114 (Westcan Terminals) |  | [brief](agent/run1/closed_area-313c49b86faa.md) | [brief](agent/run2/closed_area-313c49b86faa.md) |
| closed_area-34ae02e94d34 | closed_area | Closed Areas Regulation, Schedule 3, section 66 (Marble Canyon Park) |  | [brief](agent/run1/closed_area-34ae02e94d34.md) | [brief](agent/run2/closed_area-34ae02e94d34.md) |
| closed_area-356886b5f503 | closed_area | Closed Areas Regulation, Schedule 7, section 7 (Murtle Lake Nature Conservancy) |  | [brief](agent/run1/closed_area-356886b5f503.md) | [brief](agent/run2/closed_area-356886b5f503.md) |
| closed_area-35cec8c76c29 | closed_area | Closed Areas Regulation, Schedule 1, section 3 (Delkatla) |  | [brief](agent/run1/closed_area-35cec8c76c29.md) | [brief](agent/run2/closed_area-35cec8c76c29.md) |
| closed_area-36c6775829a4 | closed_area | Closed Areas Regulation, Schedule 3, section 69 (Nisg̱a'a Highway) |  | [brief](agent/run1/closed_area-36c6775829a4.md) | [brief](agent/run2/closed_area-36c6775829a4.md) |
| closed_area-374aae84b80f | closed_area | Closed Areas Regulation, Schedule 4, section 3 (Pitt Wildlife Management Area) |  | [brief](agent/run1/closed_area-374aae84b80f.md) | [brief](agent/run2/closed_area-374aae84b80f.md) |
| closed_area-3af30a61ad1c | closed_area | Closed Areas Regulation, Schedule 7, section 53 (Highway 3 — Loop Bridge and Alexander Bri |  | [brief](agent/run1/closed_area-3af30a61ad1c.md) | [brief](agent/run2/closed_area-3af30a61ad1c.md) |
| closed_area-3b08aa1eba58 | closed_area | Closed Areas Regulation, Schedule 5, section 100 (Snootli Creek Park) |  | [brief](agent/run1/closed_area-3b08aa1eba58.md) | [brief](agent/run2/closed_area-3b08aa1eba58.md) |
| closed_area-3c3e3104f105 | closed_area | Closed Areas Regulation, Schedule 8, section 5 (K'waal and Kitkiata Watersheds) |  | [brief](agent/run1/closed_area-3c3e3104f105.md) | [brief](agent/run2/closed_area-3c3e3104f105.md) |
| closed_area-3c7c0d0bd18a | closed_area | Closed Areas Regulation, Schedule 7, section 6 (Lot 495 N.W.D.) |  | [brief](agent/run1/closed_area-3c7c0d0bd18a.md) | [brief](agent/run2/closed_area-3c7c0d0bd18a.md) |
| closed_area-3cdccdb7d537 | closed_area | Closed Areas Regulation, Schedule 5, section 3 (Ganges) |  | [brief](agent/run1/closed_area-3cdccdb7d537.md) | [brief](agent/run2/closed_area-3cdccdb7d537.md) |
| closed_area-3de27ca3ef20 | closed_area | Closed Areas Regulation, Schedule 9, section 2 (Pemberton) |  | [brief](agent/run1/closed_area-3de27ca3ef20.md) | [brief](agent/run2/closed_area-3de27ca3ef20.md) |
| closed_area-3e1fbbb359db | closed_area | Closed Areas Regulation, Schedule 5.1, section 6 (Jones Lake and Lorenzetta Forest Service |  | [brief](agent/run1/closed_area-3e1fbbb359db.md) | [brief](agent/run2/closed_area-3e1fbbb359db.md) |
| closed_area-3ea11c617621 | closed_area | Closed Areas Regulation, Schedule 3, section 24 (Kamloops) |  | [brief](agent/run1/closed_area-3ea11c617621.md) | [brief](agent/run2/closed_area-3ea11c617621.md) |
| closed_area-3ee32f8313b2 | closed_area | Closed Areas Regulation, Schedule 5, section 113 (Fort St. John Sewage Lagoons) |  | [brief](agent/run1/closed_area-3ee32f8313b2.md) | [brief](agent/run2/closed_area-3ee32f8313b2.md) |
| closed_area-4183800e83f3 | closed_area | Closed Areas Regulation, Schedule 3, section 5 (Salmon Arm) |  | [brief](agent/run1/closed_area-4183800e83f3.md) | [brief](agent/run2/closed_area-4183800e83f3.md) |
| closed_area-41c78944a554 | closed_area | Closed Areas Regulation, Schedule 5, section 106 (Babine River) |  | [brief](agent/run1/closed_area-41c78944a554.md) | [brief](agent/run2/closed_area-41c78944a554.md) |
| closed_area-421bac59608a | closed_area | Closed Areas Regulation, Schedule 7, section 44 (Gwillim Lake Park) |  | [brief](agent/run1/closed_area-421bac59608a.md) | [brief](agent/run2/closed_area-421bac59608a.md) |
| closed_area-42c72f39fa7c | closed_area | Closed Areas Regulation, Schedule 5, section 93 (Cold Fish Lake Camp) |  | [brief](agent/run1/closed_area-42c72f39fa7c.md) | [brief](agent/run2/closed_area-42c72f39fa7c.md) |
| closed_area-4317cdfbb8dc | closed_area | Closed Areas Regulation, Schedule 5, section 125 (Comox Harbour) |  | [brief](agent/run1/closed_area-4317cdfbb8dc.md) | [brief](agent/run2/closed_area-4317cdfbb8dc.md) |
| closed_area-43a8e84771ab | closed_area | Closed Areas Regulation, Schedule 5, section 32 (Sooke and Metchosin) |  | [brief](agent/run1/closed_area-43a8e84771ab.md) | [brief](agent/run2/closed_area-43a8e84771ab.md) |
| closed_area-43d1a35120d2 | closed_area | Closed Areas Regulation, Schedule 4, section 6 (Kennedy Siding) |  | [brief](agent/run1/closed_area-43d1a35120d2.md) | [brief](agent/run2/closed_area-43d1a35120d2.md) |
| closed_area-43ff03316408 | closed_area | Closed Areas Regulation, Schedule 9, section 7 (Cultus Lake) |  | [brief](agent/run1/closed_area-43ff03316408.md) | [brief](agent/run2/closed_area-43ff03316408.md) |
| closed_area-4444eb27f7fa | closed_area | Closed Areas Regulation, Schedule 3, section 25 (Stone Mountain) |  | [brief](agent/run1/closed_area-4444eb27f7fa.md) | [brief](agent/run2/closed_area-4444eb27f7fa.md) |
| closed_area-4539937d1c5e | closed_area | Closed Areas Regulation, Schedule 5, section 37 (Red Rock Seed Orchard) |  | [brief](agent/run1/closed_area-4539937d1c5e.md) | [brief](agent/run2/closed_area-4539937d1c5e.md) |
| closed_area-456debe36ad5 | closed_area | Closed Areas Regulation, Schedule 6, section 6 (Osoyoos Oxbows) |  | [brief](agent/run1/closed_area-456debe36ad5.md) | [brief](agent/run2/closed_area-456debe36ad5.md) |
| closed_area-45759128e829 | closed_area | Closed Areas Regulation, Schedule 5, section 7 (Englishman River) |  | [brief](agent/run1/closed_area-45759128e829.md) | [brief](agent/run2/closed_area-45759128e829.md) |
| closed_area-45f547b7e5ab | closed_area | Closed Areas Regulation, Schedule 5, section 27 (Cherry Point) |  | [brief](agent/run1/closed_area-45f547b7e5ab.md) | [brief](agent/run2/closed_area-45f547b7e5ab.md) |
| closed_area-480ce265e33d | closed_area | Closed Areas Regulation, Schedule 9, section 3 (Naramata) |  | [brief](agent/run1/closed_area-480ce265e33d.md) | [brief](agent/run2/closed_area-480ce265e33d.md) |
| closed_area-48c464c0692c | closed_area | Closed Areas Regulation, Schedule 5, section 127 (Willow Heights Wildlife Reserve) |  | [brief](agent/run1/closed_area-48c464c0692c.md) | [brief](agent/run2/closed_area-48c464c0692c.md) |
| closed_area-496623fa03b6 | closed_area | Closed Areas Regulation, Schedule 9, section 26 (Stamp Lagoon) |  | [brief](agent/run1/closed_area-496623fa03b6.md) | [brief](agent/run2/closed_area-496623fa03b6.md) |
| closed_area-4a654364d8f2 | closed_area | Closed Areas Regulation, Schedule 5, section 53 (Hope) |  | [brief](agent/run1/closed_area-4a654364d8f2.md) | [brief](agent/run2/closed_area-4a654364d8f2.md) |
| closed_area-4a801b80a26e | closed_area | Closed Areas Regulation, Schedule 5.1, section 1 (Definition) |  | [brief](agent/run1/closed_area-4a801b80a26e.md) | [brief](agent/run2/closed_area-4a801b80a26e.md) |
| closed_area-4b9727d32439 | closed_area | Closed Areas Regulation, Schedule 3, section 15 (Walter Clough Wildlife Management Area) |  | [brief](agent/run1/closed_area-4b9727d32439.md) | [brief](agent/run2/closed_area-4b9727d32439.md) |
| closed_area-4f2652982661 | closed_area | Closed Areas Regulation, Schedule 1, section 8 (Reidemann) |  | [brief](agent/run1/closed_area-4f2652982661.md) | [brief](agent/run2/closed_area-4f2652982661.md) |
| closed_area-5009e9ffd0e5 | closed_area | Closed Areas Regulation, Schedule 5, section 17 (Ocean Falls) |  | [brief](agent/run1/closed_area-5009e9ffd0e5.md) | [brief](agent/run2/closed_area-5009e9ffd0e5.md) |
| closed_area-5041d362c8c5 | closed_area | Closed Areas Regulation, Schedule 1, section 7 (McGillivray Creek) |  | [brief](agent/run1/closed_area-5041d362c8c5.md) | [brief](agent/run2/closed_area-5041d362c8c5.md) |
| closed_area-51c6a56c1490 | closed_area | Closed Areas Regulation, Schedule 5, section 64 (Sechelt) |  | [brief](agent/run1/closed_area-51c6a56c1490.md) | [brief](agent/run2/closed_area-51c6a56c1490.md) |
| closed_area-51e1c4b66b5f | closed_area | Closed Areas Regulation, Schedule 5, section 35 (Mayo Lake) |  | [brief](agent/run1/closed_area-51e1c4b66b5f.md) | [brief](agent/run2/closed_area-51e1c4b66b5f.md) |
| closed_area-52b7c20ee624 | closed_area | Closed Areas Regulation, Schedule 5.1, section 11 (Francis Lake, Sts'ailes (West) and Weav |  | [brief](agent/run1/closed_area-52b7c20ee624.md) | [brief](agent/run2/closed_area-52b7c20ee624.md) |
| closed_area-5372487dcc64 | closed_area | Closed Areas Regulation, Schedule 7, section 27 (Provincial Parks) |  | [brief](agent/run1/closed_area-5372487dcc64.md) | [brief](agent/run2/closed_area-5372487dcc64.md) |
| closed_area-53a5b927508a | closed_area | Closed Areas Regulation, Schedule 5, section 57 (Greenhills Operations) |  | [brief](agent/run1/closed_area-53a5b927508a.md) | [brief](agent/run2/closed_area-53a5b927508a.md) |
| closed_area-543aa5388820 | closed_area | Closed Areas Regulation, Schedule 3, section 28 (North Kitsumkalum) |  | [brief](agent/run1/closed_area-543aa5388820.md) | [brief](agent/run2/closed_area-543aa5388820.md) |
| closed_area-54fb2ce0f1ac | closed_area | Closed Areas Regulation, Schedule 5, section 15 (Williams Lake) |  | [brief](agent/run1/closed_area-54fb2ce0f1ac.md) | [brief](agent/run2/closed_area-54fb2ce0f1ac.md) |
| closed_area-582ad093e4d6 | closed_area | Closed Areas Regulation, Schedule 5, section 116 (Fry Creek Recreation Area) |  | [brief](agent/run1/closed_area-582ad093e4d6.md) | [brief](agent/run2/closed_area-582ad093e4d6.md) |
| closed_area-590cdbe7c7c4 | closed_area | Closed Areas Regulation, Schedule 11, section 5 (Management Unit 1-1) |  | [brief](agent/run1/closed_area-590cdbe7c7c4.md) | [brief](agent/run2/closed_area-590cdbe7c7c4.md) |
| closed_area-5962314ecaf6 | closed_area | Closed Areas Regulation, Schedule 5, section 76 (Kaleden) |  | [brief](agent/run1/closed_area-5962314ecaf6.md) | [brief](agent/run2/closed_area-5962314ecaf6.md) |
| closed_area-5afc49511572 | closed_area | Closed Areas Regulation, Schedule 9, section 14 (Sechelt) |  | [brief](agent/run1/closed_area-5afc49511572.md) | [brief](agent/run2/closed_area-5afc49511572.md) |
| closed_area-5b6028a05c49 | closed_area | Closed Areas Regulation, Schedule 5, section 21 (Cowichan Bay) |  | [brief](agent/run1/closed_area-5b6028a05c49.md) | [brief](agent/run2/closed_area-5b6028a05c49.md) |
| closed_area-5c12d953847a | closed_area | Closed Areas Regulation, Schedule 3, section 49 (Kinuseo Falls) |  | [brief](agent/run1/closed_area-5c12d953847a.md) | [brief](agent/run2/closed_area-5c12d953847a.md) |
| closed_area-5e64f75a4166 | closed_area | Closed Areas Regulation, Schedule 5, section 16 (Provincial Gaol Camp No. 1) |  | [brief](agent/run1/closed_area-5e64f75a4166.md) | [brief](agent/run2/closed_area-5e64f75a4166.md) |
| closed_area-60b5690762fb | closed_area | Closed Areas Regulation, Schedule 5, section 77 (Coal Mountain Operations) |  | [brief](agent/run1/closed_area-60b5690762fb.md) | [brief](agent/run2/closed_area-60b5690762fb.md) |
| closed_area-60c1985e638c | closed_area | Closed Areas Regulation, Schedule 3, section 31 (Roderick Haig-Brown Recreation Area) |  | [brief](agent/run1/closed_area-60c1985e638c.md) | [brief](agent/run2/closed_area-60c1985e638c.md) |
| closed_area-60caff708fc7 | closed_area | Closed Areas Regulation, Schedule 7, section 40 (Norbury Lake Park) |  | [brief](agent/run1/closed_area-60caff708fc7.md) | [brief](agent/run2/closed_area-60caff708fc7.md) |
| closed_area-6127655a5f49 | closed_area | Closed Areas Regulation, Schedule 11, section 1 (Nicomen) |  | [brief](agent/run1/closed_area-6127655a5f49.md) | [brief](agent/run2/closed_area-6127655a5f49.md) |
| closed_area-61fb525e4277 | closed_area | Closed Areas Regulation, Schedule 1, section 14 (Ward Lake) |  | [brief](agent/run1/closed_area-61fb525e4277.md) | [brief](agent/run2/closed_area-61fb525e4277.md) |
| closed_area-627972e88135 | closed_area | Closed Areas Regulation, Schedule 7, section 34 (Golden Bear Access Road) |  | [brief](agent/run1/closed_area-627972e88135.md) | [brief](agent/run2/closed_area-627972e88135.md) |
| closed_area-640aecc71b61 | closed_area | Closed Areas Regulation, Schedule 5, section 84 (Upper Halfway) |  | [brief](agent/run1/closed_area-640aecc71b61.md) | [brief](agent/run2/closed_area-640aecc71b61.md) |
| closed_area-641094842b62 | closed_area | Closed Areas Regulation, Schedule 3, section 55 (Sun Peaks Resort) |  | [brief](agent/run1/closed_area-641094842b62.md) | [brief](agent/run2/closed_area-641094842b62.md) |
| closed_area-645422c3e1ed | closed_area | Closed Areas Regulation, Schedule 7, section 5 (Bowen Island) |  | [brief](agent/run1/closed_area-645422c3e1ed.md) | [brief](agent/run2/closed_area-645422c3e1ed.md) |
| closed_area-6777138b4e90 | closed_area | Closed Areas Regulation, Schedule 5, section 85 (Sylvester Road) |  | [brief](agent/run1/closed_area-6777138b4e90.md) | [brief](agent/run2/closed_area-6777138b4e90.md) |
| closed_area-682129cef8fe | closed_area | Closed Areas Regulation, Schedule 3, section 13 (Tabor Mountain) |  | [brief](agent/run1/closed_area-682129cef8fe.md) | [brief](agent/run2/closed_area-682129cef8fe.md) |
| closed_area-6ac372f80faa | closed_area | Closed Areas Regulation, Schedule 8, section 3 (Sunset Prairie) |  | [brief](agent/run1/closed_area-6ac372f80faa.md) | [brief](agent/run2/closed_area-6ac372f80faa.md) |
| closed_area-6c4ef7212408 | closed_area | Closed Areas Regulation, Schedule 3, section 56 (Radium) |  | [brief](agent/run1/closed_area-6c4ef7212408.md) | [brief](agent/run2/closed_area-6c4ef7212408.md) |
| closed_area-6c6af88f8c0f | closed_area | Closed Areas Regulation, Schedule 1, section 12 (Tunkwa Lake) |  | [brief](agent/run1/closed_area-6c6af88f8c0f.md) | [brief](agent/run2/closed_area-6c6af88f8c0f.md) |
| closed_area-6d13a853fe86 | closed_area | Closed Areas Regulation, Schedule 7, section 49 (Khutzeymateen Park) |  | [brief](agent/run1/closed_area-6d13a853fe86.md) | [brief](agent/run2/closed_area-6d13a853fe86.md) |
| closed_area-6d314ca89488 | closed_area | Closed Areas Regulation, Schedule 7, section 52 (Whistler Olympic Park) |  | [brief](agent/run1/closed_area-6d314ca89488.md) | [brief](agent/run2/closed_area-6d314ca89488.md) |
| closed_area-6d59175dc9b6 | closed_area | Closed Areas Regulation, Schedule 4, section 5 (Naikoon Park) |  | [brief](agent/run1/closed_area-6d59175dc9b6.md) | [brief](agent/run2/closed_area-6d59175dc9b6.md) |
| closed_area-6e88d0855982 | closed_area | Closed Areas Regulation, Schedule 3, section 23 (Mt. Bergeron — Tumbler Ridge) |  | [brief](agent/run1/closed_area-6e88d0855982.md) | [brief](agent/run2/closed_area-6e88d0855982.md) |
| closed_area-70664c906dd8 | closed_area | Closed Areas Regulation, Schedule 10, section 2 (Groundbirch) |  | [brief](agent/run1/closed_area-70664c906dd8.md) | [brief](agent/run2/closed_area-70664c906dd8.md) |
| closed_area-7101e28aeb15 | closed_area | Closed Areas Regulation, Schedule 5.1, section 12 (Chehalis Forest Service Road) |  | [brief](agent/run1/closed_area-7101e28aeb15.md) | [brief](agent/run2/closed_area-7101e28aeb15.md) |
| closed_area-712ace3e0b96 | closed_area | Closed Areas Regulation, Schedule 3, section 54 (Centennial Beach) |  | [brief](agent/run1/closed_area-712ace3e0b96.md) | [brief](agent/run2/closed_area-712ace3e0b96.md) |
| closed_area-7227cdd7b1d5 | closed_area | Closed Areas Regulation, Schedule 5, section 94 (Williams Lake River) |  | [brief](agent/run1/closed_area-7227cdd7b1d5.md) | [brief](agent/run2/closed_area-7227cdd7b1d5.md) |
| closed_area-722d3e8a0cb4 | closed_area | Closed Areas Regulation, Schedule 5, section 115 (Mount Judge Howay Park) |  | [brief](agent/run1/closed_area-722d3e8a0cb4.md) | [brief](agent/run2/closed_area-722d3e8a0cb4.md) |
| closed_area-73ecc2f0ea6c | closed_area | Closed Areas Regulation, Schedule 5, section 14 (Gibralter Mines) |  | [brief](agent/run1/closed_area-73ecc2f0ea6c.md) | [brief](agent/run2/closed_area-73ecc2f0ea6c.md) |
| closed_area-742ba7f0a802 | closed_area | Closed Areas Regulation, Schedule 5.1, section 3 (Liumchen East Forest Service Road etc.) |  | [brief](agent/run1/closed_area-742ba7f0a802.md) | [brief](agent/run2/closed_area-742ba7f0a802.md) |
| closed_area-78cdb74f80b0 | closed_area | Closed Areas Regulation, Schedule 5, section 63 (Nicomen) |  | [brief](agent/run1/closed_area-78cdb74f80b0.md) | [brief](agent/run2/closed_area-78cdb74f80b0.md) |
| closed_area-793dd0d43b00 | closed_area | Closed Areas Regulation, Schedule 7, section 46 (Lukwa Lake) |  | [brief](agent/run1/closed_area-793dd0d43b00.md) | [brief](agent/run2/closed_area-793dd0d43b00.md) |
| closed_area-7bb2b4b39cba | closed_area | Closed Areas Regulation, Schedule 5, section 41 (Line Creek Operations) |  | [brief](agent/run1/closed_area-7bb2b4b39cba.md) | [brief](agent/run2/closed_area-7bb2b4b39cba.md) |
| closed_area-7c28c3f7cb47 | closed_area | Closed Areas Regulation, Schedule 11, section 4 (Grand Forks) |  | [brief](agent/run1/closed_area-7c28c3f7cb47.md) | [brief](agent/run2/closed_area-7c28c3f7cb47.md) |
| closed_area-7c90e5e9b9ff | closed_area | Closed Areas Regulation, Schedule 9, section 15 (Skaha Lake) |  | [brief](agent/run1/closed_area-7c90e5e9b9ff.md) | [brief](agent/run2/closed_area-7c90e5e9b9ff.md) |
| closed_area-7de004ecd63d | closed_area | Closed Areas Regulation, Schedule 3, section 29 (Pacific Rim (Westcoast) National Park) |  | [brief](agent/run1/closed_area-7de004ecd63d.md) | [brief](agent/run2/closed_area-7de004ecd63d.md) |
| closed_area-7e3c4fc75330 | closed_area | Closed Areas Regulation, Schedule 3, section 53 (De Courcey Island) |  | [brief](agent/run1/closed_area-7e3c4fc75330.md) | [brief](agent/run2/closed_area-7e3c4fc75330.md) |
| closed_area-7fe0d774a8bc | closed_area | Closed Areas Regulation, Schedule 9, section 17 (Lakelse Lake) |  | [brief](agent/run1/closed_area-7fe0d774a8bc.md) | [brief](agent/run2/closed_area-7fe0d774a8bc.md) |
| closed_area-803fc49b87ef | closed_area | Closed Areas Regulation, Schedule 7, section 21 (Atlin Park) |  | [brief](agent/run1/closed_area-803fc49b87ef.md) | [brief](agent/run2/closed_area-803fc49b87ef.md) |
| closed_area-81716842855a | closed_area | Closed Areas Regulation, Schedule 9, section 9 (Nicomen) |  | [brief](agent/run1/closed_area-81716842855a.md) | [brief](agent/run2/closed_area-81716842855a.md) |
| closed_area-8197cb69eec9 | closed_area | Closed Areas Regulation, Schedule 5, section 61 (Evans Lake) |  | [brief](agent/run1/closed_area-8197cb69eec9.md) | [brief](agent/run2/closed_area-8197cb69eec9.md) |
| closed_area-81d1d79d88d5 | closed_area | Closed Areas Regulation, Schedule 7, section 55 (Lord River) |  | [brief](agent/run1/closed_area-81d1d79d88d5.md) | [brief](agent/run2/closed_area-81d1d79d88d5.md) |
| closed_area-83f3078f7e12 | closed_area | Closed Areas Regulation, Schedule 5, section 60 (Whistler) |  | [brief](agent/run1/closed_area-83f3078f7e12.md) | [brief](agent/run2/closed_area-83f3078f7e12.md) |
| closed_area-84557f653493 | closed_area | Closed Areas Regulation, Schedule 5, section 46 (Queen Charlotte City) |  | [brief](agent/run1/closed_area-84557f653493.md) | [brief](agent/run2/closed_area-84557f653493.md) |
| closed_area-875c830ae710 | closed_area | Closed Areas Regulation, Schedule 3, section 63 (Sea to Sky Highway) |  | [brief](agent/run1/closed_area-875c830ae710.md) | [brief](agent/run2/closed_area-875c830ae710.md) |
| closed_area-87f3b2ea98cd | closed_area | Closed Areas Regulation, Schedule 5.1, section 5 (Bench, Foley and Nesakwatch Forest Servi |  | [brief](agent/run1/closed_area-87f3b2ea98cd.md) | [brief](agent/run2/closed_area-87f3b2ea98cd.md) |
| closed_area-87fa28fa5749 | closed_area | Closed Areas Regulation, Schedule 9, section 19 (Naikoon Park) |  | [brief](agent/run1/closed_area-87fa28fa5749.md) | [brief](agent/run2/closed_area-87fa28fa5749.md) |
| closed_area-8911c2b7142e | closed_area | Closed Areas Regulation, Schedule 5, section 98 (Texada Junction) |  | [brief](agent/run1/closed_area-8911c2b7142e.md) | [brief](agent/run2/closed_area-8911c2b7142e.md) |
| closed_area-8b3b6ff8fff4 | closed_area | Closed Areas Regulation, Schedule 3, section 64 (Callaghan Road) |  | [brief](agent/run1/closed_area-8b3b6ff8fff4.md) | [brief](agent/run2/closed_area-8b3b6ff8fff4.md) |
| closed_area-8b76c61060a2 | closed_area | Closed Areas Regulation, Schedule 5, section 44 (Link Island) |  | [brief](agent/run1/closed_area-8b76c61060a2.md) | [brief](agent/run2/closed_area-8b76c61060a2.md) |
| closed_area-8f2c2f85631c | closed_area | Closed Areas Regulation, Schedule 5, section 34 (Rose Lake) |  | [brief](agent/run1/closed_area-8f2c2f85631c.md) | [brief](agent/run2/closed_area-8f2c2f85631c.md) |
| closed_area-922330221646 | closed_area | Closed Areas Regulation, Schedule 5, section 103 (Sea Island) |  | [brief](agent/run1/closed_area-922330221646.md) | [brief](agent/run2/closed_area-922330221646.md) |
| closed_area-924a465f9344 | closed_area | Closed Areas Regulation, Schedule 3, section 67 (Shaman Island) |  | [brief](agent/run1/closed_area-924a465f9344.md) | [brief](agent/run2/closed_area-924a465f9344.md) |
| closed_area-929a35580138 | closed_area | Closed Areas Regulation, Schedule 5, section 89 (Grantham Road) |  | [brief](agent/run1/closed_area-929a35580138.md) | [brief](agent/run2/closed_area-929a35580138.md) |
| closed_area-93f68aa3b8e8 | closed_area | Closed Areas Regulation, Schedule 9, section 29 (Nanaimo to Ladysmith) |  | [brief](agent/run1/closed_area-93f68aa3b8e8.md) | [brief](agent/run2/closed_area-93f68aa3b8e8.md) |
| closed_area-940cf05ceb0a | closed_area | Closed Areas Regulation, Schedule 13, section 1 (Delta/Surrey Dykes) |  | [brief](agent/run1/closed_area-940cf05ceb0a.md) | [brief](agent/run2/closed_area-940cf05ceb0a.md) |
| closed_area-96179964fba7 | closed_area | Closed Areas Regulation, Schedule 5.1, section 10 (Norrish Creek watershed) |  | [brief](agent/run1/closed_area-96179964fba7.md) | [brief](agent/run2/closed_area-96179964fba7.md) |
| closed_area-9670c4697d09 | closed_area | Closed Areas Regulation, Schedule 5, section 129 (Dokie) |  | [brief](agent/run1/closed_area-9670c4697d09.md) | [brief](agent/run2/closed_area-9670c4697d09.md) |
| closed_area-972747f11374 | closed_area | Closed Areas Regulation, Schedule 7, section 45 (Woodhus Slough) |  | [brief](agent/run1/closed_area-972747f11374.md) | [brief](agent/run2/closed_area-972747f11374.md) |
| closed_area-98eddadc6136 | closed_area | Closed Areas Regulation, Schedule 5, section 135 (Cowichan River Park) |  | [brief](agent/run1/closed_area-98eddadc6136.md) | [brief](agent/run2/closed_area-98eddadc6136.md) |
| closed_area-9b59f9b918fa | closed_area | Closed Areas Regulation, Schedule 7, section 13 (Mount Assiniboine Park) |  | [brief](agent/run1/closed_area-9b59f9b918fa.md) | [brief](agent/run2/closed_area-9b59f9b918fa.md) |
| closed_area-9b7d9de9b9cb | closed_area | Closed Areas Regulation, Schedule 3, section 46 (Trophy Mountain) |  | [brief](agent/run1/closed_area-9b7d9de9b9cb.md) | [brief](agent/run2/closed_area-9b7d9de9b9cb.md) |
| closed_area-9d45c703bc77 | closed_area | Closed Areas Regulation, Schedule 3, section 50 (Ucluelet) |  | [brief](agent/run1/closed_area-9d45c703bc77.md) | [brief](agent/run2/closed_area-9d45c703bc77.md) |
| closed_area-9f0b435a4d9d | closed_area | Closed Areas Regulation, Schedule 5, section 59 (Shoemaker Bay) |  | [brief](agent/run1/closed_area-9f0b435a4d9d.md) | [brief](agent/run2/closed_area-9f0b435a4d9d.md) |
| closed_area-9f252596b5ec | closed_area | Closed Areas Regulation, Schedule 5, section 6 (Skookumchuck Pulp Mill) |  | [brief](agent/run1/closed_area-9f252596b5ec.md) | [brief](agent/run2/closed_area-9f252596b5ec.md) |
| closed_area-9fa85d240017 | closed_area | Closed Areas Regulation, Schedule 5, section 96 (Miworth) |  | [brief](agent/run1/closed_area-9fa85d240017.md) | [brief](agent/run2/closed_area-9fa85d240017.md) |
| closed_area-9fc7d119bd43 | closed_area | Closed Areas Regulation, Schedule 5, section 73 (Michael Lake) |  | [brief](agent/run1/closed_area-9fc7d119bd43.md) | [brief](agent/run2/closed_area-9fc7d119bd43.md) |
| closed_area-a0c98f6887a9 | closed_area | Closed Areas Regulation, Schedule 5, section 140 (Lafarge to Pritchard) |  | [brief](agent/run1/closed_area-a0c98f6887a9.md) | [brief](agent/run2/closed_area-a0c98f6887a9.md) |
| closed_area-a0cbf4ca619a | closed_area | Closed Areas Regulation, Schedule 5, section 105 (Dawson Creek Environmental Demonstration |  | [brief](agent/run1/closed_area-a0cbf4ca619a.md) | [brief](agent/run2/closed_area-a0cbf4ca619a.md) |
| closed_area-a2a8642b00f9 | closed_area | Closed Areas Regulation, Schedule 7, section 15 (Tweedsmuir Park) |  | [brief](agent/run1/closed_area-a2a8642b00f9.md) | [brief](agent/run2/closed_area-a2a8642b00f9.md) |
| closed_area-a4cf1eb992cb | closed_area | Closed Areas Regulation, Schedule 5.1, section 14 (Chehalis Fleetwood) |  | [brief](agent/run1/closed_area-a4cf1eb992cb.md) | [brief](agent/run2/closed_area-a4cf1eb992cb.md) |
| closed_area-a837b1f42b11 | closed_area | Closed Areas Regulation, Schedule 3, section 38 (Okanagan Connector Highway) |  | [brief](agent/run1/closed_area-a837b1f42b11.md) | [brief](agent/run2/closed_area-a837b1f42b11.md) |
| closed_area-a85a7462494a | closed_area | Closed Areas Regulation, Schedule 5, section 136 (Crawford Bay) |  | [brief](agent/run1/closed_area-a85a7462494a.md) | [brief](agent/run2/closed_area-a85a7462494a.md) |
| closed_area-a8b183cad90c | closed_area | Closed Areas Regulation, Schedule 5.1, section 9 (Hatzic) |  | [brief](agent/run1/closed_area-a8b183cad90c.md) | [brief](agent/run2/closed_area-a8b183cad90c.md) |
| closed_area-aa3ec933e110 | closed_area | Closed Areas Regulation, Schedule 1, section 15 (Elizabeth Lake) |  | [brief](agent/run1/closed_area-aa3ec933e110.md) | [brief](agent/run2/closed_area-aa3ec933e110.md) |
| closed_area-aae222e7e928 | closed_area | Closed Areas Regulation, Schedule 6, section 3 (Cultus Lake) |  | [brief](agent/run1/closed_area-aae222e7e928.md) | [brief](agent/run2/closed_area-aae222e7e928.md) |
| closed_area-ac440232377e | closed_area | Closed Areas Regulation, Schedule 9, section 30 (Ladysmith to Malahat) |  | [brief](agent/run1/closed_area-ac440232377e.md) | [brief](agent/run2/closed_area-ac440232377e.md) |
| closed_area-acd77c4532e4 | closed_area | Closed Areas Regulation, Schedule 9, section 11 (Sechelt) |  | [brief](agent/run1/closed_area-acd77c4532e4.md) | [brief](agent/run2/closed_area-acd77c4532e4.md) |
| closed_area-ad2fd0ae08a4 | closed_area | Closed Areas Regulation, Schedule 5, section 133 (Buckley Bay) |  | [brief](agent/run1/closed_area-ad2fd0ae08a4.md) | [brief](agent/run2/closed_area-ad2fd0ae08a4.md) |
| closed_area-afbefd3a9a25 | closed_area | Closed Areas Regulation, Schedule 3, section 30 (Garibaldi Park) |  | [brief](agent/run1/closed_area-afbefd3a9a25.md) | [brief](agent/run2/closed_area-afbefd3a9a25.md) |
| closed_area-b08384fd9d55 | closed_area | Closed Areas Regulation, Schedule 5.1, section 8 (Lost Creek Forest Service Road etc.) |  | [brief](agent/run1/closed_area-b08384fd9d55.md) | [brief](agent/run2/closed_area-b08384fd9d55.md) |
| closed_area-b08a6fcea994 | closed_area | Closed Areas Regulation, Schedule 9, section 23 (Savary Island) |  | [brief](agent/run1/closed_area-b08a6fcea994.md) | [brief](agent/run2/closed_area-b08a6fcea994.md) |
| closed_area-b0a08c674fb6 | closed_area | Closed Areas Regulation, Schedule 5, section 128 (Upper Carmi Road) |  | [brief](agent/run1/closed_area-b0a08c674fb6.md) | [brief](agent/run2/closed_area-b0a08c674fb6.md) |
| closed_area-b1deaa6310a3 | closed_area | Closed Areas Regulation, Schedule 5, section 134 (Nanoose Bay) |  | [brief](agent/run1/closed_area-b1deaa6310a3.md) | [brief](agent/run2/closed_area-b1deaa6310a3.md) |
| closed_area-b36506a255f5 | closed_area | Closed Areas Regulation, Schedule 3, section 22 (Pitt Wildlife Management Area) |  | [brief](agent/run1/closed_area-b36506a255f5.md) | [brief](agent/run2/closed_area-b36506a255f5.md) |
| closed_area-b387904933a0 | closed_area | Closed Areas Regulation, Schedule 5, section 81 (Fording Mountain) |  | [brief](agent/run1/closed_area-b387904933a0.md) | [brief](agent/run2/closed_area-b387904933a0.md) |
| closed_area-b3af4ac11386 | closed_area | Closed Areas Regulation, Schedule 6, section 4 (Garibaldi Park) |  | [brief](agent/run1/closed_area-b3af4ac11386.md) | [brief](agent/run2/closed_area-b3af4ac11386.md) |
| closed_area-b40eb8094861 | closed_area | Closed Areas Regulation, Schedule 3, section 26 (Nekite River) |  | [brief](agent/run1/closed_area-b40eb8094861.md) | [brief](agent/run2/closed_area-b40eb8094861.md) |
| closed_area-b43261f95a1a | closed_area | Closed Areas Regulation, Schedule 7, section 38 (Sunshine Meadows) |  | [brief](agent/run1/closed_area-b43261f95a1a.md) | [brief](agent/run2/closed_area-b43261f95a1a.md) |
| closed_area-b573c3ea39cd | closed_area | Closed Areas Regulation, Schedule 5, section 120 (Tow Hill) |  | [brief](agent/run1/closed_area-b573c3ea39cd.md) | [brief](agent/run2/closed_area-b573c3ea39cd.md) |
| closed_area-b5afb440abe0 | closed_area | Closed Areas Regulation, Schedule 5, section 91 (Waugh Lake — Skookumchuck) |  | [brief](agent/run1/closed_area-b5afb440abe0.md) | [brief](agent/run2/closed_area-b5afb440abe0.md) |
| closed_area-b689a1205feb | closed_area | Closed Areas Regulation, Schedule 3, section 6 (Swan Lake) |  | [brief](agent/run1/closed_area-b689a1205feb.md) | [brief](agent/run2/closed_area-b689a1205feb.md) |
| closed_area-b6dad8f5fdc9 | closed_area | Closed Areas Regulation, Schedule 9, section 22 (Highways) |  | [brief](agent/run1/closed_area-b6dad8f5fdc9.md) | [brief](agent/run2/closed_area-b6dad8f5fdc9.md) |
| closed_area-b734f9a7c42b | closed_area | Closed Areas Regulation, Schedule 5, section 67 (Blubber Bay) |  | [brief](agent/run1/closed_area-b734f9a7c42b.md) | [brief](agent/run2/closed_area-b734f9a7c42b.md) |
| closed_area-b76454a96fa3 | closed_area | Closed Areas Regulation, Schedule 3, section 60 (East Moberly Lake 169) |  | [brief](agent/run1/closed_area-b76454a96fa3.md) | [brief](agent/run2/closed_area-b76454a96fa3.md) |
| closed_area-ba0d1970b2f0 | closed_area | Closed Areas Regulation, Schedule 5, section 68 (Lund) |  | [brief](agent/run1/closed_area-ba0d1970b2f0.md) | [brief](agent/run2/closed_area-ba0d1970b2f0.md) |
| closed_area-bb03a902f9e7 | closed_area | Closed Areas Regulation, Schedule 1, section 2 (Columbia Lake and River) |  | [brief](agent/run1/closed_area-bb03a902f9e7.md) | [brief](agent/run2/closed_area-bb03a902f9e7.md) |
| closed_area-bb2003a9e247 | closed_area | Closed Areas Regulation, Schedule 1, section 17 (Gwaii Haanas National Park Reserve) |  | [brief](agent/run1/closed_area-bb2003a9e247.md) | [brief](agent/run2/closed_area-bb2003a9e247.md) |
| closed_area-bbf55687984c | closed_area | Closed Areas Regulation, Schedule 5, section 66 (Saltery Bay) |  | [brief](agent/run1/closed_area-bbf55687984c.md) | [brief](agent/run2/closed_area-bbf55687984c.md) |
| closed_area-bc6812e4d86d | closed_area | Closed Areas Regulation, Schedule 5, section 18 (Kumdis Bay) |  | [brief](agent/run1/closed_area-bc6812e4d86d.md) | [brief](agent/run2/closed_area-bc6812e4d86d.md) |
| closed_area-bdf422a1e0ef | closed_area | Closed Areas Regulation, Schedule 5.1, section 4 (McGuire and Tamihi Creek Forest Service  |  | [brief](agent/run1/closed_area-bdf422a1e0ef.md) | [brief](agent/run2/closed_area-bdf422a1e0ef.md) |
| closed_area-be412adb6737 | closed_area | Closed Areas Regulation, Schedule 1, section 6 (McDougall) |  | [brief](agent/run1/closed_area-be412adb6737.md) | [brief](agent/run2/closed_area-be412adb6737.md) |
| closed_area-c0e4691a394f | closed_area | Closed Areas Regulation, Schedule 7, section 33 (Tweedsmuir Park) |  | [brief](agent/run1/closed_area-c0e4691a394f.md) | [brief](agent/run2/closed_area-c0e4691a394f.md) |
| closed_area-c10be1199abe | closed_area | Closed Areas Regulation, Schedule 3, section 62 (Coal Mountain Operations) |  | [brief](agent/run1/closed_area-c10be1199abe.md) | [brief](agent/run2/closed_area-c10be1199abe.md) |
| closed_area-c199f54bf6b9 | closed_area | Closed Areas Regulation, Schedule 5, section 31 (Blind Bay) |  | [brief](agent/run1/closed_area-c199f54bf6b9.md) | [brief](agent/run2/closed_area-c199f54bf6b9.md) |
| closed_area-c2600b0c366d | closed_area | Closed Areas Regulation, Schedule 5.1, section 2 (Silver Skagit Forest Service Road) |  | [brief](agent/run1/closed_area-c2600b0c366d.md) | [brief](agent/run2/closed_area-c2600b0c366d.md) |
| closed_area-c3365bebc244 | closed_area | Closed Areas Regulation, Schedule 3, section 9 (Highway 3) |  | [brief](agent/run1/closed_area-c3365bebc244.md) | [brief](agent/run2/closed_area-c3365bebc244.md) |
| closed_area-c33ab027aa7f | closed_area | Closed Areas Regulation, Schedule 5, section 5 (Buntzen Lake) |  | [brief](agent/run1/closed_area-c33ab027aa7f.md) | [brief](agent/run2/closed_area-c33ab027aa7f.md) |
| closed_area-c52bdedb91b5 | closed_area | Closed Areas Regulation, Schedule 5.1, section 7 (Florence Lake Forest Service Road) |  | [brief](agent/run1/closed_area-c52bdedb91b5.md) | [brief](agent/run2/closed_area-c52bdedb91b5.md) |
| closed_area-c55939ae3cf2 | closed_area | Closed Areas Regulation, Schedule 5, section 123 (Selkirk) |  | [brief](agent/run1/closed_area-c55939ae3cf2.md) | [brief](agent/run2/closed_area-c55939ae3cf2.md) |
| closed_area-c5b6f96f777e | closed_area | Closed Areas Regulation, Schedule 5, section 99 (Village of 100 Mile House) |  | [brief](agent/run1/closed_area-c5b6f96f777e.md) | [brief](agent/run2/closed_area-c5b6f96f777e.md) |
| closed_area-c650801a1d87 | closed_area | Closed Areas Regulation, Schedule 3, section 52 (JeweI Lake) |  | [brief](agent/run1/closed_area-c650801a1d87.md) | [brief](agent/run2/closed_area-c650801a1d87.md) |
| closed_area-c6ab7f060297 | closed_area | Closed Areas Regulation, Schedule 6, section 7 (Cowichan Bay) |  | [brief](agent/run1/closed_area-c6ab7f060297.md) | [brief](agent/run2/closed_area-c6ab7f060297.md) |
| closed_area-c7909362ffcf | closed_area | Closed Areas Regulation, Schedule 5, section 8 (Todagin Mountain) |  | [brief](agent/run1/closed_area-c7909362ffcf.md) | [brief](agent/run2/closed_area-c7909362ffcf.md) |
| closed_area-c9afd1801ed4 | closed_area | Closed Areas Regulation, Schedule 5, section 88 (City of Terrace) |  | [brief](agent/run1/closed_area-c9afd1801ed4.md) | [brief](agent/run2/closed_area-c9afd1801ed4.md) |
| closed_area-c9bca3f9152c | closed_area | Closed Areas Regulation, Schedule 5, section 74 (Burrard Inlet) |  | [brief](agent/run1/closed_area-c9bca3f9152c.md) | [brief](agent/run2/closed_area-c9bca3f9152c.md) |
| closed_area-caf4fa112b37 | closed_area | Closed Areas Regulation, Schedule 5, section 92 (Hemlock Valley) |  | [brief](agent/run1/closed_area-caf4fa112b37.md) | [brief](agent/run2/closed_area-caf4fa112b37.md) |
| closed_area-cb146daf0d87 | closed_area | Closed Areas Regulation, Schedule 5, section 9 (Logan Lake) |  | [brief](agent/run1/closed_area-cb146daf0d87.md) | [brief](agent/run2/closed_area-cb146daf0d87.md) |
| closed_area-cc03fd81f55a | closed_area | Closed Areas Regulation, Schedule 3, section 43 (Road 248) |  | [brief](agent/run1/closed_area-cc03fd81f55a.md) | [brief](agent/run2/closed_area-cc03fd81f55a.md) |
| closed_area-cc3875e7afd5 | closed_area | Closed Areas Regulation, Schedule 3, section 36 (Conkle Lake Park) |  | [brief](agent/run1/closed_area-cc3875e7afd5.md) | [brief](agent/run2/closed_area-cc3875e7afd5.md) |
| closed_area-cc7b6fac8034 | closed_area | Closed Areas Regulation, Schedule 5, section 4 (McQueen, Griffin and Isobel Lakes) |  | [brief](agent/run1/closed_area-cc7b6fac8034.md) | [brief](agent/run2/closed_area-cc7b6fac8034.md) |
| closed_area-ccd09dd05a2e | closed_area | Closed Areas Regulation, Schedule 1, section 13 (Wasa Slough) |  | [brief](agent/run1/closed_area-ccd09dd05a2e.md) | [brief](agent/run2/closed_area-ccd09dd05a2e.md) |
| closed_area-cd144b7732d9 | closed_area | Closed Areas Regulation, Schedule 9, section 27 (Campbell River to Nanaimo) |  | [brief](agent/run1/closed_area-cd144b7732d9.md) | [brief](agent/run2/closed_area-cd144b7732d9.md) |
| closed_area-cdbe692ac085 | closed_area | Closed Areas Regulation, Schedule 3, section 12 (Addington Marsh) |  | [brief](agent/run1/closed_area-cdbe692ac085.md) | [brief](agent/run2/closed_area-cdbe692ac085.md) |
| closed_area-ce315984d6c4 | closed_area | Closed Areas Regulation, Schedule 5, section 78 (Highland Valley) |  | [brief](agent/run1/closed_area-ce315984d6c4.md) | [brief](agent/run2/closed_area-ce315984d6c4.md) |
| closed_area-ce38456662f3 | closed_area | Closed Areas Regulation, Schedule 3, section 2 (Tranquille Wildlife Management Area) |  | [brief](agent/run1/closed_area-ce38456662f3.md) | [brief](agent/run2/closed_area-ce38456662f3.md) |
| closed_area-cf077be575c9 | closed_area | Closed Areas Regulation, Schedule 3, section 19 (The Province) |  | [brief](agent/run1/closed_area-cf077be575c9.md) | [brief](agent/run2/closed_area-cf077be575c9.md) |
| closed_area-d07c6335443c | closed_area | Closed Areas Regulation, Schedule 7, section 42 (Eskers Park) |  | [brief](agent/run1/closed_area-d07c6335443c.md) | [brief](agent/run2/closed_area-d07c6335443c.md) |
| closed_area-d08f342f86e2 | closed_area | Closed Areas Regulation, Schedule 7, section 56 (Chilko — Newton) |  | [brief](agent/run1/closed_area-d08f342f86e2.md) | [brief](agent/run2/closed_area-d08f342f86e2.md) |
| closed_area-d1a919bcf3b4 | closed_area | Closed Areas Regulation, Schedule 5, section 139 (Hudson Bay Mountain/Smithers Community F |  | [brief](agent/run1/closed_area-d1a919bcf3b4.md) | [brief](agent/run2/closed_area-d1a919bcf3b4.md) |
| closed_area-d22d12dfbac7 | closed_area | Closed Areas Regulation, Schedule 1, section 5 (Lucy Island) |  | [brief](agent/run1/closed_area-d22d12dfbac7.md) | [brief](agent/run2/closed_area-d22d12dfbac7.md) |
| closed_area-d2ba50267fc5 | closed_area | Closed Areas Regulation, Schedule 5, section 65 (Gillies Bay) |  | [brief](agent/run1/closed_area-d2ba50267fc5.md) | [brief](agent/run2/closed_area-d2ba50267fc5.md) |
| closed_area-d31eb1640730 | closed_area | Closed Areas Regulation, Schedule 5, section 126 (Houston Community Forest) |  | [brief](agent/run1/closed_area-d31eb1640730.md) | [brief](agent/run2/closed_area-d31eb1640730.md) |
| closed_area-d4115c46e536 | closed_area | Closed Areas Regulation, Schedule 5, section 119 (Lion's Bay) |  | [brief](agent/run1/closed_area-d4115c46e536.md) | [brief](agent/run2/closed_area-d4115c46e536.md) |
| closed_area-d583d82de69a | closed_area | Closed Areas Regulation, Schedule 5, section 23 (Nanaimo) |  | [brief](agent/run1/closed_area-d583d82de69a.md) | [brief](agent/run2/closed_area-d583d82de69a.md) |
| closed_area-d6598280f56b | closed_area | Closed Areas Regulation, Schedule 3, section 42 (Cathedral Park) |  | [brief](agent/run1/closed_area-d6598280f56b.md) | [brief](agent/run2/closed_area-d6598280f56b.md) |
| closed_area-d884f78f044d | closed_area | Closed Areas Regulation, Schedule 9, section 25 (Port Clements) |  | [brief](agent/run1/closed_area-d884f78f044d.md) | [brief](agent/run2/closed_area-d884f78f044d.md) |
| closed_area-d9c45470876b | closed_area | Closed Areas Regulation, Schedule 5, section 87 (Mascot Gold Mines Limited) |  | [brief](agent/run1/closed_area-d9c45470876b.md) | [brief](agent/run2/closed_area-d9c45470876b.md) |
| closed_area-d9de42ac005c | closed_area | Closed Areas Regulation, Schedule 5, section 137 (White-Moscow Forest Service Road) |  | [brief](agent/run1/closed_area-d9de42ac005c.md) | [brief](agent/run2/closed_area-d9de42ac005c.md) |
| closed_area-da396085511d | closed_area | Closed Areas Regulation, Schedule 5, section 104 (Tatlow Road) |  | [brief](agent/run1/closed_area-da396085511d.md) | [brief](agent/run2/closed_area-da396085511d.md) |
| closed_area-dae1192114e4 | closed_area | Closed Areas Regulation, Schedule 8, section 1 (Cecil Lake) |  | [brief](agent/run1/closed_area-dae1192114e4.md) | [brief](agent/run2/closed_area-dae1192114e4.md) |
| closed_area-deab91d218ff | closed_area | Closed Areas Regulation, Schedule 5, section 118 (Central Road) |  | [brief](agent/run1/closed_area-deab91d218ff.md) | [brief](agent/run2/closed_area-deab91d218ff.md) |
| closed_area-deda442dcc3f | closed_area | Closed Areas Regulation, Schedule 9, section 20 (Canal Flats) |  | [brief](agent/run1/closed_area-deda442dcc3f.md) | [brief](agent/run2/closed_area-deda442dcc3f.md) |
| closed_area-df60c7ca1269 | closed_area | Closed Areas Regulation, Schedule 5, section 121 (Brenda Mines) |  | [brief](agent/run1/closed_area-df60c7ca1269.md) | [brief](agent/run2/closed_area-df60c7ca1269.md) |
| closed_area-dfd8de0457c3 | closed_area | Closed Areas Regulation, Schedule 3, section 17 (North Thormanby Island) |  | [brief](agent/run1/closed_area-dfd8de0457c3.md) | [brief](agent/run2/closed_area-dfd8de0457c3.md) |
| closed_area-e17e750d7522 | closed_area | Closed Areas Regulation, Schedule 11, section 3 (Keats Island) |  | [brief](agent/run1/closed_area-e17e750d7522.md) | [brief](agent/run2/closed_area-e17e750d7522.md) |
| closed_area-e3dffa585f62 | closed_area | Closed Areas Regulation, Schedule 5, section 33 (Elbow Lake) |  | [brief](agent/run1/closed_area-e3dffa585f62.md) | [brief](agent/run2/closed_area-e3dffa585f62.md) |
| closed_area-e3ebdc2bc251 | closed_area | Closed Areas Regulation, Schedule 5, section 138 (Whiteswan Forest Service Road) |  | [brief](agent/run1/closed_area-e3ebdc2bc251.md) | [brief](agent/run2/closed_area-e3ebdc2bc251.md) |
| closed_area-e4ac8f7c0b20 | closed_area | Closed Areas Regulation, Schedule 9, section 12 (Powell River) |  | [brief](agent/run1/closed_area-e4ac8f7c0b20.md) | [brief](agent/run2/closed_area-e4ac8f7c0b20.md) |
| closed_area-e4d7759229ff | closed_area | Closed Areas Regulation, Schedule 5, section 38 (Wells) |  | [brief](agent/run1/closed_area-e4d7759229ff.md) | [brief](agent/run2/closed_area-e4d7759229ff.md) |
| closed_area-e9f649f8a86b | closed_area | Closed Areas Regulation, Schedule 5, section 2 (University of British Columbia Endowment L |  | [brief](agent/run1/closed_area-e9f649f8a86b.md) | [brief](agent/run2/closed_area-e9f649f8a86b.md) |
| closed_area-eb758c8bf01b | closed_area | Closed Areas Regulation, Schedule 7, section 50 (Spatsizi Plateau Wilderness Park) |  | [brief](agent/run1/closed_area-eb758c8bf01b.md) | [brief](agent/run2/closed_area-eb758c8bf01b.md) |
| closed_area-ecc0e900b4c4 | closed_area | Closed Areas Regulation, Schedule 8, section 4 (Bear Mountain) |  | [brief](agent/run1/closed_area-ecc0e900b4c4.md) | [brief](agent/run2/closed_area-ecc0e900b4c4.md) |
| closed_area-f0914f8382cd | closed_area | Closed Areas Regulation, Schedule 5, section 111 (Fairmont) |  | [brief](agent/run1/closed_area-f0914f8382cd.md) | [brief](agent/run2/closed_area-f0914f8382cd.md) |
| closed_area-f2c50e7e3ad6 | closed_area | Closed Areas Regulation, Schedule 3, section 59 (Fording River/Greenhills Operations) |  | [brief](agent/run1/closed_area-f2c50e7e3ad6.md) | [brief](agent/run2/closed_area-f2c50e7e3ad6.md) |
| closed_area-f358473b99fa | closed_area | Closed Areas Regulation, Schedule 5, section 69 (Vananda) |  | [brief](agent/run1/closed_area-f358473b99fa.md) | [brief](agent/run2/closed_area-f358473b99fa.md) |
| closed_area-f4174a580f47 | closed_area | Closed Areas Regulation, Schedule 7, section 36 (Kakwa Recreation Area) |  | [brief](agent/run1/closed_area-f4174a580f47.md) | [brief](agent/run2/closed_area-f4174a580f47.md) |
| closed_area-f4d1342fedfb | closed_area | Closed Areas Regulation, Schedule 5, section 19 (Kathlyn Lake) |  | [brief](agent/run1/closed_area-f4d1342fedfb.md) | [brief](agent/run2/closed_area-f4d1342fedfb.md) |
| closed_area-f5772e0db982 | closed_area | Closed Areas Regulation, Schedule 5, section 86 (York Lake) |  | [brief](agent/run1/closed_area-f5772e0db982.md) | [brief](agent/run2/closed_area-f5772e0db982.md) |
| closed_area-f7176ff14d14 | closed_area | Closed Areas Regulation, Schedule 3, section 48 (Radar Lake) |  | [brief](agent/run1/closed_area-f7176ff14d14.md) | [brief](agent/run2/closed_area-f7176ff14d14.md) |
| closed_area-fa8a2bf44d0e | closed_area | Closed Areas Regulation, Schedule 3, section 37 (Line Creek Operations) |  | [brief](agent/run1/closed_area-fa8a2bf44d0e.md) | [brief](agent/run2/closed_area-fa8a2bf44d0e.md) |
| closed_area-fbc4c10d0635 | closed_area | Closed Areas Regulation, Schedule 7, section 48 (Beaver Lodge Trust Lands) |  | [brief](agent/run1/closed_area-fbc4c10d0635.md) | [brief](agent/run2/closed_area-fbc4c10d0635.md) |
| closed_area-fcf3aa1a90a9 | closed_area | Closed Areas Regulation, Schedule 3, section 47 (Saturna Island East End) |  | [brief](agent/run1/closed_area-fcf3aa1a90a9.md) | [brief](agent/run2/closed_area-fcf3aa1a90a9.md) |
| closed_area-fdc8f5f73006 | closed_area | Closed Areas Regulation, Schedule 5, section 29 (Paaren's Beach) |  | [brief](agent/run1/closed_area-fdc8f5f73006.md) | [brief](agent/run2/closed_area-fdc8f5f73006.md) |
| closed_area-fdf49db5ccbb | closed_area | Closed Areas Regulation, Schedule 8.1, section 1 (Burns Bog) |  | [brief](agent/run1/closed_area-fdf49db5ccbb.md) | [brief](agent/run2/closed_area-fdf49db5ccbb.md) |
| closed_area-fe32d4221af5 | closed_area | Closed Areas Regulation, Schedule 3, section 65 (Kalamalka Lake Park) |  | [brief](agent/run1/closed_area-fe32d4221af5.md) | [brief](agent/run2/closed_area-fe32d4221af5.md) |
| dm_notice-01673fb09107 | dm_notice | District Manager notice DSI-c2357ace-map-banon_fsr_gate_location | 1 | done | done |
| dm_notice-045a8cf5e8b4 | dm_notice | District Manager notice DSE-2cb2b189-incomappleux_br2deact | 1 | done | done |
| dm_notice-1161790b30f2 | dm_notice | District Manager notice DSI-dc65a045-lucky_fsr_road_closure | 1 | done | done |
| dm_notice-12dd6c6259d5 | dm_notice | District Manager notice DCK-691e2b1a-hunter_fsr_variance_to_closure |  | done | done |
| dm_notice-13cca27c2143 | dm_notice | District Manager notice DSI-66e61e93-gate_location_map_braden_mainline_and_tr11 | 1 | done | done |
| dm_notice-13ecbdfe694d | dm_notice | District Manager notice DCK-d8b34b6d-807402_03_04_05_06_fs_301_-_fsr_discontinue_and_close | 2 | done | done |
| dm_notice-15db79882120 | dm_notice | District Manager notice DVA-3faae646-dsn_road_restictions_2026_spring_road_bans_bulletin_3 |  | done | done |
| dm_notice-21679d9bdf82 | dm_notice | District Manager notice DSI-5f111aca-kmu_gate_location_overview_map | 1 | done | done |
| dm_notice-2951e5be5db2 | dm_notice | District Manager notice DCK-cdff3673-bench_fsr_road_closure |  | done | done |
| dm_notice-2cce44563814 | dm_notice | District Manager notice DCK-94372f1a-mowhokam_east_fsr_closure |  | done | done |
| dm_notice-2f64f403c8ef | dm_notice | District Manager notice DCK-15d8fff4-east_anderson_fsr_road_closure_april_24_2026 |  | done | done |
| dm_notice-3037d33c379d | dm_notice | District Manager notice DCR-9ef086bc-dcr_sdfmap | 1 | done | done |
| dm_notice-3219bf9cc703 | dm_notice | District Manager notice DCK-4d024dd5-american_fsr_road_closure_february_9_2026 | 1 | done | done |
| dm_notice-35ed0dd49183 | dm_notice | District Manager notice DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_ | 1 | done | done |
| dm_notice-3e2decbff3de | dm_notice | District Manager notice DSC-335a98d1-a94817_bk_forest_service_road | 1 | done | done |
| dm_notice-48a0eb265107 | dm_notice | District Manager notice DSI-7d1cff67-canal_main_closure | 1 | done | done |
| dm_notice-4b6e47cfa5c0 | dm_notice | District Manager notice DSI-a9fec493-walbran700_gate_location_map_2026mar9 | 1 | done | done |
| dm_notice-4e12e8af94df | dm_notice | District Manager notice DCK-0c70d269-bucklin_fsr_-_2019_road_closure | 1 | done | done |
| dm_notice-4eab5bce811c | dm_notice | District Manager notice DSE-68d293da-faq_document_for_incomappleux_deactivation | 1 | done | done |
| dm_notice-4ff4d386a7d7 | dm_notice | District Manager notice DQC-6a1cfbef-2024_06_07_bill_brown_closure | 1 | done | done |
| dm_notice-5d45dcf5b959 | dm_notice | District Manager notice DVA-792bd4d5-project_flyer_driftwood_rebuild | 1 | done | done |
| dm_notice-6185e31c0ce7 | dm_notice | District Manager notice DCK-9a9e782c-notice_of_clousre_harrison_east_fsr_-_rescinded |  | done | done |
| dm_notice-64350f0b5ea2 | dm_notice | District Manager notice DCK-79c52629-fs301_december_13_2024 | 5 | done | done |
| dm_notice-6646e880bf3d | dm_notice | District Manager notice DCS-01301b15-bridge_inspections_2015_hillshade_south_cascades_all_ | 1 | done | done |
| dm_notice-6cd3c19b01b0 | dm_notice | District Manager notice DCK-a36f6f84-fsr_road_closure_notice_december_storm_damage | 1 | done | done |
| dm_notice-776d8719f7da | dm_notice | District Manager notice DQC-8d4c7fb4-bonanza_fsr_822907_closure | 2 | done | done |
| dm_notice-7b5e8b47e40e | dm_notice | District Manager notice DCK-e487c48e-ck-2519_-_2024_inspection_signed | 4 | done | done |
| dm_notice-7c778b10b4cb | dm_notice | District Manager notice DSI-2654b71d-camper_creek_mainline_gate_map | 1 | done | done |
| dm_notice-7f66728b5e7d | dm_notice | District Manager notice DCR-13a23bfb-johnhart_cw_nocamporder | 1 | done | done |
| dm_notice-8381341001d8 | dm_notice | District Manager notice DQC-57ce8ede-delkatla_10891_closure | 2 | done | done |
| dm_notice-8c5bd9da8a12 | dm_notice | District Manager notice DCK-1f93b9e0-cypress_lake_fsr_fs301 | 2 | done | done |
| dm_notice-8e8150866b7d | dm_notice | District Manager notice DSI-98c8d0df-map_gate_fsr5833_br01 | 1 | done | done |
| dm_notice-8f638cc4fa71 | dm_notice | District Manager notice DQC-25fa270a-hanagover_fsr_822906_closure | 2 | done | done |
| dm_notice-9b00c0cf4e20 | dm_notice | District Manager notice DSE-b217a506-incomappleux_road_deactivation_appendix_a | 6 | done | done |
| dm_notice-9bb26cb8a355 | dm_notice | District Manager notice DCK-8eb16f04-squeah_fsr_-_2020_road_closure |  | done | done |
| dm_notice-b07b79e91076 | dm_notice | District Manager notice DCK-cfd72836-ac8126-19-01_bcts | 1 | done | done |
| dm_notice-b131542ebf24 | dm_notice | District Manager notice DVA-d66840c9-upper_driftwood_deactivation_advertisement | 1 | done | done |
| dm_notice-bf32ffd5ec5d | dm_notice | District Manager notice DSI-8a4bec36-news_release_-_access_changes_implemented_to_protect_ | 1 | done | done |
| dm_notice-c6f47515402c | dm_notice | District Manager notice DCK-8347a650-71w27vb_fsr_closures_amended_july_22 |  | done | done |
| dm_notice-d51d9aaf4efa | dm_notice | District Manager notice DSI-c4f696e7-map_tfl46_bugaboo_main_gate_location | 1 | done | done |
| dm_notice-db32d58132a3 | dm_notice | District Manager notice DCS-8f7c4b60-cascades_bridges2011dli | 1 | done | done |
| dm_notice-dc364be6d8dc | dm_notice | District Manager notice DCK-42f99435-1045201_-_discontinue_and_close_with_exhibit_a | 2 | done | done |
| dm_notice-e0d6dabd5881 | dm_notice | District Manager notice DVA-70228e68-dsn_road_restrictions_bulletin_4 |  | done | done |
| dm_notice-e883e2ab9acb | dm_notice | District Manager notice DSE-e4e6b5f8-trout_lake_rady_creek_deactivation_prescription_map | 6 | done | done |
| dm_notice-f51ecf6d78c9 | dm_notice | District Manager notice DCK-1379e235-radium_fsr_fs301 | 2 | done | done |
| dm_notice-fae92af706ac | dm_notice | District Manager notice DCK-668dd9ac-rup_obligations_and_expectations_-_august_18_2021_sig | 2 | done | done |
| road_notice-14912ad08536 | road_notice | District Manager notice DQC-6a1cfbef-2024_06_07_bill_brown_closure |  | done | done |
| road_notice-1c9098e8d135 | road_notice | Dore River – Br.2 FSR (8493.02) |  | done | done |
| road_notice-27cbe81c8759 | road_notice | Chuc 20600 (5506.34) |  | done | done |
| road_notice-2d7dfa9fde6e | road_notice | District Manager notice DVA-792bd4d5-project_flyer_driftwood_rebuild |  | done | done |
| road_notice-2dfa8620da6e | road_notice | Yalakom River FSR 7649.01 (updated Sept 3, 2026) |  | done | done |
| road_notice-2e98b98eea59 | road_notice | Chuchinka-Colbourne FSR (July 16, 2026) |  | done | done |
| road_notice-305afdc68d2e | road_notice | Woodbury Fletcher FSR 0198.02 (May 29, 2026) |  | done | done |
| road_notice-34ab84673962 | road_notice | Jumbo Creek FSR |  | done | done |
| road_notice-3b209d4870dc | road_notice | Bowron FSR 7141.01 (October 8, 2026) |  | done | done |
| road_notice-436cb9ce3a27 | road_notice | Chuchinka-Colbourne FSR (5506.04) |  | done | done |
| road_notice-44b537c454e9 | road_notice | District Manager notice DSC-335a98d1-a94817_bk_forest_service_road |  | done | done |
| road_notice-49661e37adf7 | road_notice | District Manager notice DCS-8f7c4b60-cascades_bridges2011dli |  | done | done |
| road_notice-4a79977a9c88 | road_notice | Bonaparte-Komori 6315.15 (May 27,2025) |  | done | done |
| road_notice-5909ab09a102 | road_notice | District Manager notice DQC-25fa270a-hanagover_fsr_822906_closure |  | done | done |
| road_notice-59378955a6ad | road_notice | Morice River FSR 4656-01 (September 4, 2026) |  | done | done |
| road_notice-5bf97a73840c | road_notice | District Manager notice DCK-668dd9ac-rup_obligations_and_expectations_-_august_18_2021_sig |  | done | done |
| road_notice-5ee6f2f9d918 | road_notice | Driftwood FSR 7822.01 - 15km Notice (Summer 2026) |  | done | done |
| road_notice-67c8e5619bb2 | road_notice | Clusko River – Aneko Creek FSR (4600rd) - Project#: 7356.04 |  | done | done |
| road_notice-694c9c949f21 | road_notice | Stawamus/Indian River FSR |  | done | done |
| road_notice-7236bbb51a24 | road_notice | Tom Cole Mountain 7670.01 (updated Sept 3, 2026) |  | done | done |
| road_notice-72eea8feb8ae | road_notice | District Manager notice DSI-66e61e93-gate_location_map_braden_mainline_and_tr11 |  | done | done |
| road_notice-7a2c63303ff2 | road_notice | District Manager notice DSI-8a4bec36-news_release_-_access_changes_implemented_to_protect_ |  | done | done |
| road_notice-7dee7073507f | road_notice | Redding Creek FSR 0252.05 (September 2, 2026) |  | done | done |
| road_notice-7f3d169fe171 | road_notice | District Manager notice DSI-dc65a045-lucky_fsr_road_closure |  | done | done |
| road_notice-8150c3e15b48 | road_notice | Bleeker FSR 8631.01 (September 28 - October 31, 2026) |  | done | done |
| road_notice-83206bc5517e | road_notice | Maxan Thompson Connector FSR 7735-26 (September 8 - 14, 2026) |  | done | done |
| road_notice-860a7d37f460 | road_notice | District Manager notice DSI-c2357ace-map-banon_fsr_gate_location |  | done | done |
| road_notice-8a0c3486f8a0 | road_notice | District Manager notice DSI-c4f696e7-map_tfl46_bugaboo_main_gate_location |  | done | done |
| road_notice-8bfa3fcaf53d | road_notice | District Manager notice DQC-8d4c7fb4-bonanza_fsr_822907_closure |  | done | done |
| road_notice-8c70e4ba161f | road_notice | Spout-Oie FSR 6411.01 (May 27, 2025) |  | done | done |
| road_notice-90493b8df443 | road_notice | District Manager notice DCR-13a23bfb-johnhart_cw_nocamporder |  | done | done |
| road_notice-9079a7718b9f | road_notice | Sanca Creek FSR 0189.01 (September 15 to October 9, 2026) |  | done | done |
| road_notice-9243ad7b4d4c | road_notice | Goat Range Park Br FSR 7051.02 (June 13, 2025) |  | done | done |
| road_notice-92443fbd9a1f | road_notice | Caribou Mountain FSR 9137.01 (November 13, 2025) |  | done | done |
| road_notice-9ffa3ffacbe0 | road_notice | District Manager notice DSI-a9fec493-walbran700_gate_location_map_2026mar9 |  | done | done |
| road_notice-a16e2f9adcea | road_notice | Squamish River FSR |  | done | done |
| road_notice-adf87b7adf9d | road_notice | Seymour River FSR 7271.01 (September 15, 2025) |  | done | done |
| road_notice-aebe76499bd2 | road_notice | McClatchie Creek FSR 5466.06 (August 2024) |  | done | done |
| road_notice-b22a04d8b8a1 | road_notice | District Manager notice DSI-5f111aca-kmu_gate_location_overview_map |  | done | done |
| road_notice-b52b74a709de | road_notice | Planned Bridge Maintenance (updated Sept 3, 2026) |  | done | done |
| road_notice-b5f179a1efdc | road_notice | Lillooet South FSR |  | done | done |
| road_notice-c43b45e5319d | road_notice | District Manager notice DSI-98c8d0df-map_gate_fsr5833_br01 |  | done | done |
| road_notice-c9412ce03a2c | road_notice | Scottie Creek FSR 5451.01 (September 1 - September 25, 2026) |  | done | done |
| road_notice-d35c4cfa553b | road_notice | Otter Creek FSR 0564.03 (September 19, 2026) |  | done | done |
| road_notice-d744d0570ff0 | road_notice | Hunter Creek FSR 6086.01 (July 14, 2026) |  | done | done |
| road_notice-dcd926671461 | road_notice | Dore FSR 8493.01 (August 17, 2026) |  | done | done |
| road_notice-dd95bc529fac | road_notice | District Manager notice DQC-57ce8ede-delkatla_10891_closure |  | done | done |
| road_notice-e6f5d7094fe2 | road_notice | Caribou FSR 10998.01 (2016) |  | done | done |
| road_notice-ed94d1694b3f | road_notice | District Manager notice DVA-d66840c9-upper_driftwood_deactivation_advertisement |  | done | done |
| road_notice-f23db57889c7 | road_notice | District Manager notice DSI-2654b71d-camper_creek_mainline_gate_map |  | done | done |
| road_notice-f5b65a1fa713 | road_notice | Adams Lake West FSR 7458.01 (September 19, 2023) |  | done | done |
| road_notice-f63a651bc0d9 | road_notice | Sechelt Roberts Branch 01 & 02 - FSR 7575 01 & 02 |  | done | done |
| road_notice-f86ae7a456a4 | road_notice | District Manager notice DCS-01301b15-bridge_inspections_2015_hillshade_south_cascades_all_ |  | done | done |
