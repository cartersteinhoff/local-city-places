# Product & Functional Documentation

This directory contains Product Requirements Documents (PRDs) and Functional Requirements Documents (FRDs) for the Local City Places platform.

## Quick Links

- [PRD Template](./templates/prd-template.md) - Use this when defining a new feature
- [FRD Template](./templates/frd-template.md) - Use this when specifying technical requirements

## Documented Features

| Feature | PRD | FRD | Status |
|---------|-----|-----|--------|
| [GRC System](./features/grc-system/) | [PRD](./features/grc-system/prd.md) | [FRD](./features/grc-system/frd.md) | Implemented |

## When to Create Documentation

### Create a PRD when:
- Starting a new feature that affects users
- Making significant changes to existing functionality
- The feature involves multiple stakeholders
- You need to align on "what" before diving into "how"

### Create an FRD when:
- The feature involves database changes
- Multiple API endpoints are needed
- Complex business logic needs to be documented
- Other developers will implement or maintain the feature

### Skip documentation when:
- Making minor bug fixes
- Small UI tweaks
- Refactoring without behavior changes

## Document Lifecycle

```
1. Draft    → Initial creation, gathering requirements
2. Review   → Stakeholder feedback incorporated
3. Approved → Ready for implementation
4. Active   → Currently being implemented
5. Complete → Feature shipped, doc serves as reference
```

## Best Practices

1. **Keep docs updated** - Update the FRD when implementation diverges from spec
2. **Link to code** - Reference specific file paths and line numbers
3. **Be specific** - Vague requirements lead to misaligned implementations
4. **Include examples** - Show sample API requests/responses, UI mockups
5. **Document decisions** - Capture why choices were made, not just what

## Directory Structure

```
/docs
├── README.md                 # This file
├── templates/
│   ├── prd-template.md       # PRD template
│   └── frd-template.md       # FRD template
└── features/
    └── {feature-name}/
        ├── prd.md            # Product requirements
        └── frd.md            # Functional requirements
```
