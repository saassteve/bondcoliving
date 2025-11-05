# Coworking Pass Availability & Capacity Management System

## Overview

A comprehensive system for managing coworking pass availability and capacity limits. Admins can now control when passes are available for booking and limit the number of concurrent active passes.

## Key Features

### 1. Capacity Management
- **Max Capacity**: Set maximum number of concurrent passes that can be active
- **Current Capacity**: Automatically tracked based on active bookings
- **Real-time Updates**: Capacity updates automatically when bookings are created, cancelled, or expire
- **Visual Indicators**: Progress bars show capacity utilization with color coding:
  - Green: 0-69% capacity
  - Yellow: 70-89% capacity
  - Red: 90-100% capacity

### 2. Date-Based Availability
- **Simple Date Ranges**: Set available_from and available_until dates for passes
- **Complex Schedules**: Create multiple availability windows (e.g., January-February, April-May)
- **Priority System**: Handle overlapping schedules with priority levels
- **Next Available Date**: System automatically calculates when passes become available

### 3. Public-Facing Features
- **Availability Status**: Customers see real-time availability on the coworking page
- **Capacity Indicators**: Shows remaining spots for capacity-limited passes
- **Clear Messaging**: Informative messages explain why passes are unavailable
- **Smart Booking Flow**: Validates availability before allowing checkout

## Database Schema

### New Columns on `coworking_passes`
```sql
- max_capacity (integer, nullable)           -- Maximum concurrent passes allowed
- current_capacity (integer, default 0)       -- Current number of active passes
- is_capacity_limited (boolean, default false) -- Whether to enforce capacity limits
- available_from (date, nullable)             -- When pass becomes available
- available_until (date, nullable)            -- When pass stops being available
- is_date_restricted (boolean, default false) -- Whether to enforce date restrictions
```

### New Table: `coworking_pass_availability_schedules`
```sql
- id (uuid, primary key)
- pass_id (uuid, foreign key)
- schedule_name (text)              -- Descriptive name
- start_date (date)                 -- Schedule start
- end_date (date)                   -- Schedule end
- max_capacity (integer, nullable)  -- Override pass capacity for this period
- priority (integer, default 0)     -- Higher priority wins for overlaps
- is_active (boolean, default true) -- Enable/disable schedule
- notes (text, nullable)            -- Admin notes
- created_at, updated_at (timestamptz)
```

## Database Functions

### `check_pass_availability(pass_id, check_date)`
Checks if a pass is available on a specific date. Returns:
```json
{
  "available": true/false,
  "reason": "available|not_yet_available|at_capacity|outside_schedule|no_longer_available",
  "message": "Human-readable explanation",
  "next_available_date": "2025-01-15",
  "pass_id": "uuid",
  "check_date": "2025-01-01"
}
```

### `get_pass_capacity(pass_id, start_date, end_date)`
Returns capacity information for a date range:
```json
{
  "pass_id": "uuid",
  "max_capacity": 10,
  "current_capacity": 7,
  "available_capacity": 3,
  "is_capacity_limited": true,
  "date_range": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  }
}
```

### `recalculate_pass_capacities()`
Recalculates current capacity for all passes based on active bookings. Useful for:
- Fixing capacity sync issues
- Initial setup
- Data verification

### `update_pass_capacity()` (Trigger Function)
Automatically updates pass capacity when bookings change. Triggers on:
- INSERT into coworking_bookings
- UPDATE of coworking_bookings
- DELETE from coworking_bookings

## Admin Interface

### Location
Navigate to: **Admin → Coworking → Passes Tab**

### Pass Management Screen
Shows all passes with:
- Current availability status
- Capacity usage (if enabled)
- Active date restrictions (if enabled)
- "Manage" button for each pass

### Pass Configuration Modal
Four tabs for comprehensive management:

#### 1. Basic Info
- View pass name, price, duration
- Quick overview of pass details

#### 2. Capacity Settings
- **Enable/Disable Capacity Limiting**: Toggle capacity enforcement
- **Max Capacity**: Set maximum concurrent passes
- **Current Status**: Visual display of capacity usage
- **Recalculate Button**: Manually sync capacity with bookings
- **Warnings**: Alerts when approaching capacity limits

#### 3. Date Restrictions
- **Enable/Disable Date Restrictions**: Toggle date enforcement
- **Available From**: Set when pass becomes bookable (optional)
- **Available Until**: Set when pass stops being bookable (optional)
- **Preview**: See the configured date range

#### 4. Schedules
- **Create Schedules**: Define complex availability patterns
- **Schedule Properties**:
  - Name (e.g., "Summer 2025")
  - Start and End dates
  - Capacity override (optional)
  - Priority level
  - Admin notes
- **Manage Existing**: Edit, activate/deactivate, or delete schedules
- **Visual Display**: See all schedules with status indicators

## Public Experience

### Coworking Page (/coworking)
- **Real-time Availability**: Each pass shows current availability status
- **Capacity Indicators**: Shows "X spots remaining" for limited passes
- **Progress Bars**: Visual representation of remaining capacity
- **Unavailable Passes**: Clear messaging with reasons:
  - "Available from [date]" for not-yet-available passes
  - "Fully booked" for at-capacity passes
  - "Next available [date]" when applicable

