# Namaank

Complete and modify my existing “Namaank” project with the following system. Keep the UI clean, modern, responsive and mobile-friendly. Remove the “My Account” option from the top-right corner.



USER SYSTEM



1. User signup/login with all required personal details.

2. During signup, Subadmin Referral Code is mandatory.

3. Every Subadmin’s unique username will automatically work as their Referral Code.

4. After entering a valid referral code, the user is permanently assigned to that Subadmin.

5. Subadmin gets a notification whenever a new user joins through their referral code.

6. User dashboard must show:

   - Short Report PDF

   - Full Report PDF

   - Payment status

   - Assigned Subadmin

   - Telegram support



SUBADMIN SYSTEM



Create a separate Subadmin Signup/Login page.



Required signup fields:



- Name

- Unique Username

- Mobile Number

- Service Type

- Location

- Email

- Facebook ID/Page Link

- Instagram ID/Page Link



Username must be globally unique among all Subadmins and automatically become the referral code.



YouTube Channel will belong to the company, and only Superadmin can configure/change the company YouTube channel.



Each Subadmin dashboard should have:



- Users assigned through referral code

- User notifications

- Social media links

- Short/Full report management

- Payment amount/settings

- Telegram Bot link

- Payment records

- User communication/status



REPORT ACCESS



There are two PDF reports:



Short Report:

User must complete the required Subadmin social-media actions (Like/Follow + Share as configured) before the Short Report becomes accessible.



Full Report:

User must make the payment according to the amount/payment type configured by the assigned Subadmin.



Do not expose the protected report before the required condition/payment is successfully verified.



PAYMENT SYSTEM



Build a flexible payment architecture where:



- Superadmin can configure payment methods/gateways.

- Subadmin can configure their own report pricing within Superadmin-defined limits.

- Different payment types/amounts can be configured.

- User payment status must automatically update after successful payment.

- Keep the payment gateway integration modular so additional gateways can easily be added later.

- Maintain complete payment transaction/history records for User, Subadmin and Superadmin.



TELEGRAM SUPPORT



After successful Full Report payment:



- Generate/show the assigned Subadmin’s Telegram Bot/support link.

- The user should receive the Telegram Bot link through the configured communication flow.

- User can use the Subadmin’s Telegram Bot to send queries and communicate with the assigned Subadmin.

- Each user must remain connected to their assigned Subadmin.

- Never expose another Subadmin’s users or conversations.



SUPERADMIN SYSTEM



Create a separate Superadmin Login/Dashboard.



Superadmin can:



- Add, edit, activate/deactivate Subadmins

- View all Subadmins

- View all Users

- View referral assignments

- View payment/transaction records

- Configure company YouTube channel

- Configure available payment gateways

- Set global pricing limits/rules

- Manage Subadmin permissions

- Manage social-media requirements

- Manage Telegram Bot/support configuration

- View system notifications and reports



When viewing Subadmins, display information in this exact sequence:



Name → Username → Mobile Number → Service Type → Location → Email



USER → SUBADMIN → SUPERADMIN HIERARCHY



Implement the system hierarchy exactly as:



User → Assigned Subadmin → Superadmin



A user can belong to only one Subadmin unless Superadmin changes the assignment.



SECURITY & VALIDATION



- Unique username validation in real time.

- Mandatory referral-code validation during user signup.

- Role-based authentication and authorization.

- Users cannot access Superadmin/Subadmin data.

- Subadmins can only see their own assigned users.

- Secure payment verification.

- Protect private PDFs and Telegram/user data.

- Add proper form validation and error/success messages.



UI



Keep the existing Namaank branding/design where possible. Make all pages responsive for mobile and desktop.



Required pages:



- User Signup/Login

- User Dashboard

- Subadmin Signup/Login

- Subadmin Dashboard

- Superadmin Login

- Superadmin Dashboard

- Payment Page

- Report Access/Download Page

- Telegram Support section



Important: Do not just create mock buttons. Implement the actual database relationships, authentication, referral-code assignment, role permissions, payment-status logic and report-access logic. Structure the code so payment gateways, Telegram integration and future social-media verification APIs can be added easily.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://namaankfinal.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9271daa3-96f9-4c0b-bf2f-51039425f3c8).

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
