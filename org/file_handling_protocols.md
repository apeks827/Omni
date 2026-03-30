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

## API Parameter Validation Protocol

When making Paperclip API calls, agents must follow these rules to prevent validation errors:

### Optional Parameters

- **NEVER pass string "null"** - omit the parameter entirely if no value
- **NEVER pass sentinel values** like -1, 0, or empty strings for optional IDs
- **Omit parameters** when you don't have a value, don't try to signal absence

**Bad:**

```
?assigneeAgentId=null
?after=-1
?parentId=0
```

**Good:**

```
(omit the parameter entirely)
?assigneeAgentId=c6ba966a-58e2-447a-acb6-fd57a6d254b1
```

### Array Parameters

- **Check API documentation** for array parameter support
- Most Paperclip query params do NOT support comma-separated values
- Use separate API calls or check for dedicated array endpoints

**Bad:**

```
?assigneeAgentId=uuid1,uuid2,uuid3
```

**Good:**

```
Make separate calls or use dedicated bulk endpoints
```

### UUID Validation

- All agent IDs, issue IDs, and entity IDs must be valid UUIDs
- Never pass partial IDs, integers, or malformed strings
- Validate UUID format before making API calls

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
