# Shipping Time Estimator - Project Proposal

## Team
- Team Lead: Chaoyi Jiang
- Team Members: Chaoyi Jiang, Mandadi Ayush Reddy, Yongzhen Zhang

## Project Goal
We are building a system that determines optimal "reminder days" for Quill & Pigeon customers（Hypothetical Customer） to send greeting cards in time for events. The system will factor in delivery routes, lead times, and shipping types to ensure timely delivery, whether cards are shipped directly to the recipient or to the customer for later distribution. This will enhance customer experience by automating the calculation of ideal purchase dates for smooth, on-time deliveries.

## User Stories

### Customer User Story
As a Quill & Pigeon customer, I want to:
- Enter an event date and recipient address, so I can determine when to order/send a card
- See shipping estimates based on different shipping methods (standard, priority, etc.)
- Receive a clear "order by" date that accounts for processing time and shipping duration
- Toggle between shipping directly to recipient or to myself first
- Save frequent recipients' addresses to streamline future orders

### Admin User Story
As a Quill & Pigeon administrator, I want to:
- Configure and update default processing times for different card types
- View analytics on shipping calculations and timelines across regions
- Manually override shipping estimates during peak seasons or postal service disruptions
- Add new shipping carriers and options as they become available
- Export shipping timeline data for business reporting

## UI Design

### Main Components
1. **Customer-Facing Interface**
   - Event Date Input: Calendar selector with validation
   - Address Form: Fields for recipient and sender addresses
   - Shipping Options: Radio buttons/dropdown for shipping methods
   - Destination Toggle: Switch between "Ship to Recipient" and "Ship to Me"
   - Results Display: Clear visual showing order deadline and estimated arrival

2. **Admin Dashboard**
   - Configuration Panel: Form for updating processing times and shipping parameters
   - Analytics View: Charts showing shipping time distributions by region
   - Override Controls: Interface for temporary shipping estimate adjustments
   - Carrier Management: Form to add/edit available shipping carriers

### Figma
- Homepage with event date input and shipping calculator
- Results page showing timeline visualization
- Admin dashboard with configuration options
- Shipping override page

## Project Requirements

### Back End
- Node.js with Express.js to create a RESTful API service
- AWS Lambda function for serverless deployment option
- PostgreSQL database to store:
  - Shipping time data by region and shipping method
  - User preferences and saved addresses
  - Holiday/peak season adjustments
  - Historical shipping time data for analytics
- Authentication and authorization system for admin users

### Web API
- RESTful API endpoints will include:
  - `GET /shipping-estimate`: Calculate shipping time based on origin, destination, and method
  - `GET /carriers`: Retrieve available shipping carriers and methods
  - `POST /saved-addresses`: Save a recipient address for future use
  - `GET /processing-times`: Retrieve current processing times for different card types
  - `PUT /admin/processing-times`: Update processing time configuration (admin only)
  - `PUT /admin/shipping-overrides`: Set temporary shipping time overrides (admin only)

### Data
- Integration with logistics company's API (https://goshippo.com/) for accurate transit time predictions
- Local caching of common shipping routes and times to reduce API calls
- Historical tracking of actual vs. estimated delivery times to improve future estimates
- Storage of user-specific preferences and frequently used addresses (with proper data security)
- Reference data for holiday schedules that may impact shipping times

### User/Admin Views
- **User Views**:
  - Shipping calculator with intuitive interface for entering event dates and addresses
  - Visual timeline showing order deadline, processing time, and estimated delivery
  - Address book for saved shipping addresses
  - Order history with past shipping estimates and actual delivery dates

- **Admin Views**:
  - Dashboard with analytics on shipping estimates and actuals
  - Configuration panel for system-wide settings
  - Shipping override controls for holidays and peak seasons
  - User management for administrators
  - Logging and monitoring of API calls and system performance

### Technical Approach
The application will use a modern JavaScript stack:
- JavaScript/TypeScript for both front and back end development
- React for the front-end user interface
- Node.js and Express for the API server
- PostgreSQL for data persistence
- AWS services (Lambda, API Gateway, S3) for deployment
- Jest for testing automation
- GitHub Actions for CI/CD pipeline