### Booking Page (/coworking/book)
- **Pre-checkout Validation**: Checks availability before payment
- **Smart Error Messages**: Explains why booking failed
- **Alternative Suggestions**: Shows next available dates
- **Real-time Feedback**: Validates as user selects dates

## Use Cases

### Example 1: Limited Spots for Beta Launch
**Scenario**: Launching coworking with 10 desk spaces

**Setup**:
1. Go to Passes tab in Admin Coworking
2. Select "Monthly Hot Desk" pass
3. Click "Manage"
4. Go to Capacity tab
5. Enable capacity limiting
6. Set max capacity to 10
7. Save

**Result**:
- Customers see "X spots remaining"
- Booking stops at 10 active passes
- Admin gets warning at 90% capacity

### Example 2: Seasonal Availability
**Scenario**: Only offer coworking during winter season (Nov-Mar)

**Setup**:
1. Select pass and click "Manage"
2. Go to Date Restrictions tab
3. Enable date restrictions
4. Set available_from: November 1
5. Set available_until: March 31
6. Save

**Result**:
- Pass hidden or marked unavailable outside date range
- Customers see "Available from November 1"
- Automatic availability on November 1

### Example 3: Multiple Availability Windows
**Scenario**: Available Jan-Feb and April-May with different capacities

**Setup**:
1. Select pass and click "Manage"
2. Go to Schedules tab
3. Create schedule "Winter Window":
   - Start: January 1
   - End: February 28
   - Max capacity: 15
4. Create schedule "Spring Window":
   - Start: April 1
   - End: May 31
   - Max capacity: 20
5. Save both schedules

**Result**:
- Pass available during both windows
- Different capacity limits per season
- Unavailable in March
- Automatic transitions between periods

## Best Practices

### Capacity Management
1. **Set Conservative Limits**: Start lower and increase if needed
2. **Monitor Usage**: Check capacity reports regularly
3. **Buffer Space**: Consider setting max capacity slightly below physical limit
4. **Recalculate Periodically**: Use recalculate function monthly for verification

### Date Restrictions
1. **Plan Ahead**: Set future availability dates well in advance
2. **Communicate Changes**: Notify existing customers of availability changes
3. **Use Schedules for Complexity**: Simple date ranges for basic needs, schedules for complex patterns
4. **Priority Levels**: Use priority 0 for normal, higher numbers for special overrides

### Schedule Management
1. **Descriptive Names**: Use clear names like "Summer 2025" not "Schedule 1"
2. **Avoid Gaps**: Ensure continuous availability or intentional gaps
3. **Document Decisions**: Use notes field to explain schedule reasoning
4. **Test Before Launch**: Verify availability checks work as expected

### Capacity Synchronization
1. **Trigger Reliability**: System automatically updates on booking changes
2. **Manual Sync**: Use recalculate button if capacity seems incorrect
3. **Booking Status Matters**: Only 'confirmed' and 'active' bookings count toward capacity
4. **Expired Bookings**: Past bookings don't affect current capacity

## Technical Details

### Capacity Calculation Logic
```sql
Current capacity = COUNT of bookings WHERE:
  - pass_id matches
  - booking_status IN ('confirmed', 'active')
  - end_date >= TODAY
```

### Availability Check Logic
1. Check if pass is active
2. If date restrictions enabled:
   - Check simple date range (available_from/until)
   - Check active schedules for date overlap
   - Find highest priority schedule if multiple
3. If capacity limits enabled:
   - Get max capacity (from schedule or pass)
   - Count overlapping active bookings
   - Compare current vs max capacity
4. Return availability result with reason

### Performance Considerations
- Database indexes on date ranges and capacity fields
- Efficient queries using WHERE clauses
- Automatic trigger updates prevent stale data
- Caching opportunities at service layer

## Troubleshooting

### Capacity Not Updating
**Issue**: Capacity shows incorrect number
**Solution**:
1. Go to Capacity tab
2. Click "Recalculate Capacity"
3. Verify booking statuses are correct

### Pass Not Appearing on Public Page
**Check**:
- Is pass marked as active?
- Is it within date restrictions?
- Has capacity been exceeded?
- Are there active schedules covering today?

### Booking Failing Despite Availability
**Check**:
- Browser console for error messages
- Admin panel for pass configuration
- Database functions are working
- Edge function validation logic

### Schedule Conflicts
**Issue**: Multiple schedules overlap
**Solution**:
- Use priority field (higher number wins)
- Deactivate conflicting schedules
- Adjust date ranges to prevent overlap

## Migration Notes

### Applied Migration
`20251105151341_add_coworking_pass_availability.sql`

### Safe Rollback
To disable features without data loss:
1. Set is_capacity_limited = false on all passes
2. Set is_date_restricted = false on all passes
3. Schedules remain but aren't enforced

### Data Migration
Existing passes automatically get:
- current_capacity = 0 (recalculated on first use)
- is_capacity_limited = false
- is_date_restricted = false
- No restrictions until explicitly configured

## Future Enhancements

Potential additions:
- Waitlist functionality for full passes
- Email notifications when capacity opens
- Advanced analytics and forecasting
- Automated capacity adjustments
- Integration with calendar systems
- Customer-facing availability calendar
- Bulk schedule operations
- Schedule templates
