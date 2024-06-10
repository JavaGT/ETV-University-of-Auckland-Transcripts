# Transcripts and Metadata from [ETV](https://uoa.etv.org.nz)

Collecting transcripts made with insanely-fast-whisper in order to create a search index + app.

Original metadata from ETV saved in './metadata' and json transcript files from insanely-fast-whisper with distil-whisper large v3 in "./transcripts/"

## Plan
- [x] Minimum viable code for collecting metadata
- [ ] Minimum viable code for collecting transcripts
- [ ] Pre-process metadata for searching/filtering transcripts
- [ ] Pre-process transcripts for searching
- [ ] Minimum viable code for searching transcripts
- [ ] Impliment download_metadata script. Make it run daily to collect metadata using github actions (Using known IDs to find sequences with new additions)