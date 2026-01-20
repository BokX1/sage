# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added
- Improved autopilot routing robustness and heuristics.
- Standardized documentation around the Gemini model and pipeline stats.

### Changed
- Synced `.env.example` with production configuration values.
- Removed stray Gemini-large references and DeepSeek references across docs.

## 0.1.0-beta

### Added
- Mixture-of-Experts orchestration with router, experts, governor, and tracing.
- Relationship graph, memory system, and summary pipeline improvements.
- Expanded documentation for architecture and memory systems.

### Changed
- Pollinations-only model override in profile memory.
- Lint/build verification improvements and assorted code cleanup.

### Fixed
- Channel summary JSON handling and admin summary commands.
- Context memory and voice logger stability issues.
