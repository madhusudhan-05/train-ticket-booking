# Train Ticket Booking System

## Introduction
The Train Ticket Booking System is a console-based application built using JavaScript that allows users to book and cancel train tickets. It reads train data from a JSON file and maintains bookings in a text file.

## Features
- Book train tickets
- Cancel booked tickets
- Calculate fare dynamically based on distance and class
- Check seat availability before booking
- Store bookings persistently in a text file

## Installation
1. Ensure you have **Node.js** installed on your system.
2. Clone this repository or copy the project files.
3. Install dependencies (npm install).

## Usage
1. Run the application using:
   ```sh
   node train.js
   ```
2. Follow the prompts to book or cancel a ticket.
3. Train details are read from `trains.json`.
4. Bookings are stored in `bookings.txt`.

## Files and Structure
- `train.js`: Main script for running the application.
- `trains.json`: Contains train data (routes, fare, seat availability, etc.).
- `bookings.txt`: Stores user booking records.

## Booking Process
1. Choose the **Book Ticket** option.
2. Enter **source** and **destination** station codes.
3. Select an available train.
4. Enter passenger details (name, age, class).
5. Confirm the booking.
6. If seats are available, a booking ID is generated, and ticket details are displayed.

## Cancellation Process
1. Choose the **Cancel Ticket** option.
2. Enter the **Booking ID**.
3. Select passengers to cancel.
4. Confirm cancellation.
5. Seats are updated accordingly.

## Data Structure
- `trains.json` contains:
  - Train details (number, name, source, destination, stops, etc.)
  - Seat availability array for each class
  - Fare structure (base fare and per km fare for each class)
  - Segment details (departure & arrival times)
  
- Booking records include:
  - Unique **Booking ID**
  - Train details
  - Passenger details
  - Total fare and distance

## License
This project is open-source and free to use.

