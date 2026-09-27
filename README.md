# HomeBase Manager

Build a complete, production-ready Property & Tenant Management System for landlords and property managers.

The system should allow a landlord/property manager to manage properties, houses, rooms, tenants, rent payments, electricity bills, water bills, maintenance requests, contracts, notifications, and financial reports from one modern web application.

1. PRODUCT NAME

Use the name:

NyumbaPro — Property & Tenant Management System

Create a clean, professional, modern dashboard suitable for landlords and property managers in Tanzania.

Use Tanzanian Shillings (TZS) as the default currency.

The application must be responsive and work properly on:

Desktop

Laptop

Tablet

Mobile phone

2. TECHNOLOGY STACK

Use a modern production-ready stack supported by Lovable.

Preferred:

React

TypeScript

Tailwind CSS

Modern component library

Supabase for backend

PostgreSQL database

Supabase Authentication

Supabase Storage where needed

Use a clean modular architecture.

Do not create fake static functionality.

All important features must be connected to the database and persist after refresh.

3. USER ROLES

Create role-based access control.

Landlord / Admin

Can:

Create properties

Create houses/buildings

Create rooms

Add tenants

Assign tenants to rooms

Record rent

Record electricity purchases

Record water payments

Manage maintenance

Manage contracts

View reports

View financial summaries

Manage notifications

Manage system settings

Property Manager

Can manage properties assigned to them.

Their permissions should be configurable by the landlord/admin.

Tenant

Tenants should have their own dashboard.

They can:

View their room

View rent amount

View rent payment history

View outstanding balance

View electricity purchases

View water payments

Submit maintenance requests

View maintenance status

View their contract information

Update allowed profile information

Receive notifications

Tenants must NOT be able to see information belonging to other tenants.

4. AUTHENTICATION

Create a complete authentication system.

Pages:

Login

Register

Forgot Password

Reset Password

Email verification if supported

Logout

After login:

Admin/landlord → Admin Dashboard

Property Manager → Manager Dashboard

Tenant → Tenant Dashboard

Implement protected routes.

Users must only access data allowed by their role.

5. LANDLORD DASHBOARD

Create a professional dashboard.

Display:

Property statistics

Total Properties

Total Houses/Buildings

Total Rooms

Occupied Rooms

Vacant Rooms

Rooms Under Maintenance

Financial statistics

Total Expected Rent

Rent Collected

Outstanding Rent

Electricity Payments

Water Payments

Maintenance Expenses

Net Income

Tenant statistics

Total Tenants

Active Tenants

New Tenants

Tenants with Outstanding Rent

Alerts

Show:

Overdue rent

Upcoming rent due dates

Expiring contracts

Maintenance requests

Recent electricity purchases

Recent water payments

Include charts for:

Monthly rent income

Electricity payments

Water payments

Maintenance expenses

Occupancy rate

Allow filtering by:

Property

House

Month

Year

6. PROPERTY MANAGEMENT

Create a complete property management module.

A landlord can create:

Property:

Property name

Property address

Region

District

Ward

Street

Description

Number of buildings

Property status

Example:

Property:
"Sinza Apartments"

Location:
Dar es Salaam

A property can contain multiple buildings/houses.

7. HOUSE / BUILDING MANAGEMENT

Each property can contain multiple buildings.

Fields:

Building name

Building number

Property

Description

Number of floors

Status

Example:

Property:
Sinza Apartments

Buildings:

Block A

Block B

Block C

8. ROOM MANAGEMENT

Each building can contain multiple rooms.

Fields:

Room number

Floor

Room type

Monthly rent

Deposit amount

Electricity meter number

Water meter number

Status

Room statuses:

Vacant

Occupied

Reserved

Maintenance

Display rooms using cards and/or a table.

Allow filtering by:

Property

Building

Floor

Status

9. TENANT MANAGEMENT

Create a complete tenant management system.

Tenant fields:

Full name

Phone number

Email

National ID / identification number

Gender

Date of birth

Emergency contact

Emergency contact phone

Address

Profile photo

Date joined

Status

Tenant statuses:

