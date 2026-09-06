# UTS Smart Mobility

Build a production-quality modern website and Smart Transport Management platform for United Transport Service (UTS) Pakistan.

IMPORTANT BRAND REQUIREMENT:

Use the exact UTS logo image uploaded by the user.

Do not redesign, regenerate, recolor, distort, or replace the logo.

The uploaded logo is the official visual identity for this project.

====================================================

PROJECT GOAL

====================================================

Create a premium corporate transportation website combined with a modern Smart Transport Management product experience.

The website should communicate:

"Safe. Reliable. Smarter Transportation."

This is both:

1. A public-facing UTS corporate website

2. A foundation for a Smart Transport Management platform

IMPORTANT:

Do not falsely claim that the existing UTS public website already provides all smart features.

The smart features in this project are proposed/new digital capabilities.

====================================================

TECH STACK

====================================================

Use a modern production-ready stack.

Preferred:

React

TypeScript

Tailwind CSS

shadcn/ui

Lucide icons

Use clean component architecture.

If backend/database functionality is required, structure the application so Supabase can be integrated cleanly.

Use reusable components.

====================================================

PUBLIC WEBSITE

====================================================

Create:

/

/about

/services

/smart-transport

/fleet

/safety

/reviews

/faq

/contact

/request-transport

/login

====================================================

NAVBAR

====================================================

Create a premium sticky navbar.

Left:

Exact UTS logo

Navigation:

Home

About

Services

Smart Transport

Fleet

Safety

Reviews

Contact

CTA:

Request Transport

Secondary:

Login

On mobile:

Hamburger navigation.

====================================================

HERO

====================================================

Headline:

Safe. Reliable. Smarter Transportation.

Description:

"Professional transportation solutions enhanced by modern technology, better communication, and smarter operations."

Buttons:

Request Transport

Explore Smart Transport

Hero visual:

premium transportation vehicle + subtle route/map technology overlay.

Do not use fake live tracking.

If a map is shown, label it as:

"Smart Transport Platform Preview"

====================================================

SMART TRANSPORT

====================================================

Create a visually impressive product section.

Heading:

Transportation, Now Smarter.

Four features:

PASSENGER ATTENDANCE

Drivers can digitally record passenger attendance during daily routes.

ABSENCE NOTIFICATIONS

When a route ends, unchecked passengers can automatically be marked absent and notifications can be generated.

FEE MANAGEMENT

Transport fee records can be monitored with automated overdue reminders.

OPERATIONS DASHBOARD

Administrators can monitor routes, drivers, passengers, attendance and notifications from one place.

====================================================

DRIVER DASHBOARD

====================================================

Create route:

/driver/dashboard

Mobile-first interface.

Header:

Good Morning, Driver

Route:

NUST Morning Route

Vehicle:

Vehicle ID

Date:

Today

Passenger list.

Each passenger:

Name

Pickup Stop

Attendance toggle

Example:

Ahmed Hussain — H-12

Present

Hamza Ali — G-10

Present

Hassan Khan — F-11

Absent

Large touch-friendly controls.

Buttons:

START ROUTE

END ROUTE

When END ROUTE is clicked:

Find all passengers who were not marked present.

Mark them absent.

Create attendance records.

Trigger notification workflow:

- Create ABSENCE notification for the STUDENT.
- Absence and notifications are visible to ADMIN and SUPER_ADMIN.

Show confirmation:

"Route attendance completed."

"2 passengers marked absent."

"Notifications queued."

Make this logic idempotent so pressing END ROUTE twice does not create duplicate attendance or notifications.

====================================================

OFFLINE-FIRST DRIVER MODE

====================================================

The driver interface must support poor connectivity.

When offline:

Show:

OFFLINE MODE

Allow attendance changes.

Persist pending attendance locally.

When connection returns:

Sync pending records.

Show:

"Attendance synced successfully."

Never lose attendance data because of temporary internet failure.

====================================================

FEE MANAGEMENT

====================================================

Create:

/admin/fees

Fields:

Student

Route

Monthly Fee

Due Date

Payment Status

Statuses:

PAID

PENDING

OVERDUE

Create an automated overdue reminder architecture.

Example:

Due Date = 05 Sep

If current date > due date

AND payment status != PAID

then create reminder.

Prevent duplicate reminders for the same student and billing period.

====================================================

AUTOMATED EMAILS

====================================================

Create notification architecture that supports:

Absence notification

Fee overdue reminder

Route updates

General transport announcements

Keep email provider abstract so it can later use:

Resend

SendGrid

SMTP

Do not hardcode API keys.

Use environment variables.

====================================================

ADMIN DASHBOARD

====================================================

Create:

/admin

Dashboard cards:

Active Routes

Passengers

Drivers

Vehicles

Today's Attendance

Absent Passengers

Pending Fees

Open Complaints

Navigation:

Dashboard

Students

Drivers

Vehicles

Routes

Attendance

Fees

Notifications

Reviews

Complaints

Transport Requests

Website Content

Settings

====================================================

REVIEWS + REPUTATION MANAGEMENT

====================================================

Create:

/reviews

Users can submit:

Overall Rating

Driver Rating

Comfort

Punctuality

Cleanliness

AC

Pickup/Drop-off

Communication

Written Feedback

Do NOT generate fake reviews.

Do NOT create fake names.

Do NOT create fake ratings.

If there are no real reviews:

Display:

"Be the first to share your experience."

====================================================

COMPLAINT MANAGEMENT

====================================================

Negative feedback should NOT simply disappear.

Create:

/admin/complaints

Complaint fields:

Complaint ID

Customer

Route

Driver

Vehicle

Category

Priority

Description

Status

Created At

Resolved At

Categories:

Late Pickup

Late Drop-off

Driver Behaviour

