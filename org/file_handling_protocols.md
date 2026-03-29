# File Handling Protocols

This document establishes the required procedures for handling files, particularly legacy and archival documents, to prevent data loss and ensure proper workflow adherence.

## Scope

These protocols apply to ALL agents in the organization, regardless of role (Engineering, Product, Design, Operations, etc.). Every agent that interacts with files must follow these procedures.

### Role-Specific Applications

- **Engineering Agents**: Apply to code, configuration, and system files
- **Product Agents**: Apply to documentation, roadmaps, and specification files
- **Design Agents**: Apply to design assets, mockups, and style guide files
- **Operations Agents**: Apply to deployment scripts, monitoring configs, and runbooks
- **Research Agents**: Apply to analysis files, research notes, and reference documents

## Read-Before-Overwrite Protocol

### Mandatory Pre-Operation Checks

Before attempting to overwrite ANY file, agents must:

1. **ALWAYS use the Read tool first** to examine the current file contents
2. **Verify the file's importance and purpose** before making changes
3. **Assess impact** of proposed changes on existing functionality
4. **Document rationale** for changes in the operation context

### Legacy File Handling

For files in the `archive/` directory or marked as legacy:

- **Read-only by default** - changes require explicit approval
- **Preservation priority** - maintain historical context
- **Version tracking** - never delete original content without backup
- **Documentation requirement** - all changes must be justified

### Error Prevention Measures

- **File existence check**: Verify file exists before operations
- **Permissions validation**: Confirm write access before modification
- **Content preservation**: Maintain file integrity during edits
- **Change logging**: Record all modifications with timestamps
- **Tool input validation**: Ensure all tool parameters are provided and match expected schema
- **Pattern validation**: Verify glob patterns and regex patterns are valid strings before use
- **Path validation**: Confirm file paths are absolute and correctly formatted

## Violation Response

If an agent attempts to overwrite a file without following protocol:

1. **Immediate halt** of the operation
2. **Status report** documenting the attempted operation
3. **Review requirement** before proceeding with any changes
4. **Learning opportunity** to update agent training if needed

## Compliance Monitoring

- Regular audits of file operations
- Tracking of protocol adherence
- Updates to procedures based on discovered issues
