# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5c98615d-1d37-40d8-b28e-a11db79d9718

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5c98615d-1d37-40d8-b28e-a11db79d9718) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5c98615d-1d37-40d8-b28e-a11db79d9718) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

# AQL System - Inspector Management & Job Assignment Update

This update enhances the inspector registration, job assignment, and filtering functionality in the AQL system. The changes improve data consistency and provide better user experience for both managers and inspectors.

## 1. Inspector Signup Enhancements

- **Profile Creation**: Updated SignupInspector component to insert inspector profiles with proper role information into the `profiles` table
- **Error Handling**: Added robust error handling for profile creation failures
- **User Experience**: Added loading states, visual feedback, and better error messages
- **Data Persistence**: Store user ID in localStorage after signup for seamless login experience

## 2. Job Assignment System

- **Inspector Selection**: Updated JobCreationForm to include inspector selection dropdown
- **ID-Based Assignment**: Jobs now store the inspector's user_id in the `inspector_id` field
- **Location-Based Filtering**: Inspectors are filtered by location to show only relevant options
- **Data Integrity**: Both `inspector` (name) and `inspector_id` fields are maintained for compatibility

## 3. Inspector-Specific Job Filtering

- **User-Based Filtering**: InspectorView now filters jobs by matching `inspector_id` to current user
- **Status Filtering**: Jobs are additionally filtered by appropriate status values
- **Visibility Control**: Ensures inspectors only see jobs assigned to them

## 4. Inspector Name Display

- **Profile Lookup**: JobTable component now fetches inspector profiles on mount
- **Name Resolution**: Maps `inspector_id` to actual inspector names for display
- **Fallback Handling**: Falls back to legacy `inspector` field or "Unassigned" as needed

## 5. Authentication & User Identification

- **User ID Storage**: Login and Signup pages now store user ID in localStorage
- **Role-Based Experience**: System behavior adapts based on user role and ID
- **Cross-Component Consistency**: User identification is consistent across all components

## Future Improvements

- Implement real-time updates when jobs are assigned to inspectors
- Add notification system for new job assignments
- Enhance the inspector profile management system
- Add inspector performance metrics tracking

## Technical Notes

This implementation supports both the new schema (using `profiles` table with `user_id` and `role`) and the legacy schema (using `inspectors` table).

## AQL System - Inspector Assignment by Location Update

This update enhances the inspector assignment functionality by adding location-based filtering. The changes ensure that managers can only assign inspectors who are located at the same facility as the job, improving logistics and operational efficiency.

### Key Improvements

1. **Location-Based Inspector Filtering**:
   - When assigning inspectors to jobs, the system now filters the available inspectors by matching the job's location
   - Only inspectors from the same location as the job are displayed in the assignment dropdown
   - This prevents mistakenly assigning inspectors to jobs at different locations

2. **Enhanced Data Consistency**:
   - Added `location_id` field to the Job interface for explicit location tracking
   - Improved database queries to fetch inspectors by location from both new and legacy tables
   - Maintained backward compatibility with existing jobs and inspectors

3. **Improved User Experience**:
   - Loading state added to the inspector assignment dialog while fetching inspectors
   - Better error handling for location and inspector data retrieval
   - Clearer user feedback about the location-based filtering

### Technical Implementation

The update includes:
- A new `getInspectorProfilesByLocation` function in `supabaseService.ts` that retrieves inspectors by location
- Updates to the `StaffAssignmentDialog` component to filter inspectors by location
- Enhanced `assignInspector` function that captures and stores location data
- Updated Job interface with location_id field

This implementation supports both the new schema using the profiles table and the legacy schema using the inspectors table.

## AQL System - Location-Based Architecture Update

This update finalizes the location-based architecture in the AQL system, ensuring that location data is properly connected across all components. These enhancements create a more cohesive and reliable location-based workflow for job management and inspector assignment.

### Key Components Updated

