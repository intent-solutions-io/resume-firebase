# Resume Generator

Production-ready resume generator with multiple output formats (PDF, HTML, Markdown, DOCX).

## Features

- Multiple output formats (PDF, HTML, Markdown, DOCX)
- Template-based system
- JSON/YAML data input
- AI-powered content optimization
- ATS-friendly formatting
- Version control for resumes
- Custom styling and themes

## Project Structure

```
generator/
├── 000-docs/              # Project documentation (6767 + NNN standards)
├── src/                   # Source code
│   ├── generators/        # Format-specific generators
│   ├── parsers/           # Data parsers
│   ├── templates/         # Template engine
│   └── utils/             # Utility functions
├── templates/             # Resume templates
│   ├── modern/            # Modern template
│   ├── classic/           # Classic template
│   └── minimal/           # Minimal template
├── data/                  # Resume data files
│   ├── examples/          # Example resumes
│   └── schemas/           # JSON schemas
├── output/                # Generated resumes
├── tests/                 # Test suite
├── config/                # Configuration files
└── scripts/               # Automation scripts
```

## Quick Start

### Installation

```bash
pip install -r requirements.txt
```

### Usage

```bash
# Generate resume from data file
python src/main.py --data data/my-resume.json --template modern --format pdf

# Generate all formats
python src/main.py --data data/my-resume.json --all

# Interactive mode
python src/main.py --interactive
```

## Configuration

Edit `config/config.yaml` to customize:
- Default templates
- Output settings
- AI integration
- Styling preferences

## Development

```bash
# Run tests
pytest tests/

# Lint code
flake8 src/

# Format code
black src/
```

## Documentation

See `000-docs/` for complete documentation following the 6767 standard.

## License

MIT