Active

Pending

Moved Out

Suspended

Create a detailed Tenant Profile.

Tenant profile should show:

Personal Information

Current Room

Rent Information

Contract

Rent Payment History

Electricity Purchase History

Water Payment History

Maintenance Requests

Notifications

Account Activity

10. TENANT ASSIGNMENT

Allow the landlord/admin to assign a tenant to a room.

When assigning:

Select property

Select building

Select room

Select tenant

Enter move-in date

Enter monthly rent

Enter deposit

Enter contract start date

Enter contract end date

Automatically change room status to:

Occupied

Prevent two active tenants from being assigned to the same room unless the system explicitly supports multiple occupants.

11. RENT MANAGEMENT

Create a complete rent management module.

Landlord can:

Create rent charges

Record payments

Edit payments

View payment history

Search payments

Filter by tenant

Filter by property

Filter by room

Filter by date

Filter by payment status

Rent record:

Tenant

Property

Building

Room

Amount

Month

Due date

Payment date

Payment method

Reference number

Notes

Status

Statuses:

Paid

Partially Paid

Pending

Overdue

Payment methods:

Cash

Bank

Mobile Money

Other

12. AUTOMATIC RENT BALANCE

The system must automatically calculate:

Expected rent
minus
Payments made

= Outstanding balance

Example:

Monthly rent:
TZS 300,000

Paid:
TZS 200,000

Outstanding:
TZS 100,000

Do not rely on manually entered balances.

Calculate balances from database transactions.

13. ELECTRICITY MANAGEMENT

Create a dedicated electricity module.

Each tenant can have an electricity meter.

Fields:

Tenant

Property

Building

Room

Meter number

Purchase date

Amount

Units/kWh if available

Token number

Transaction/reference number

Payment method

Receipt

Notes

Example:

Tenant:
John Michael

Room:
A-04

Electricity purchase:

05 September 2026
TZS 30,000
Token: ********
Reference: ELEC-1042

18 September 2026
TZS 20,000

Monthly electricity total:

TZS 50,000

14. WATER MANAGEMENT

Create a dedicated water module.

Fields:

Tenant

Property

Building

Room

Meter number

Payment date

Amount

Units/volume if available

Reference number

Payment method

Receipt

Notes

Display:

Current month water payments
Previous payments
Total water cost

15. ELECTRICITY AND WATER HISTORY

Inside every tenant profile show:

Electricity

Date

Amount

Units

Meter

Token/reference

Total

Water

Date

Amount

Units

Meter

Reference

Total

Allow export to PDF/CSV if supported.

16. FUTURE API INTEGRATION

Design the database and service architecture so electricity and water purchases can later be connected to external APIs.

For now support:

Manual Entry

But create a clean integration layer for future:

Electricity API

Water utility API

Mobile Money

Payment gateways

SMS providers

WhatsApp notifications

Do NOT pretend that an API is connected if it is not.

Clearly separate manual transactions from future API transactions.

17. MAINTENANCE MANAGEMENT

Create a maintenance request system.

Tenant can submit:

Category

Description

Priority

Room

Photos

Date submitted

Categories:

Electricity

Water

Plumbing

Door

Window

Internet

Security

Other

Priority:

Low

Medium

High

Urgent

Status:

Submitted

Accepted

In Progress

Completed

Rejected

Landlord can:

View request

Assign technician

Add notes

Change status

Add cost

Upload receipt

Record completion date

18. CONTRACT MANAGEMENT

Create a tenant contract module.

Contract fields:

Tenant

Property

Building

Room

Start date

End date

Monthly rent

Deposit

Contract status

Contract document

Statuses:

Active

Expiring Soon

Expired

Terminated

Show alerts when contracts are close to expiry.

Allow upload of PDF contracts using Supabase Storage.

19. MOVE-IN AND MOVE-OUT

Create tenant move-in and move-out workflows.

Move-in:

Assign room

Record deposit

Record starting meter information

Upload documents

Create contract

Move-out:

Move-out date

Final rent balance

Electricity balance if applicable

Water balance if applicable

