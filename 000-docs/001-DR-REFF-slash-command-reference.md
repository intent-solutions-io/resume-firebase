# Slash Command Reference

**Document Type:** Reference Guide (DR-REFF)
**Created:** 2025-12-07
**Status:** Active

---

## Available Slash Commands

This project uses slash commands to automate common workflows. Below is the complete reference.

### Universal Commands

#### `/appaudit`
**Purpose:** Universal operator-grade system analysis for DevOps onboarding and operations playbook generation

**Usage:**
```bash
/appaudit
```

**Output:**
- Complete system analysis
- Operations playbook
- DevOps onboarding documentation

---

#### `/eod-sweep`
**Purpose:** Universal end-of-day repository automation with self-configuring project detection and comprehensive maintenance

**Usage:**
```bash
/eod-sweep
```

**Features:**
- Auto-detects project type
- Runs maintenance tasks
- Generates reports
- Commits changes

---

#### `/sync-standards`
**Purpose:** Sync master directory standards and create compliant structure in any project

**Usage:**
```bash
/sync-standards
```

**Output:**
- Syncs 6767 canonical standards
- Creates compliant 000-docs structure
- Updates CLAUDE.md if needed

---

### Content & Documentation Commands

#### `/blog-startaitools`
**Purpose:** Generate and publish a technical blog post to startaitools.com showcasing work and teaching others

---

#### `/blog-jeremylongshore`
**Purpose:** Generate and publish a portfolio/CV-style blog post to jeremylongshore.com highlighting career growth

---

#### `/blog-jeremy-x`
**Purpose:** Generate and publish a portfolio blog post to jeremylongshore.com AND create a Twitter/X thread

---

#### `/blog-single-startai`
**Purpose:** Generate and publish a technical blog post to startaitools.com AND create a Twitter/X thread

---

#### `/blog-both-x`
**Purpose:** Generate and publish blog posts to BOTH startaitools.com AND jeremylongshore.com PLUS create a Twitter/X thread

---

#### `/content-nuke`
**Purpose:** Generate and publish content across ALL platforms - StartAITools blog, JeremyLongshore blog, X thread, and LinkedIn post

---

#### `/post-x`
**Purpose:** Post directly to X/Twitter with automatic formatting, character optimization, and analytics tracking

---

### Development Commands

#### `/create-google-agent`
**Purpose:** Create a production-ready Google Cloud agent using ADK and Agent Starter Pack with CI/CD, deployment, and testing infrastructure

---

#### `/create-template`
**Purpose:** Interactive prompt template generator that creates properly formatted templates from user descriptions

---

#### `/debug-fix`
**Purpose:** Comprehensive auditable debugging protocol with Taskwarrior tracking, gates, and evidence collection for failed fixes

---

### Documentation Commands

#### `/doc-filing`
**Purpose:** Organize all loose project documents into flat 000-docs/ folder with category-based sequential naming

**Usage:**
```bash
/doc-filing
```

**Features:**
- Finds all loose documentation
- Applies proper NNN-CC-ABCD naming
- Moves to 000-docs/
- Creates index

---

#### `/organize-docs`
**Purpose:** Find and organize all Claude-created documentation into claudes-docs folder with proper structure

---

#### `/intel-commands`
**Purpose:** Generate comprehensive documentation of all available slash commands with usage analytics and examples

---

#### `/command-bible`
**Purpose:** Generate a comprehensive reference guide for all slash commands with usage analytics and examples

---

### Release & Project Management Commands

#### `/bob-release`
**Purpose:** Precision release engineering for bobs-brain with canonical ADK/Vertex patterns, automated analysis, and impeccable audit trails

---

#### `/ccpi-release`
**Purpose:** Enterprise-grade release orchestrator for claude-code-plugins with automated analysis, comprehensive validation, and flawless execution

---

#### `/nixtla-release-original-backup`
**Purpose:** Production release engineer for nixtla baseline lab - analyzes changes, determines version bumps, and prepares all release artifacts

---

### Plugin Commands

#### `/jeremy-genkit-pro:init-genkit-project`
**Purpose:** Initialize a new Firebase Genkit project with best practices, proper structure, and production-ready configuration for Node.js, Python, or Go

**Plugin:** jeremy-genkit-pro@claude-code-plugins-plus

---

### Utility Commands

#### `/tmux-all`
**Purpose:** Start all tmux sessions for active projects

---

#### `/test-simple`
**Purpose:** Test command to verify slash command system works

---

## Command Categories

### By Function

| Category | Commands |
|----------|----------|
| **Documentation** | /doc-filing, /organize-docs, /intel-commands, /command-bible |
| **Content Publishing** | /blog-*, /post-x, /content-nuke |
| **Development** | /create-google-agent, /create-template, /debug-fix |
| **Release Management** | /bob-release, /ccpi-release, /nixtla-release-original-backup |
| **System Maintenance** | /appaudit, /eod-sweep, /sync-standards, /tmux-all |
| **Plugins** | /jeremy-genkit-pro:init-genkit-project |

---

## Best Practices

1. **Run /sync-standards first** in new projects to set up proper structure
2. **Use /doc-filing** to organize loose documentation
3. **Run /eod-sweep** at end of day for automated maintenance
4. **Use /appaudit** when onboarding to new project
5. **Create content with /content-nuke** for maximum reach across platforms

---

## Adding New Commands

Slash commands are stored in `.claude/commands/` directory.

**Format:**
```
.claude/commands/
├── command-name.md
└── another-command.md
```

Each command file contains the prompt that executes when the command is called.

---

**Last Updated:** 2025-12-07