1. **Job Creation Form**:
   - Enhanced to include a location dropdown that fetches options from the locations table
   - Stores the selected `location_id` in the job form data
   - Adds debug information to verify the selected location during job creation
   - Uses the selected location to filter available inspectors

2. **Job Data Storage**:
   - Updated the `createJob` function to explicitly include the `location_id` field
   - Added development mode logging to verify location data during job creation
   - Ensured the `location_id` is preserved when jobs are saved to storage

3. **Inspector Assignment Modal**:
   - Improved to fetch inspectors based on the job's location
   - Added warning message when attempting to assign inspectors from different locations
   - Enhanced debug information to verify the connection between job location and inspector location

4. **Enhanced Data Consistency**:
   - Standardized the use of `location_id` across all components
   - Added logging to verify location connections between jobs and inspectors
   - Maintained backward compatibility with existing data

### Technical Implementation

This update completes the location-based architecture by:
- Ensuring proper `location_id` connections across all tables
- Implementing clear user interface elements to select and display locations
- Adding verification and warning systems to prevent location mismatches
- Including comprehensive debug logging during development

These improvements significantly enhance the operational logistics of the AQL system, ensuring that inspectors are properly assigned to jobs in their vicinity, reducing travel time and improving efficiency.

## AQL System - Admin Location Management Feature

This update adds a comprehensive admin panel for managing official AQL facility locations. The new location management system provides administrators with a centralized interface to view and add official locations, ensuring data integrity and consistency across the application.

### Key Features

1. **Admin Settings Page**:
   - Created a new dedicated Settings page accessible only to admin users
   - Implemented role-based access control to protect administrative functions
   - Organized settings into intuitive tabs for different types of configuration

2. **Location Management**:
   - Built a LocationsManager component that lists all official AQL facility locations
   - Added functionality to view locations sorted by location number
   - Implemented ability to add new official locations with proper validation
   - Displayed formatted location information in a clean, tabular format

3. **Location Data Integrity**:
   - Added validation to prevent duplicate location numbers
   - Implemented error handling for all location operations
   - Provided visual feedback on successful operations with toast notifications
   - Ensured consistent formatting of location displays across the application

4. **User Experience Enhancements**:
   - Added loading states during data fetching operations
   - Implemented responsive design for both desktop and mobile views
   - Added preview of location format during creation
   - Included helpful descriptions and warnings to guide administrators

### Technical Implementation

The location management system includes:
- A secure admin-only Settings page with role-based access control
- A reusable LocationsManager component for viewing and adding locations
- Integration with the Supabase database through the `supabaseService.ts` functions
- Consistent formatting of location displays using the `formatLocationDisplay` function

This feature ensures that all AQL facility locations are properly managed and consistently displayed throughout the application, improving data quality and operational clarity.

# AQL System Enhancement

## Job Number Generation System

The AQL system now implements a structured job number generation system that creates unique identifiers for each job based on location, sequence, and revision. This enhances traceability and organization across the inspection process.

### Format

Job numbers follow this format: `{location_number}-{sequence}-{revision}`

- **location_number**: A numeric identifier for the location (1-99)
- **sequence**: A sequential number that increments for each new job at a specific location
- **revision**: Starts at 1 for new jobs and increments each time a job is edited

### Implementation Details

1. A new `job_counter` table in Supabase tracks the next sequence number for each location
2. When a user selects a location during job creation, the system:
   - Retrieves the next sequence number from the `job_counter` table
   - Creates a job number in the format `{location_number}-{sequence}-{revision}`
   - Displays the job number in the form as a read-only field
   - Increments the sequence counter after job creation

3. When a job is edited, the system:
   - Maintains the location and sequence numbers
   - Increments the revision number
   - Updates the job number to reflect the new revision

### Benefits

- **Traceability**: Each job has a unique, structured identifier
- **Location-Based Organization**: Numbers reflect the job's location
- **Revision Tracking**: Changes to jobs are tracked through revision numbers
- **Sequential Ordering**: Jobs are numbered sequentially within each location
- **Consistency**: Standardized format across all jobs in the system

