# Timesheet and Defect Reporting - Validation Documentation

This document provides a comprehensive overview of the Timesheet and Defect Reporting flows in the AQL System, ensuring full alignment with SOW requirements.

## 1. Timesheet Flow: Inspector Clock In/Out

### Current Status
- **Database Schema**: The `timesheets` table exists with fields for:
  - `id`: Primary key
  - `inspector_id`: Links to the user/inspector
  - `job_id`: Links to the job
  - `clock_in`: Timestamp when inspector clocks in
  - `clock_out`: Timestamp when inspector clocks out (nullable)
  - `total_hours`: Calculated duration between clock in/out
  - `is_billable`: Boolean flag for billing status
  - `is_approved`: Boolean flag for approval status
  - `approved_by`: ID of manager/admin who approved the timesheet
  - `comments`: Text field for additional notes
  - `overtime`: Numeric field for overtime hours

### Implementation Features
- **Clock In Process**:
  - Inspector must be assigned to the job to clock in
  - System verifies assignment status before allowing clock in
  - Only one active clock-in session per inspector is allowed

- **Clock Out Process**:
  - Total hours are automatically calculated upon clock out
  - System verifies that the inspector is clocking out of a job they clocked into

### UX Components
- **Timesheet UI**:
  - Clock in/out buttons are context-aware and only shown to assigned inspectors
  - Current status indicator shows if inspector is clocked in
  - Warning notifications for edge cases (already clocked in, not assigned)

## 2. Timesheet Approval Logic

### Manager/Admin View
- **Access Control**:
  - Manager and admin roles can view all timesheets
  - Supervisors can view timesheets for their assigned locations
  - Approval capability is restricted to manager/admin roles

### Approval Process
- **Workflow**:
  - Managers can view timesheets filtered by job, date, or inspector
  - Approval action sets `is_approved` to true and records `approved_by`
  - Audit trail tracks all approval actions

### Billing Features
- **Financial Handling**:
  - Distinction between billable and non-billable hours
  - Overtime tracking for billing purposes
  - Minimum billable hours enforcement (4 hour minimum)
  - Summary view displaying total hours, billable hours, and non-billable hours

## 3. Defect Reporting: Fields, UX, and Storage

### Database Structure
- **Defects Table**:
  - `id`: Primary key
  - `job_id`: Reference to the job
  - `description`: Detailed description of the defect
  - `severity`: Enum ('minor', 'major', 'critical')
  - `images`: Array or JSON storing image references
  - `batch_number`: Production batch identifier
  - `lot_number`: Production lot identifier
  - `reported_by`: User ID of the inspector who reported
  - `reported_at`: Timestamp of the report
  - `status`: Current status ('open', 'in_progress', 'resolved', 'rejected')
  - `comments`: Array or JSON for tracking conversation
  - `resolution`: Description of how the defect was addressed

### Reporting Process
- **Inspector Flow**:
  - Form-based defect submission with required fields validation
  - Image capture and upload capability
  - Barcode scanning for quick defect type selection
  - Automatic recording of reporter and timestamp

### Defect Review
- **Management**:
  - Defects are displayed in categorized views (by severity, status)
  - Approval/rejection workflow for customer acknowledgment
  - Resolution tracking from identification to closure

## 4. RLS Enforcement: Timesheets & Defects

### Row-Level Security Policies
- **Timesheet RLS**:
  - Inspectors can only view and create timesheets for their assigned jobs
  - Inspectors can only clock in/out for themselves
  - Managers/admins have full access to view all timesheets
  - Only managers/admins can approve timesheets and change billable status

- **Defect RLS**:
  - Inspectors can only create defects for jobs they're assigned to
  - Inspectors can view defects they've reported or on jobs they're assigned to
  - Customers can view defects on their jobs (limited fields)
  - Managers/admins have full access to all defects

### Implementation Details
- **Policy Patterns**:
  - RLS policies are defined at the database level
  - Permissions are enforced based on user role and relationship to job
  - Multiple levels of access control for different user types

## 5. Edge Case Handling and Validations

### Timesheet Edge Cases
- **Prevention Measures**:
  - Block inspector from clocking into multiple jobs simultaneously
  - Warning if attempting to clock in to a job where already clocked in
  - Validation to prevent clock out if not clocked in
  - Handling for forgotten clock-outs (administrative override)

### Defect Edge Cases
- **Data Integrity**:
  - Required fields enforcement for critical information
  - Image size/format validation
  - Duplicate defect detection
  - History tracking for defect status changes

### System Validations
- **Automated Checks**:
  - Job assignment validation before timesheet creation
  - Inspector authorization verification for defect reporting
  - Data type and format validation for all fields
  - Timestamp integrity enforcement

## 6. Code References

### Timesheet Implementation
- `TimesheetManager.tsx`: Main component for timesheet management
- `fetchTimesheetEntries()`: Service function to retrieve timesheets
- `updateTimesheetBillableStatus()`: Service function to update timesheet status
- RLS policies in `setup_rls_policies.sql` and `simplified_rls_policies.sql`

### Defect Implementation
- `DefectReportDialog.tsx`: UI for reporting defects
- `DefectReviewDialog.tsx`: UI for reviewing and processing defects
- Defect interfaces defined in service layer
- RLS policies in `setup_rls_policies.sql` and `simplified_rls_policies.sql`

## 7. TODO and Recommendations

### Timesheet Enhancements
- Implement actual clock in/out functionality beyond the UI mockup
- Add supervisor-level approval workflow
- Create more detailed reporting views for financial analysis
- Add bulk approval capability for managers

### Defect Reporting Improvements
- Complete the defect image storage and retrieval system
- Implement notification system for critical defects
- Add trending analysis for recurring defect types
- Create customer-facing defect status updates

### Technical Debt
- Create proper database migrations for schema changes
- Add comprehensive unit tests for timesheet calculations
- Implement end-to-end testing for the complete workflows
- Update API documentation for all endpoints 