Maintenance/damages

Refundable deposit

Final notes

After move-out:

Automatically mark room:

Vacant

20. NOTIFICATIONS

Create an internal notification system.

Notify landlord about:

New tenant

Rent payment

Overdue rent

Maintenance request

Contract expiration

Electricity transaction

Water transaction

Notify tenants about:

Rent due

Payment received

Outstanding balance

Maintenance updates

Contract expiration

Important landlord announcements

Create a notification center.

21. REMINDERS

Create automatic reminders.

Examples:

"Rent for Room A-04 is due in 3 days."

"John Michael has an outstanding balance of TZS 100,000."

"Contract for Room A-04 expires in 30 days."

Use scheduled jobs/cron where supported.

If external SMS or WhatsApp is not configured, keep reminders inside the application and provide integration-ready architecture.

22. REPORTS

Create a professional Reports module.

Reports:

Rent Report

Expected rent

Collected rent

Outstanding rent

Paid tenants

Unpaid tenants

Electricity Report

Total electricity purchases

Purchases per tenant

Purchases per property

Monthly totals

Water Report

Total water payments

Payments per tenant

Monthly totals

Maintenance Report

Total requests

Completed requests

Pending requests

Maintenance expenses

Occupancy Report

Total rooms

Occupied

Vacant

Maintenance

Financial Report

Rent income

Other income

Electricity

Water

Maintenance

Other expenses

Net income

Allow date filters.

23. RECEIPTS

Create professional digital receipts.

Rent receipt should include:

System logo/name

Receipt number

Tenant

Property

Building

Room

Amount

Payment date

Payment method

Reference

Description

Electricity and water receipts should also be available.

Allow:

Print

Download PDF if supported

24. SEARCH

Implement global search.

Search:

Tenant

Room

Property

Payment

Contract

Maintenance request

Meter number

Reference number

Search should be fast and easy to use.

25. FILTERING AND SORTING

All tables should support:

Search

Filter

Sort

Pagination

Date filtering

Status filtering

Use proper empty states.

Example:

"No tenants found."

26. DATABASE DESIGN

Create proper relational database tables.

Suggested tables:

users
profiles
roles
properties
buildings
rooms
tenants
tenant_assignments
contracts
rent_charges
rent_payments
electricity_meters
electricity_transactions
water_meters
water_transactions
maintenance_requests
maintenance_comments
maintenance_expenses
notifications
receipts
expenses
audit_logs
system_settings

Use proper foreign keys.

Use timestamps.

Use UUIDs where appropriate.

Do not duplicate data unnecessarily.

27. SECURITY

Use Supabase Row Level Security.

Important rules:

Landlords can only access their own properties and related data.

Property managers can only access properties assigned to them.

Tenants can only access their own:

Profile

Room

Rent

Electricity

Water

Contracts

Maintenance requests

Notifications

Never expose another tenant's private information.

Protect sensitive fields.

Validate all forms.

Prevent unauthorized database access from the client.

28. AUDIT LOG

Create an audit log.

Track important actions:

Tenant created

Tenant updated

Tenant deleted

Payment recorded

Payment edited

Room assigned

Contract created

Maintenance updated

User created

Store:

User

Action

Date/time

Related record

Description

29. SETTINGS

Create Settings page.

Sections:

Profile

Name

Phone

Email

Profile photo

Property settings

Rent settings

Currency

Default due date

Grace period

Notification settings

User management

Security

30. UI/UX

Use a professional modern SaaS design.

Desktop layout:

Sidebar navigation
+
Top header
+
Main content

Sidebar:

Dashboard
Properties
Buildings
Rooms
Tenants
Rent & Payments
Electricity
Water
Maintenance
Contracts
Reports
Notifications
Users
Settings

Use:

Clean cards

Tables

Charts

Modal forms

Confirmation dialogs

Toast notifications

Loading states

Error states

Empty states

Make the interface simple enough for a non-technical landlord.

31. MOBILE DESIGN

On mobile:

Sidebar becomes mobile navigation

Tables become responsive cards or horizontal scroll

Buttons remain easy to tap