Cleanliness

AC / Comfort

Overcrowding

Route Issue

Pickup Location

Payment / Fee

Attendance

Other

Statuses:

OPEN

IN REVIEW

RESOLVED

CLOSED

The purpose is to turn negative feedback into an operational improvement process.

Example:

Review

↓

Complaint

↓

Investigation

↓

Resolution

↓

Customer Follow-up

====================================================

REVIEW ANALYTICS

====================================================

Admin dashboard should show:

Average Rating

Driver Rating

Route Rating

Vehicle Comfort Rating

Punctuality Rating

Open Complaints

Resolved Complaints

Most Common Complaint Categories

Example insight:

"Pickup punctuality complaints increased on Route A."

This should be calculated from actual stored data.

Never fabricate analytics.

====================================================

PUBLIC UTS SERVICES

====================================================

Create service pages/cards for publicly listed UTS services:

Corporate Booking

Tourism Booking

Pick & Drop

Rent a Car

Group Transfer

Personal Booking

NUST Pick & Drop

Keep descriptions professional and concise.

====================================================

FLEET

====================================================

Create fleet categories:

Sedans

SUVs

Vans

Coasters

Buses

Luxury Vehicles

Special Purpose Vehicles

Do not invent fleet counts.

If vehicle specifications are shown, only use verified data.

====================================================

CONTACT

====================================================

Use verified UTS public contact information.

Corporate Office:

Office No. 2, Block 20-B,

Kashif Blair Plaza,

G-8 Markaz,

Islamabad, Pakistan

Phone:

051-2251642

051-2260727

Add:

Email

Contact Form

Office locations

Locations:

Islamabad

Karachi

Lahore

Quetta

Faisalabad

Multan

Sukkur

Peshawar

Saudi Arabia

Do not invent missing addresses.

====================================================

SOCIAL MEDIA FOOTER

====================================================

Build an extremely professional footer.

Use exact UTS logo.

Footer:

UTS logo + company description

Company:

About

Services

Fleet

Safety

Careers

Contact

Smart Transport:

Attendance

Notifications

Fee Management

Driver Portal

Admin Portal

Resources:

FAQ

Reviews

Privacy

Terms

Follow Us:

LinkedIn

Facebook

Instagram

YouTube

IMPORTANT:

Only link social profiles that can be verified as belonging to United Transport Service Pakistan.

Never invent usernames.

If a social profile is unavailable/unverified:

show the icon as disabled or "Coming Soon".

Do NOT link to unrelated "UTS" organizations.

====================================================

DATABASE DESIGN

====================================================

Prepare a scalable relational structure.

Tables/entities:

users

students

drivers

vehicles

routes

route_stops

route_students

attendance

fee_records

payments

notifications

notification_templates

reviews

complaints

transport_requests

Suggested roles:

SUPER_ADMIN

ADMIN

DRIVER

STUDENT

Use proper foreign keys.

Use timestamps.

Use UUIDs where appropriate.

====================================================

SECURITY

====================================================

Implement role-based access.

Driver:

Only assigned routes/passengers.

Student:

Only own information.

Admin:

Operational management.

Super Admin:

Full access.

Never expose:

Passwords

API keys

Private credentials

Internal data

Use server-side validation.

====================================================

RESPONSIVE DESIGN

====================================================

Public website:

Desktop + tablet + mobile.

Driver dashboard:

Mobile-first.

Admin dashboard:

Desktop-first but responsive.

====================================================

DESIGN

====================================================

UTS brand-inspired colors:

Deep navy

UTS blue

Bright blue

Orange

White

Neutral gray

Use:

Premium typography

Subtle shadows

Clean cards

Professional icons

Elegant spacing

Smooth transitions

Avoid:

Neon colors

Overly futuristic UI

Cartoon illustrations

Cheap gradients

Excessive animations

Generic AI-template appearance

====================================================

ANIMATIONS

====================================================

Use subtle animations:

Fade

Slide

Hover

Scroll reveal

Dashboard transitions

Keep performance high.

====================================================

SEO

====================================================

Add SEO metadata for:

United Transport Service Pakistan

UTS Pakistan

Transport Service Pakistan

Corporate Transportation Pakistan

Employee Transportation Pakistan

Pick and Drop Pakistan

Vehicle Rental Pakistan

NUST Pick and Drop

Smart Transport Management Pakistan

Add:

title

description

Open Graph

favicon

semantic HTML

alt text

====================================================

IMPORTANT DATA INTEGRITY RULE

====================================================

NEVER fabricate:

Reviews

Testimonials

Customer numbers

Vehicle counts

GPS locations

Attendance records

Driver ratings

Satisfaction percentages

Pricing

Official social media accounts

Use placeholders only where necessary and clearly label them.

====================================================

CURRENT UTS VS NEW SMART PLATFORM

====================================================

Very important.

The website must visually distinguish:

EXISTING UTS SERVICES

from:

NEW SMART TRANSPORT PLATFORM

Use a label such as:

"Smart Transport Platform — New Digital Experience"

Do not make misleading statements such as:

"UTS already provides automatic passenger attendance."

Instead say:

"Introducing digital passenger attendance."

Do not claim live GPS unless a real GPS integration is connected.

If GPS integration is not available:

"Live tracking integration coming soon."

====================================================

FINAL RESULT

====================================================

The final website should feel like:

A premium Pakistani transportation company

-

A modern SaaS transportation platform

-

A trusted enterprise service

It should be visually impressive enough for a real corporate presentation.

Prioritize:

Professionalism

Trust

UX

Performance

Mobile usability

Smart transport innovation

Operational transparency

Review/complaint management

Brand consistency

Use the uploaded UTS logo exactly.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b1e2eaf7-5b01-48d8-ae62-20f3e7931311).

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