### Key Components

- `getNextJobSequence`: Gets the next sequence number for a location
- `incrementJobSequence`: Increments the sequence after job creation
- `generateJobNumber`: Creates the formatted job number string
- `updateJobWithRevision`: Updates job revision numbers during edits

This system ensures that all jobs have meaningful, structured identifiers that provide important information at a glance and maintain a clear history of job revisions.

## Database Setup Instructions

This section provides instructions for setting up the required database tables for the AQL system, specifically the `locations` table with official AQL locations and the `job_counter` table used for job number generation.

### Prerequisites

1. Ensure you have Node.js installed
2. Create or update your `.env` file in the project root with valid Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   These values can be found in your Supabase project dashboard under Project Settings > API.

3. Install required dependencies:
   ```bash
   npm install dotenv @supabase/supabase-js
   ```

### Setting Up the Locations Table

The AQL system requires a properly structured `locations` table with official location data. We've provided a utility script to help with this setup:

1. Run the following command to check and update the locations table:
   ```bash
   npm run update-locations
   ```

2. The script will:
   - Check if the `locations` table exists and has the correct schema
   - Verify if the required fields are present (`location_number` and `name`)
   - Insert or update the official AQL locations
   - Report on the changes made

If the table needs schema modifications that can't be done via the JavaScript client, the script will provide instructions for manual updates through the Supabase dashboard.

### Setting Up the Job Counter Table

The job number generation system requires a `job_counter` table to track sequence numbers. Use our utility script to check and set up this table:

1. Run the following command:
   ```bash
   npm run setup-job-counter
   ```

2. The script will:
   - Check if the `job_counter` table exists
   - Verify if it has the correct schema
   - Display current counter entries if they exist
   - Provide SQL statements for manual creation if the table doesn't exist

### Manual Database Setup (if needed)

If the automated scripts aren't sufficient, you can manually execute the following SQL in the Supabase SQL Editor:

```sql
-- Create or update locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location_number INTEGER NOT NULL UNIQUE,
  address TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_counter table
CREATE TABLE IF NOT EXISTS job_counter (
  location_number INTEGER PRIMARY KEY,
  next_sequence INTEGER NOT NULL DEFAULT 1
);

-- Add RLS Policy
ALTER TABLE job_counter ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Authenticated users can read job_counter" ON job_counter
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to insert/update
CREATE POLICY "Service role can insert job_counter" ON job_counter
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Service role can update job_counter" ON job_counter
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
```

### Verifying the Setup

After running the setup scripts, you can verify the configuration:

1. Check the Supabase dashboard to ensure tables exist with the correct schema
2. Run the update scripts again to confirm no further changes are needed
3. Test the job creation process to confirm job numbers are generated correctly

These database tables are essential for the proper functioning of the location-based architecture and job number generation system in the AQL application.

### Summary of Database Features

This implementation includes the following database features for the AQL system:

1. **Official Locations Management**:
   - Comprehensive set of 74 official AQL locations with standardized location numbers
   - Location display formatting consistently used across the application
   - Location-based filtering for inspectors and other data

2. **Job Number Generation System**:
   - Location-based job numbering with sequential tracking
   - Revision tracking for job modifications
   - Proper formatting of job numbers in the pattern `{location_number}-{sequence}-{revision}`

3. **Utility Scripts**:
   - `npm run update-locations`: Updates the locations table with official AQL locations
   - `npm run setup-job-counter`: Checks and provides guidance for the job counter table setup

4. **Required Database Tables**:
   - `locations`: Stores official AQL locations with location numbers
   - `job_counter`: Tracks sequential job numbers per location
   - Row-level security policies to control access to sensitive data

These database features provide a robust foundation for the location-based job management system, ensuring data integrity and consistent job number generation throughout the application.
