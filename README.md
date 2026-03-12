# Property Management App

A comprehensive property management application built with React, TypeScript, and TailwindCSS to track cash flow for rental properties.

## Features

- **Property Management**: Add and manage multiple rental properties with purchase price and monthly rent details
- **Cash Flow Tracking**: Automatically calculate monthly and yearly cash flow for each property
- **Transaction Management**: Record income and expenses with categories
- **Dashboard Analytics**: View comprehensive cash flow summaries and ROI calculations
- **Data Persistence**: All data saved locally in browser storage

## Key Components

- **Dashboard**: Overview of all properties with total income, expenses, net cash flow, and ROI
- **Properties**: Add new properties and view existing property details
- **Transactions**: Record and categorize income/expenses for each property

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application

## Usage

1. **Add Properties**: Navigate to the Properties tab and add your rental properties with purchase price and monthly rent
2. **Record Transactions**: Use the Transactions tab to record income and expenses
3. **View Analytics**: Check the Dashboard for cash flow summaries and ROI calculations

## Data Model

### Property
- Name and address
- Purchase price
- Monthly rent
- Creation and update timestamps

### Transaction
- Property association
- Type (income/expense)
- Category (rent, maintenance, insurance, etc.)
- Amount and description
- Date

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **LocalStorage** - Data persistence
