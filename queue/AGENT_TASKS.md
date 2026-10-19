# Agent-mode extraction work list

Generated 2026-10-19T17:51:55.430Z by `make extract` (mode: agent; no ANTHROPIC_API_KEY in .env).

Run 1: Claude Code reads each brief in `queue/agent/run1/` and writes the answer file it names. Run 2: for each brief in `queue/agent/run2/`, start a fresh subagent and give it only that brief (it holds the prompt, schema and source text, never the run-1 answer); it replies with file paths only, so nothing of run 2 reaches run 1. Then run `make build`.

Run 1 still needed: 3. Run 2 still needed: 3.

| Task | Kind | Title | Run 1 | Run 2 |
| --- | --- | --- | --- | --- |
| bylaw-266d0d6f7f85 | bylaw | City of Richmond: Firearm Discharge Regulation Bylaw 4183 (1983) | done | done |
| bylaw-bf74c22930e3 | bylaw | Squamish-Lillooet Regional District: Firearms Electoral Area A / Squamish-Lillooet Regiona | [brief](agent/run1/bylaw-bf74c22930e3.md) | [brief](agent/run2/bylaw-bf74c22930e3.md) |
| bylaw-e55e095ee0fd | bylaw | Squamish-Lillooet Regional District: RB_1294 Electoral Area D Firearms Bylaw (Consoldiatio | [brief](agent/run1/bylaw-e55e095ee0fd.md) | [brief](agent/run2/bylaw-e55e095ee0fd.md) |
| closed_area-6f910f8509f6 | closed_area | Closed Areas Regulation, Schedule 5, section 85 | done | done |
| road_notice-02e78c516241 | road_notice | District Manager notice DCK-94372f1a-mowhokam_east_fsr_closure | done | done |
| road_notice-1c9098e8d135 | road_notice | Dore River – Br.2 FSR (8493.02) | done | done |
| road_notice-27cbe81c8759 | road_notice | Chuc 20600 (5506.34) | done | done |
| road_notice-2dfa8620da6e | road_notice | Yalakom River FSR 7649.01 (updated Sept 3, 2026) | done | done |
| road_notice-2e98b98eea59 | road_notice | Chuchinka-Colbourne FSR (July 16, 2026) | done | done |
| road_notice-305afdc68d2e | road_notice | Woodbury Fletcher FSR 0198.02 (May 29, 2026) | done | done |
| road_notice-30f3536c4b24 | road_notice | District Manager notice DSE-e4e6b5f8-trout_lake_rady_creek_deactivation_prescription_map | done | done |
| road_notice-31b09c8a8471 | road_notice | District Manager notice DCK-1379e235-radium_fsr_fs301 | done | done |
| road_notice-32370bcd2dd8 | road_notice | District Manager notice DCK-a36f6f84-fsr_road_closure_notice_december_storm_damage | done | done |
| road_notice-34ab84673962 | road_notice | Jumbo Creek FSR | done | done |
| road_notice-3a993319de48 | road_notice | District Manager notice DCK-4d024dd5-american_fsr_road_closure_february_9_2026 | done | done |
| road_notice-3b209d4870dc | road_notice | Bowron FSR 7141.01 (October 8, 2026) | done | done |
| road_notice-3dc0f312e1ae | road_notice | District Manager notice DCK-cdff3673-bench_fsr_road_closure | done | done |
| road_notice-4040cacff7f0 | road_notice | District Manager notice DCK-8eb16f04-squeah_fsr_-_2020_road_closure | done | done |
| road_notice-436cb9ce3a27 | road_notice | Chuchinka-Colbourne FSR (5506.04) | done | done |
| road_notice-44f890b070df | road_notice | District Manager notice DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_ | done | done |
| road_notice-4743bba44eaf | road_notice | District Manager notice DCK-d8b34b6d-807402_03_04_05_06_fs_301_-_fsr_discontinue_and_close | done | done |
| road_notice-485cf0995acc | road_notice | District Manager notice DCK-691e2b1a-hunter_fsr_variance_to_closure | done | done |
| road_notice-4a79977a9c88 | road_notice | Bonaparte-Komori 6315.15 (May 27,2025) | done | done |
| road_notice-59378955a6ad | road_notice | Morice River FSR 4656-01 (September 4, 2026) | done | done |
| road_notice-5ee6f2f9d918 | road_notice | Driftwood FSR 7822.01 - 15km Notice (Summer 2026) | [brief](agent/run1/road_notice-5ee6f2f9d918.md) | [brief](agent/run2/road_notice-5ee6f2f9d918.md) |
| road_notice-647f12c4bc28 | road_notice | District Manager notice DCK-0c70d269-bucklin_fsr_-_2019_road_closure | done | done |
| road_notice-66334febec32 | road_notice | District Manager notice DSE-2cb2b189-incomappleux_br2deact | done | done |
| road_notice-67c8e5619bb2 | road_notice | Clusko River – Aneko Creek FSR (4600rd) - Project#: 7356.04 | done | done |
| road_notice-694c9c949f21 | road_notice | Stawamus/Indian River FSR | done | done |
| road_notice-7236bbb51a24 | road_notice | Tom Cole Mountain 7670.01 (updated Sept 3, 2026) | done | done |
| road_notice-7dee7073507f | road_notice | Redding Creek FSR 0252.05 (September 2, 2026) | done | done |
| road_notice-8150c3e15b48 | road_notice | Bleeker FSR 8631.01 (September 28 - October 31, 2026) | done | done |
| road_notice-83206bc5517e | road_notice | Maxan Thompson Connector FSR 7735-26 (September 8 - 14, 2026) | done | done |
| road_notice-86f64d2888d5 | road_notice | District Manager notice DCK-1f93b9e0-cypress_lake_fsr_fs301 | done | done |
| road_notice-8c70e4ba161f | road_notice | Spout-Oie FSR 6411.01 (May 27, 2025) | done | done |
| road_notice-9079a7718b9f | road_notice | Sanca Creek FSR 0189.01 (September 15 to October 9, 2026) | done | done |
| road_notice-9243ad7b4d4c | road_notice | Goat Range Park Br FSR 7051.02 (June 13, 2025) | done | done |
| road_notice-92443fbd9a1f | road_notice | Caribou Mountain FSR 9137.01 (November 13, 2025) | done | done |
| road_notice-9d43cf000d14 | road_notice | District Manager notice DCK-9a9e782c-notice_of_clousre_harrison_east_fsr_-_rescinded | done | done |
| road_notice-9da559da056d | road_notice | District Manager notice DCK-79c52629-fs301_december_13_2024 | done | done |
| road_notice-a16e2f9adcea | road_notice | Squamish River FSR | done | done |
| road_notice-a38c9248aec8 | road_notice | District Manager notice DCK-15d8fff4-east_anderson_fsr_road_closure_april_24_2026 | done | done |
| road_notice-aaa136d37391 | road_notice | District Manager notice DSE-b217a506-incomappleux_road_deactivation_appendix_a | done | done |
| road_notice-adf87b7adf9d | road_notice | Seymour River FSR 7271.01 (September 15, 2025) | done | done |
| road_notice-aebe76499bd2 | road_notice | McClatchie Creek FSR 5466.06 (August 2024) | done | done |
| road_notice-b52b74a709de | road_notice | Planned Bridge Maintenance (updated Sept 3, 2026) | done | done |
| road_notice-b5f179a1efdc | road_notice | Lillooet South FSR | done | done |
| road_notice-c17a06858085 | road_notice | District Manager notice DCK-e487c48e-ck-2519_-_2024_inspection_signed | done | done |
| road_notice-c9412ce03a2c | road_notice | Scottie Creek FSR 5451.01 (September 1 - September 25, 2026) | done | done |
| road_notice-d35c4cfa553b | road_notice | Otter Creek FSR 0564.03 (September 19, 2026) | done | done |
| road_notice-d744d0570ff0 | road_notice | Hunter Creek FSR 6086.01 (July 14, 2026) | done | done |
| road_notice-d7d6e8debaf3 | road_notice | District Manager notice DCK-8347a650-71w27vb_fsr_closures_amended_july_22 | done | done |
| road_notice-dbd31f5d4eb3 | road_notice | District Manager notice DVA-70228e68-dsn_road_restrictions_bulletin_4 | done | done |
| road_notice-dcd926671461 | road_notice | Dore FSR 8493.01 (August 17, 2026) | done | done |
| road_notice-e6f5d7094fe2 | road_notice | Caribou FSR 10998.01 (2016) | done | done |
| road_notice-ee6fe178a163 | road_notice | District Manager notice DSE-68d293da-faq_document_for_incomappleux_deactivation | done | done |
| road_notice-f33b4a1b79d8 | road_notice | District Manager notice DVA-3faae646-dsn_road_restictions_2026_spring_road_bans_bulletin_3 | done | done |
| road_notice-f5b65a1fa713 | road_notice | Adams Lake West FSR 7458.01 (September 19, 2023) | done | done |
| road_notice-f63a651bc0d9 | road_notice | Sechelt Roberts Branch 01 & 02 - FSR 7575 01 & 02 | done | done |
| road_notice-fcb6d092a82c | road_notice | District Manager notice DCK-cfd72836-ac8126-19-01_bcts | done | done |
| road_notice-fd54d9f5401c | road_notice | District Manager notice DCK-42f99435-1045201_-_discontinue_and_close_with_exhibit_a | done | done |
