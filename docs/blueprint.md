# **App Name**: FatturaNow

## Core Features:

- Secure User Authentication: Simple email and password login system using Firebase Authentication for internal company access.
- Company & Client Management: Create, read, update, and delete company profile and client records, including required fiscal details for FatturaPA.
- Invoice Creation UI: User interface for creating new invoices with client selection, invoice date, automatic sequential numbering (e.g., 1/2026), item tables, and real-time calculation of line totals, subtotal, VAT, and grand total.
- FatturaPA XML Generation Tool: A Firebase Cloud Function that acts as a tool to generate a valid FatturaPA XML file, including all mandatory fields (seller/buyer data, invoice details, VAT breakdown) by interpreting and applying Italian fiscal rules, and saves it to Firebase Storage.
- Courtesy PDF Generation: A Firebase Cloud Function that generates a user-friendly PDF version of the invoice, displaying company info, client details, invoice items, and totals, then saves it to Firebase Storage.
- Invoice History Dashboard: A dashboard displaying key metrics like total invoices and revenue for the current year, a list of recent invoices, and options to download XML or PDF files, or to edit/duplicate existing invoices.
- Firestore Database Persistence: Firestore collections ('company', 'clients', 'invoices', 'invoice_items') storing all application data with security rules to ensure data isolation.

## Style Guidelines:

- Primary color: A deep, professional blue (#245CB3) conveying reliability and efficiency. This darker tone contrasts effectively with lighter content areas in a light scheme.
- Background color: A subtle, desaturated cool grey (#EFF3F7) derived from the primary blue's hue, providing a clean and understated canvas for application content.
- Accent color: A vibrant cyan-blue (#40C4E0) to highlight interactive elements and provide visual dynamism, ensuring clear distinction from primary and background tones.
- Headline and body font: 'Inter', a grotesque sans-serif, chosen for its modern, neutral, and highly readable qualities across various text sizes, ideal for data-heavy applications and professional content.
- Utilize a set of modern, clear, and functional line icons suitable for business applications, maintaining consistency with the application's clean aesthetic.
- Implement a clear and intuitive layout featuring a persistent sidebar for primary navigation and a main content area for dashboards, forms, and lists, as requested. Focus on consistent spacing and visual hierarchy.
- Incorporate subtle, tasteful animations for transitions between pages, form submissions, and data updates to enhance user feedback and overall interface fluidity without being distracting.