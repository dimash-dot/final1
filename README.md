Portfolio Management System

Overview
This project is a Portfolio Management System that allows administrators and editors to create, update, delete, and display portfolio items. The system includes authentication and role-based access control, ensuring that only authorized users (admin and editor) can modify the portfolio content.

Table of Contents
Setup Instructions
API Details
Design Rationale
Two-Factor Authentication (2FA)


Install Dependencies
Install the necessary packages using npm:
npm install

Set Up Environment Variables
Create a .env file in the root directory and add the following environment variables:

EMAIL_USER=your-email@gmail.com        # Email address used for sending notifications
EMAIL_PASS=your-email-password         # Email password or app password if 2FA is enabled
NOTIFY_EMAIL=admin-email@example.com   # Email to receive notifications (can be admin's email)
MONGO_URI=mongodb://localhost:27017/portfolio
JWT_SECRET=your-secret-key            # Secret key for JWT authentication

Note: If you're using Google Gmail, you might need to create an app-specific password for security reasons if 2FA is enabled.

Set Up MongoDB
Ensure MongoDB is installed and running locally or use a cloud-based service like MongoDB Atlas. Update the MONGO_URI in the .env file with your MongoDB connection string.

Run the Server
Start the server using:

npm start
The server will be running on http://localhost:3000 by default.


API Details
The system provides the following endpoints for managing portfolio items:

1. Create Portfolio Item
   Endpoint: POST /api/portfolio/create
   Access Control: Admin, Editor
   Body:
   json

{
"title": "Project Title",
"description": "Project description.",
"images": ["image1.jpg", "image2.jpg"]
}

Response:
{
"message": "Portfolio item created successfully",
"portfolioItem": {
"id": "123",
"title": "Project Title",
"description": "Project description.",
"images": ["image1.jpg", "image2.jpg"]
}
}

Edit Portfolio Item
Endpoint: PUT /api/portfolio/edit/:id
Access Control: Admin
Body:
json
{
"title": "Updated Project Title",
"description": "Updated description.",
"images": ["image1.jpg", "image2.jpg"]
}
Delete Portfolio Item
Endpoint: DELETE /api/portfolio/delete/:id
Access Control: Admin
Response:
{
"message": "Portfolio item deleted successfully"
}

Get All Portfolio Items
Endpoint: GET /api/portfolio

Response:
{
"portfolioItems": [
{
"id": "123",
"title": "Project Title",
"description": "Project description.",
"images": ["image1.jpg", "image2.jpg"]
},
{
"id": "124",
"title": "Another Project Title",
"description": "Another project description.",
"images": ["image3.jpg"]
}
]
}

Design Rationale
The Portfolio Management System is designed to be a simple, intuitive platform with the following key features:

Role-based Access Control
Admin: Full access to all operations (create, edit, delete).
Editor: Can create and update portfolio items but cannot delete items.
User: Can view the portfolio items but cannot make changes.
This system ensures that only authorized users (admins and editors) can modify content while allowing everyone to view the portfolio.

Nodemailer for Notifications
Whenever a portfolio item is created or updated, an email notification is sent to the admin using Nodemailer. This ensures that admins are always informed about changes in the system.

MongoDB for Data Storage
MongoDB is used to store portfolio items. This NoSQL database provides flexibility in storing and retrieving data, and it scales well for this type of application.

Carousel for Portfolio Images
Bootstrap's carousel component is used to display portfolio images. This provides an interactive and visually appealing way to showcase multiple images for each project.

Two-Factor Authentication (2FA)
To increase the security of the application, we recommend implementing Two-Factor Authentication (2FA) for the login process.

Setting Up 2FA
If using Google Authenticator or another TOTP-based app for 2FA, you will need to:

Install a 2FA library like speakeasy for generating and verifying tokens.
npm install speakeasy
Generate a secret key for each user (when they first register or update their profile).

Example of generating a secret key:
const speakeasy = require('speakeasy');
const secret = speakeasy.generateSecret({ length: 20 });
console.log(secret.base32); // This is the secret key that you will use for 2FA

Save the secret key for each user in your database.

Verify the token during login.
Example of verifying the 2FA token:
const isVerified = speakeasy.totp.verify({
secret: user.twofaSecret,  // User's saved secret key
encoding: 'base32',
token: userEnteredToken  // Token entered by the user
});

if (isVerified) {
console.log('2FA token is valid');
} else {
console.log('Invalid 2FA token');
}
Note: If you’re using a service like Google Authenticator, the user will scan a QR code generated from the secret key to set up 2FA on their device.
