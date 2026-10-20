# Agent-mode extraction work list

Generated 2026-10-19T20:17:17.869Z by `make extract` (mode: agent; no ANTHROPIC_API_KEY in .env).

Run 1: Claude Code reads each brief in `queue/agent/run1/` and writes the answer file it names. Run 2: for each brief in `queue/agent/run2/`, start a fresh subagent and give it only that brief (it holds the prompt, schema and source text, never the run-1 answer); it replies with file paths only, so nothing of run 2 reaches run 1. Then run `make build`.

Progress: run 1 94 of 103 done (9 left); run 2 94 of 103 done (9 left).

| Task | Kind | Title | Images | Run 1 | Run 2 |
| --- | --- | --- | ---: | --- | --- |
| bylaw-4bec108b2629 | bylaw | City of Chilliwack: Firearms Regulation Bylaw 2740 (C) |  | done | done |
| bylaw-d25bbe7b8455 | bylaw | City of Langley: Firearms Bylaw |  | done | done |
| bylaw-df927588ea72 | bylaw | City of Chilliwack: Firearms Regulation Bylaw 2740 (C) |  | done | done |
| closed_area-6f910f8509f6 | closed_area | Closed Areas Regulation, Schedule 5, section 85 |  | done | done |
| dm_notice-01673fb09107 | dm_notice | District Manager notice DSI-c2357ace-map-banon_fsr_gate_location | 1 | done | done |
| dm_notice-045a8cf5e8b4 | dm_notice | District Manager notice DSE-2cb2b189-incomappleux_br2deact | 1 | [brief](agent/run1/dm_notice-045a8cf5e8b4.md) | [brief](agent/run2/dm_notice-045a8cf5e8b4.md) |
| dm_notice-1161790b30f2 | dm_notice | District Manager notice DSI-dc65a045-lucky_fsr_road_closure | 1 | done | done |
| dm_notice-12dd6c6259d5 | dm_notice | District Manager notice DCK-691e2b1a-hunter_fsr_variance_to_closure |  | done | done |
| dm_notice-13cca27c2143 | dm_notice | District Manager notice DSI-66e61e93-gate_location_map_braden_mainline_and_tr11 | 1 | done | done |
| dm_notice-13ecbdfe694d | dm_notice | District Manager notice DCK-d8b34b6d-807402_03_04_05_06_fs_301_-_fsr_discontinue_and_close | 2 | [brief](agent/run1/dm_notice-13ecbdfe694d.md) | [brief](agent/run2/dm_notice-13ecbdfe694d.md) |
| dm_notice-15db79882120 | dm_notice | District Manager notice DVA-3faae646-dsn_road_restictions_2026_spring_road_bans_bulletin_3 |  | done | done |
| dm_notice-21679d9bdf82 | dm_notice | District Manager notice DSI-5f111aca-kmu_gate_location_overview_map | 1 | [brief](agent/run1/dm_notice-21679d9bdf82.md) | [brief](agent/run2/dm_notice-21679d9bdf82.md) |
| dm_notice-2951e5be5db2 | dm_notice | District Manager notice DCK-cdff3673-bench_fsr_road_closure |  | done | done |
| dm_notice-2cce44563814 | dm_notice | District Manager notice DCK-94372f1a-mowhokam_east_fsr_closure |  | done | done |
| dm_notice-2f64f403c8ef | dm_notice | District Manager notice DCK-15d8fff4-east_anderson_fsr_road_closure_april_24_2026 |  | done | done |
| dm_notice-3037d33c379d | dm_notice | District Manager notice DCR-9ef086bc-dcr_sdfmap | 1 | done | done |
| dm_notice-3219bf9cc703 | dm_notice | District Manager notice DCK-4d024dd5-american_fsr_road_closure_february_9_2026 | 1 | done | done |
| dm_notice-35ed0dd49183 | dm_notice | District Manager notice DSE-c3a0aaa8-incomappleux_road_deactivation_prescription_overview_ | 1 | [brief](agent/run1/dm_notice-35ed0dd49183.md) | [brief](agent/run2/dm_notice-35ed0dd49183.md) |
| dm_notice-3e2decbff3de | dm_notice | District Manager notice DSC-335a98d1-a94817_bk_forest_service_road | 1 | done | done |
| dm_notice-48a0eb265107 | dm_notice | District Manager notice DSI-7d1cff67-canal_main_closure | 1 | done | done |
| dm_notice-4b6e47cfa5c0 | dm_notice | District Manager notice DSI-a9fec493-walbran700_gate_location_map_2026mar9 | 1 | [brief](agent/run1/dm_notice-4b6e47cfa5c0.md) | [brief](agent/run2/dm_notice-4b6e47cfa5c0.md) |
| dm_notice-4e12e8af94df | dm_notice | District Manager notice DCK-0c70d269-bucklin_fsr_-_2019_road_closure | 1 | done | done |
| dm_notice-4eab5bce811c | dm_notice | District Manager notice DSE-68d293da-faq_document_for_incomappleux_deactivation | 1 | done | done |
| dm_notice-4ff4d386a7d7 | dm_notice | District Manager notice DQC-6a1cfbef-2024_06_07_bill_brown_closure | 1 | done | done |
| dm_notice-5d45dcf5b959 | dm_notice | District Manager notice DVA-792bd4d5-project_flyer_driftwood_rebuild | 1 | done | done |
| dm_notice-6185e31c0ce7 | dm_notice | District Manager notice DCK-9a9e782c-notice_of_clousre_harrison_east_fsr_-_rescinded |  | done | done |
| dm_notice-64350f0b5ea2 | dm_notice | District Manager notice DCK-79c52629-fs301_december_13_2024 | 5 | done | done |
| dm_notice-6646e880bf3d | dm_notice | District Manager notice DCS-01301b15-bridge_inspections_2015_hillshade_south_cascades_all_ | 1 | [brief](agent/run1/dm_notice-6646e880bf3d.md) | [brief](agent/run2/dm_notice-6646e880bf3d.md) |
| dm_notice-6cd3c19b01b0 | dm_notice | District Manager notice DCK-a36f6f84-fsr_road_closure_notice_december_storm_damage | 1 | done | done |
| dm_notice-776d8719f7da | dm_notice | District Manager notice DQC-8d4c7fb4-bonanza_fsr_822907_closure | 2 | done | done |
| dm_notice-7b5e8b47e40e | dm_notice | District Manager notice DCK-e487c48e-ck-2519_-_2024_inspection_signed | 4 | done | done |
| dm_notice-7c778b10b4cb | dm_notice | District Manager notice DSI-2654b71d-camper_creek_mainline_gate_map | 1 | [brief](agent/run1/dm_notice-7c778b10b4cb.md) | [brief](agent/run2/dm_notice-7c778b10b4cb.md) |
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
| dm_notice-db32d58132a3 | dm_notice | District Manager notice DCS-8f7c4b60-cascades_bridges2011dli | 1 | [brief](agent/run1/dm_notice-db32d58132a3.md) | [brief](agent/run2/dm_notice-db32d58132a3.md) |
| dm_notice-dc364be6d8dc | dm_notice | District Manager notice DCK-42f99435-1045201_-_discontinue_and_close_with_exhibit_a | 2 | done | done |
| dm_notice-e0d6dabd5881 | dm_notice | District Manager notice DVA-70228e68-dsn_road_restrictions_bulletin_4 |  | done | done |
| dm_notice-e883e2ab9acb | dm_notice | District Manager notice DSE-e4e6b5f8-trout_lake_rady_creek_deactivation_prescription_map | 6 | [brief](agent/run1/dm_notice-e883e2ab9acb.md) | [brief](agent/run2/dm_notice-e883e2ab9acb.md) |
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
