# Agent-mode extraction work list

Generated 2026-10-19T17:33:07.232Z by `make extract` (mode: agent; no ANTHROPIC_API_KEY in .env).

Run 1: Claude Code reads each brief in `queue/agent/run1/` and writes the answer file it names. Run 2: for each brief in `queue/agent/run2/`, start a fresh subagent and give it only that brief (it holds the prompt, schema and source text, never the run-1 answer). Then run `make build`.

Run 1 still needed: 38. Run 2 still needed: 38.

| Task | Kind | Title | Run 1 | Run 2 |
| --- | --- | --- | --- | --- |
| closed_area-6f910f8509f6 | closed_area | Closed Areas Regulation, Schedule 5, section 85 | [brief](agent/run1/closed_area-6f910f8509f6.md) | [brief](agent/run2/closed_area-6f910f8509f6.md) |
| road_notice-02e78c516241 | road_notice | District Manager notice DCK-94372f1a-mowhokam_east_fsr_closure | [brief](agent/run1/road_notice-02e78c516241.md) | [brief](agent/run2/road_notice-02e78c516241.md) |
| road_notice-2e98b98eea59 | road_notice | Chuchinka-Colbourne FSR (July 16, 2026) | [brief](agent/run1/road_notice-2e98b98eea59.md) | [brief](agent/run2/road_notice-2e98b98eea59.md) |
| road_notice-305afdc68d2e | road_notice | Woodbury Fletcher FSR 0198.02 (May 29, 2026) | [brief](agent/run1/road_notice-305afdc68d2e.md) | [brief](agent/run2/road_notice-305afdc68d2e.md) |
| road_notice-30f3536c4b24 | road_notice | District Manager notice DSE-e4e6b5f8-trout_lake_rady_creek_deactivation_prescription_map | [brief](agent/run1/road_notice-30f3536c4b24.md) | [brief](agent/run2/road_notice-30f3536c4b24.md) |
| road_notice-31b09c8a8471 | road_notice | District Manager notice DCK-1379e235-radium_fsr_fs301 | [brief](agent/run1/road_notice-31b09c8a8471.md) | [brief](agent/run2/road_notice-31b09c8a8471.md) |
| road_notice-32370bcd2dd8 | road_notice | District Manager notice DCK-a36f6f84-fsr_road_closure_notice_december_storm_damage | [brief](agent/run1/road_notice-32370bcd2dd8.md) | [brief](agent/run2/road_notice-32370bcd2dd8.md) |
| road_notice-3a993319de48 | road_notice | District Manager notice DCK-4d024dd5-american_fsr_road_closure_february_9_2026 | [brief](agent/run1/road_notice-3a993319de48.md) | [brief](agent/run2/road_notice-3a993319de48.md) |
| road_notice-3b209d4870dc | road_notice | Bowron FSR 7141.01 (October 8, 2026) | [brief](agent/run1/road_notice-3b209d4870dc.md) | [brief](agent/run2/road_notice-3b209d4870dc.md) |
| road_notice-3dc0f312e1ae | road_notice | District Manager notice DCK-cdff3673-bench_fsr_road_closure | [brief](agent/run1/road_notice-3dc0f312e1ae.md) | [brief](agent/run2/road_notice-3dc0f312e1ae.md) |
| road_notice-4040cacff7f0 | road_notice | District Manager notice DCK-8eb16f04-squeah_fsr_-_2020_road_closure | [brief](agent/run1/road_notice-4040cacff7f0.md) | [brief](agent/run2/road_notice-4040cacff7f0.md) |
| road_notice-44f890b070df | road_notice | District Manager notice DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_ | [brief](agent/run1/road_notice-44f890b070df.md) | [brief](agent/run2/road_notice-44f890b070df.md) |
| road_notice-4743bba44eaf | road_notice | District Manager notice DCK-d8b34b6d-807402_03_04_05_06_fs_301_-_fsr_discontinue_and_close | [brief](agent/run1/road_notice-4743bba44eaf.md) | [brief](agent/run2/road_notice-4743bba44eaf.md) |
| road_notice-485cf0995acc | road_notice | District Manager notice DCK-691e2b1a-hunter_fsr_variance_to_closure | [brief](agent/run1/road_notice-485cf0995acc.md) | [brief](agent/run2/road_notice-485cf0995acc.md) |
| road_notice-59378955a6ad | road_notice | Morice River FSR 4656-01 (September 4, 2026) | [brief](agent/run1/road_notice-59378955a6ad.md) | [brief](agent/run2/road_notice-59378955a6ad.md) |
| road_notice-647f12c4bc28 | road_notice | District Manager notice DCK-0c70d269-bucklin_fsr_-_2019_road_closure | [brief](agent/run1/road_notice-647f12c4bc28.md) | [brief](agent/run2/road_notice-647f12c4bc28.md) |
| road_notice-66334febec32 | road_notice | District Manager notice DSE-2cb2b189-incomappleux_br2deact | [brief](agent/run1/road_notice-66334febec32.md) | [brief](agent/run2/road_notice-66334febec32.md) |
| road_notice-7dee7073507f | road_notice | Redding Creek FSR 0252.05 (September 2, 2026) | [brief](agent/run1/road_notice-7dee7073507f.md) | [brief](agent/run2/road_notice-7dee7073507f.md) |
| road_notice-86f64d2888d5 | road_notice | District Manager notice DCK-1f93b9e0-cypress_lake_fsr_fs301 | [brief](agent/run1/road_notice-86f64d2888d5.md) | [brief](agent/run2/road_notice-86f64d2888d5.md) |
| road_notice-8c70e4ba161f | road_notice | Spout-Oie FSR 6411.01 (May 27, 2025) | [brief](agent/run1/road_notice-8c70e4ba161f.md) | [brief](agent/run2/road_notice-8c70e4ba161f.md) |
| road_notice-9243ad7b4d4c | road_notice | Goat Range Park Br FSR 7051.02 (June 13, 2025) | [brief](agent/run1/road_notice-9243ad7b4d4c.md) | [brief](agent/run2/road_notice-9243ad7b4d4c.md) |
| road_notice-92443fbd9a1f | road_notice | Caribou Mountain FSR 9137.01 (November 13, 2025) | [brief](agent/run1/road_notice-92443fbd9a1f.md) | [brief](agent/run2/road_notice-92443fbd9a1f.md) |
| road_notice-9d43cf000d14 | road_notice | District Manager notice DCK-9a9e782c-notice_of_clousre_harrison_east_fsr_-_rescinded | [brief](agent/run1/road_notice-9d43cf000d14.md) | [brief](agent/run2/road_notice-9d43cf000d14.md) |
| road_notice-9da559da056d | road_notice | District Manager notice DCK-79c52629-fs301_december_13_2024 | [brief](agent/run1/road_notice-9da559da056d.md) | [brief](agent/run2/road_notice-9da559da056d.md) |
| road_notice-a38c9248aec8 | road_notice | District Manager notice DCK-15d8fff4-east_anderson_fsr_road_closure_april_24_2026 | [brief](agent/run1/road_notice-a38c9248aec8.md) | [brief](agent/run2/road_notice-a38c9248aec8.md) |
| road_notice-aaa136d37391 | road_notice | District Manager notice DSE-b217a506-incomappleux_road_deactivation_appendix_a | [brief](agent/run1/road_notice-aaa136d37391.md) | [brief](agent/run2/road_notice-aaa136d37391.md) |
| road_notice-adf87b7adf9d | road_notice | Seymour River FSR 7271.01 (September 15, 2025) | [brief](agent/run1/road_notice-adf87b7adf9d.md) | [brief](agent/run2/road_notice-adf87b7adf9d.md) |
| road_notice-b33f1acbbe31 | road_notice | Otter Creek FSR 0564.03 (September 19, 2026) | [brief](agent/run1/road_notice-b33f1acbbe31.md) | [brief](agent/run2/road_notice-b33f1acbbe31.md) |
| road_notice-c17a06858085 | road_notice | District Manager notice DCK-e487c48e-ck-2519_-_2024_inspection_signed | [brief](agent/run1/road_notice-c17a06858085.md) | [brief](agent/run2/road_notice-c17a06858085.md) |
| road_notice-d744d0570ff0 | road_notice | Hunter Creek FSR 6086.01 (July 14, 2026) | [brief](agent/run1/road_notice-d744d0570ff0.md) | [brief](agent/run2/road_notice-d744d0570ff0.md) |
| road_notice-d7d6e8debaf3 | road_notice | District Manager notice DCK-8347a650-71w27vb_fsr_closures_amended_july_22 | [brief](agent/run1/road_notice-d7d6e8debaf3.md) | [brief](agent/run2/road_notice-d7d6e8debaf3.md) |
| road_notice-dbd31f5d4eb3 | road_notice | District Manager notice DVA-70228e68-dsn_road_restrictions_bulletin_4 | [brief](agent/run1/road_notice-dbd31f5d4eb3.md) | [brief](agent/run2/road_notice-dbd31f5d4eb3.md) |
| road_notice-dcd926671461 | road_notice | Dore FSR 8493.01 (August 17, 2026) | [brief](agent/run1/road_notice-dcd926671461.md) | [brief](agent/run2/road_notice-dcd926671461.md) |
| road_notice-ee6fe178a163 | road_notice | District Manager notice DSE-68d293da-faq_document_for_incomappleux_deactivation | [brief](agent/run1/road_notice-ee6fe178a163.md) | [brief](agent/run2/road_notice-ee6fe178a163.md) |
| road_notice-f33b4a1b79d8 | road_notice | District Manager notice DVA-3faae646-dsn_road_restictions_2026_spring_road_bans_bulletin_3 | [brief](agent/run1/road_notice-f33b4a1b79d8.md) | [brief](agent/run2/road_notice-f33b4a1b79d8.md) |
| road_notice-f5b65a1fa713 | road_notice | Adams Lake West FSR 7458.01 (September 19, 2023) | [brief](agent/run1/road_notice-f5b65a1fa713.md) | [brief](agent/run2/road_notice-f5b65a1fa713.md) |
| road_notice-fcb6d092a82c | road_notice | District Manager notice DCK-cfd72836-ac8126-19-01_bcts | [brief](agent/run1/road_notice-fcb6d092a82c.md) | [brief](agent/run2/road_notice-fcb6d092a82c.md) |
| road_notice-fd54d9f5401c | road_notice | District Manager notice DCK-42f99435-1045201_-_discontinue_and_close_with_exhibit_a | [brief](agent/run1/road_notice-fd54d9f5401c.md) | [brief](agent/run2/road_notice-fd54d9f5401c.md) |
