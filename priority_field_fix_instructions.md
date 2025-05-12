# Fixing the Priority Field Enum Issue

You're encountering this error:
```
invalid input value for enum job_priority: "Medium"
```

This means that the `priority` field in your database is set up as an enum type called `job_priority`, but "Medium" is not one of the allowed values in that enum.

## The Fix

We've created two solutions to fix this issue:

### 1. Fix the Database Schema (Recommended)

Run the SQL script `fix_priority_field.sql` in your Supabase SQL Editor. This script will:

- If the `job_priority` enum exists:
  - Add "Medium", "High", and "Low" values to the enum if they don't already exist
- If the enum doesn't exist or can't be modified:
  - Convert the priority column to text type, which can accept any value

This is the most robust solution as it fixes the issue at the database level.

### 2. Update the Code to Handle Different Priority Formats

We've also updated the `sanitizeJobForStorage` function in `src/services/aqlService.ts` to:

- Normalize priority values to proper capitalization
- Map common priority values to their correctly capitalized versions
- Default to "Medium" for unrecognized values
- Ensure a priority is always present

This code change works with both enum and text column types.

## Testing the Fix

After applying the database fix and code changes:

1. Try creating a job with different priority values ("high", "medium", "low")
2. Check the database to verify the jobs are being created correctly
3. Verify that no more enum-related errors appear in the console

## Common Priority Values

These are the priority values that our updated code will handle:

- High
- Medium (default)
- Low
- Urgent
- Critical

If you need to add additional priority levels, you can:
1. Update the `priorityMap` in the `sanitizeJobForStorage` function
2. If using the enum type, add those values to the enum using:
   ```sql
   ALTER TYPE job_priority ADD VALUE 'NewPriority';
   ```

## Troubleshooting

If you're still seeing enum errors:

1. Check if any other code is directly setting the priority value
2. Ensure the database changes were applied successfully
3. Verify that all code using the priority field is updated

You can also temporarily convert the priority field to a text type for maximum flexibility:
```sql
ALTER TABLE public.jobs ALTER COLUMN priority TYPE text;
``` 