# Empirical Diversity & Reproducibility Verification Report

- **Date**: 2026-11-07T11:43:16.320Z
- **Zero Duplicates Within 16-Tile Grids**: ✅ PASSED (0 duplicate tiles in any 4×4 grid)
- **Consecutive Runs Diversity**: ✅ PASSED (Consecutive runs share $\le$ 8 tiles in finite offline bank)
- **All Unlocked Seeds Distinct**: ✅ PASSED (6/6 unique seeds)
- **Lock Seed Reproducibility**: ✅ PASSED (100% identical outputs when seed locked)

## Seeds Drawn in Sequential Unlocked Runs
- Run #1: Seed `454418289`
- Run #2: Seed `35526471`
- Run #3: Seed `2002970217`
- Run #4: Seed `1734024108`
- Run #5: Seed `305034573`
- Run #6: Seed `1815033692`

## Tile Overlap Matrix (DDPM 16-tile grids)
- Run #1: Initial fresh batch of 16 distinct tiles
- Run #2 vs Run #1: 4 overlapping tiles out of 16 (25%)
- Run #3 vs Run #2: 5 overlapping tiles out of 16 (31%)
- Run #4 vs Run #3: 6 overlapping tiles out of 16 (38%)
- Run #5 vs Run #4: 6 overlapping tiles out of 16 (38%)
- Run #6 vs Run #5: 6 overlapping tiles out of 16 (38%)