Forms are mobile friendly

Dashboard cards stack properly

Do not allow content to overflow the screen.

32. TANZANIA SUPPORT

Default currency:

TZS

Use Tanzanian number formatting.

Support phone numbers such as:

+255 7XX XXX XXX

Keep architecture ready for Tanzanian payment methods and communication services.

Do not hard-code a specific payment provider unless explicitly integrated.

33. DEMO DATA

Create realistic demo data for development/testing.

Example:

Property:
Sinza Apartments

Buildings:
Block A
Block B

Rooms:
A-01
A-02
A-03
A-04

Tenants:
John Michael
Asha Ali
David Peter

Include demo rent payments, electricity purchases, water payments and maintenance requests.

Clearly distinguish demo data from production data.

34. DASHBOARD EXAMPLE

The landlord dashboard should visually communicate:

Properties: 3

Rooms: 24

Occupied: 20

Vacant: 4

Expected Rent:
TZS 5,500,000

Collected:
TZS 5,000,000

Outstanding:
TZS 500,000

Electricity:
TZS 650,000

Water:
TZS 280,000

Maintenance:
TZS 150,000

Show charts below these statistics.

35. TENANT DASHBOARD

Tenant dashboard:

Welcome, John Michael

Room:
A-04

Monthly Rent:
TZS 300,000

Current Balance:
TZS 100,000

Last Rent Payment:
TZS 200,000

Electricity This Month:
TZS 50,000

Water This Month:
TZS 10,000

Maintenance Requests:
2

Then show:

Recent payments
Electricity history
Water history
Maintenance requests
Notifications

36. IMPORTANT BUSINESS LOGIC

Implement these rules:

A room marked Occupied must have an active tenant assignment.

A tenant should not have multiple active room assignments unless explicitly supported.

When a tenant moves out, the room automatically becomes Vacant.

Rent balance must be calculated from rent charges and payments.

Payment status should update automatically.

Electricity and water transactions must be linked to the correct tenant and room.

Tenant data must be isolated using Row Level Security.

Deleting important financial records should require confirmation.

Prefer soft-delete/archive for important records.

Every financial transaction should have a unique reference/receipt number.

37. DATABASE RELATIONSHIP

Use this general relationship:

Property
→ Buildings
→ Rooms
→ Tenant Assignment
→ Tenant

Tenant
→ Contracts
→ Rent Charges
→ Rent Payments
→ Electricity Transactions
→ Water Transactions
→ Maintenance Requests
→ Notifications

Property
→ Expenses
→ Reports

38. ERROR HANDLING

The application must handle:

Failed database requests

Empty forms

Invalid amounts

Negative payments

Duplicate meter numbers

Duplicate room assignments

Unauthorized access

Network errors

Show friendly error messages.

Never show raw technical errors to normal users.

39. LOADING STATES

Every database operation should have proper loading states.

Examples:

"Saving tenant..."

"Recording payment..."

"Loading properties..."

"Generating report..."

Prevent duplicate submissions while saving.

40. FINAL REQUIREMENT

Do not build only a visual prototype.

Build the actual functional application with:

Frontend

Database

Authentication

Authorization

CRUD operations

Row Level Security

Forms

Validation

Search

Filtering

Reports

Notifications

Financial calculations

Responsive UI

Connect every feature that can reasonably be connected.

Do not create fake buttons that do nothing.

Every visible button must either work or be clearly marked as coming soon.

Before considering the project complete, test the main workflows:

Register/login

Create property

Create building

Create room

Create tenant

Assign tenant to room

Create rent charge

Record rent payment

Calculate outstanding balance

Record electricity purchase

Record water payment

Submit maintenance request

Create contract

View reports

View tenant dashboard

Test role permissions

Test mobile responsiveness

Test database persistence

Test Row Level Security

Test logout/login again

The finished application should feel like a real commercial property-management SaaS product rather than a simple demo.

Start by creating the complete application architecture, database schema, authentication, navigation and core modules. Then implement each module fully and connect everything together.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0fcaf69d-86af-49df-803a-a8b0848846a1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
