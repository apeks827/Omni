# Enhanced Error Codes for Platform Integration Failures

**Owner:** Backend Engineer  
**Created:** 2026-03-31  
**Status:** In Progress  
**Priority:** Medium  

## Overview

This task implements enhanced error codes for handling platform integration failures.

## Implementation Details

### 1. New Platform Error Codes
Added to `src/utils/errors.ts`:
- `PLATFORM_ASSIGNEE_AGENT_ID_ERROR` - For assigneeAgentId field 500 errors  
- `PLATFORM_EXECUTION_LOCK_ERROR` - For execution lock conflicts
- `PLATFORM_API_ERROR` - Generic platform API error handler

### 2. Specialized Error Classes
Created specialized error classes that extend AppError with descriptive messages.

### 3. Integration Points
Error capture middleware updated to recognize new error codes for structured logging.
