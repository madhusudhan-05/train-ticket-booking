import { readFileSync, writeFileSync, appendFileSync } from "fs";
import { question } from "readline-sync";
const trains = JSON.parse(readFileSync("trains.json", "utf-8"));
let bookings = [];

function MainMenu() {
    console.log(" --- Welcome to Train Ticket Booking System --- ");
    console.log("1. Book Ticket");
    console.log("2. Cancel Ticket");
    console.log("3. Exit");
    const choice = question("Please select an option: ");
    switch (choice) {
        case "1":
            BookTicket();
            break;
        case "2":
            CancelTicket();
            break;
        case "3":
            console.log("Exiting....");
            process.exit();
        default:
            console.error("Please choose a valid option.");
            MainMenu();
    }
}

function getAllPlaces() {
    const allPlaces = new Set();
    trains.forEach((train) => {
        allPlaces.add(`${train.source.name} (${train.source.code})`);
        allPlaces.add(`${train.destination.name} (${train.destination.code})`);
        train.middleStops.forEach((stop) => {
            allPlaces.add(`${stop.name} (${stop.code})`);
        });
    });
    return Array.from(allPlaces);
}

function getTrainsBetweenStations(sourceCode, destinationCode) {
    return trains.filter((train) => {
        const stops = [
            train.source.code,
            ...train.middleStops.map((stop) => stop.code),
            train.destination.code,
        ];
        return (
            stops.includes(sourceCode) &&
            stops.includes(destinationCode) &&
            stops.indexOf(sourceCode) < stops.indexOf(destinationCode)
        );
    });
}

function calculateTotalDistance(train, sourceCode, destinationCode) {
    const stops = [
        train.source.code,
        ...train.middleStops.map((stop) => stop.code),
        train.destination.code,
    ];
    const start = stops.indexOf(sourceCode);
    const end = stops.indexOf(destinationCode);
    let totalDistance = 0;
    for (let i = start; i < end; i++) {
        const distance = train.distances[i];
        totalDistance += distance;
    }
    return totalDistance;
}

function calculateTotalFare(train, sourceCode, destinationCode, seatClass) {
    const totalDistance = calculateTotalDistance(train, sourceCode, destinationCode);
    const baseFare = train.fareStructure.baseFare[seatClass];
    const perKmFare = train.fareStructure.perKmFare[seatClass];
    return baseFare + totalDistance * perKmFare;
}

function generateBookingID() {
    return `${Date.now()}`;
}

function generatePassengerID(bookingID, passengerNumber) {
    return `${bookingID}-P${passengerNumber}`;
}

function checkSeatAvailability(train, sourceCode, destinationCode, seatClass) {
    const stops = [
        train.source.code,
        ...train.middleStops.map((stop) => stop.code),
        train.destination.code,
    ];
    const start = stops.indexOf(sourceCode);
    const end = stops.indexOf(destinationCode);
    const seatAvailability = train.seatAvailability[seatClass];
    let minSeats = Infinity;
    for (let i = start; i < end; i++) {
        if (seatAvailability[i] < minSeats) {
            minSeats = seatAvailability[i];
        }
    }
    return minSeats >= 1;
}

function updateSeats(train, sourceCode, destinationCode, passengers) {
    const stops = [
        train.source.code,
        ...train.middleStops.map((stop) => stop.code),
        train.destination.code,
    ];
    const start = stops.indexOf(sourceCode);
    const end = stops.indexOf(destinationCode);
    passengers.forEach((passenger) => {
        const seatAvailability = train.seatAvailability[passenger.seatClass];
        for (let i = start; i < end; i++) {
            seatAvailability[i] -= 1;
        }
    });
    writeFileSync("trains.json", JSON.stringify(trains, null, 2));
}

function updateSeatsOnCancel(train, sourceCode, destinationCode, passengers) {
    const stops = [
        train.source.code,
        ...train.middleStops.map((stop) => stop.code),
        train.destination.code,
    ];
    const start = stops.indexOf(sourceCode);
    const end = stops.indexOf(destinationCode);
    passengers.forEach((passenger) => {
        const seatAvailability = train.seatAvailability[passenger.seatClass];
        for (let i = start; i < end; i++) {
            seatAvailability[i] += 1;
        }
    });
    writeFileSync("trains.json", JSON.stringify(trains, null, 2));
}

function saveBooking(bookingID, train, sourceCode, destinationCode, passengers, totalFare, totalDistance) {
    const booking = {
        BookingID: bookingID,
        Train_Name: train.trainName,
        Train_No: train.trainNo,
        Source: sourceCode,
        Destination: destinationCode,
        Total_Distance: totalDistance,
        Total_Fare: totalFare,
        Departure_Time: train.segments.find((seg) => seg.from === sourceCode).departureTime,
        Arrival_Time: train.segments.find((seg) => seg.to === destinationCode).arrivalTime,
        passengers: passengers.map((passenger, i) => ({
            passengerID: generatePassengerID(bookingID, i + 1),
            ...passenger,
        })),
    };
    bookings.push(booking);
    appendFileSync("bookings.txt", JSON.stringify(booking) + "\n");
}

function BookTicket() {
    console.log("--- Book Ticket ---");
    const allPlaces = getAllPlaces();
    console.log("Available Places: " + allPlaces.join(", "));
    const sourceCode = question("Enter the source station code: ").toUpperCase();
    const destinationCode = question("Enter the destination station code: ").toUpperCase();

    if (!allPlaces.some((place) => place.includes(sourceCode))) {
        console.error("Invalid source station code. Please try again.");
        return BookTicket();
    }
    if (!allPlaces.some((place) => place.includes(destinationCode))) {
        console.error("Invalid destination station code. Please try again.");
        return BookTicket();
    }
    if (sourceCode === destinationCode) {
        console.error("Source and destination cannot be the same.");
        return BookTicket();
    }

    const numPassengers = parseInt(question("Enter the number of passengers (max 10): "));
    if (isNaN(numPassengers) || numPassengers < 1 || numPassengers > 10) {
        console.error("Invalid number of passengers. Please try again.");
        return BookTicket();
    }

    const availableTrains = getTrainsBetweenStations(sourceCode, destinationCode);
    if (availableTrains.length === 0) {
        console.error("No trains available for this route.");
        return BookTicket();
    }

    console.log(" -- Available Trains --");
    availableTrains.forEach((train) => {
        console.log(`${train.trainName} (${train.trainNo})`);
    });

    const trainNumber = parseInt(question("Enter the train number: "));
    const selectedTrain = availableTrains.find((train) => train.trainNo === trainNumber);
    if (!selectedTrain) {
        console.error("Invalid train number. Please try again.");
        return BookTicket();
    }

    const passengers = [];
    for (let i = 0; i < numPassengers; i++) {
        let name, age, seatClass;
        while (true) {
            name = question(`Enter name for Passenger ${i + 1}: `).trim();
            if (name === "") {
                console.error("Name cannot be empty. Please try again.");
            } 
            else {
                break;
            }
        }
        while (true) {
            age = parseInt(question("Age: "));
            if (isNaN(age) || age < 1 || age > 120) {
                console.error("Invalid age. Please enter a number between 1 and 120.");
            } 
            else {
                break;
            }
        }
        while (true) {
            seatClass = question("Class (GEN, SL, AC): ").toUpperCase().trim();
            if (!["GEN", "SL", "AC"].includes(seatClass)) {
                console.error("Invalid class. Please enter GEN, SL, or AC.");
            } 
            else {
                break;
            }
        }
        passengers.push({ name, age, seatClass });
    }
    const seatsAvailable = passengers.every((passenger) => {
        return checkSeatAvailability(selectedTrain, sourceCode, destinationCode, passenger.seatClass);
    });

    if (!seatsAvailable) {
        console.error("Seats not available. Please try again.");
        return BookTicket();
    }

    const totalDistance = calculateTotalDistance(selectedTrain, sourceCode, destinationCode);
    const totalFare = passengers.reduce((sum, passenger) => {
        return sum + calculateTotalFare(selectedTrain, sourceCode, destinationCode, passenger.seatClass);
    }, 0);

    console.log("\n--- Booking Details ---");
    console.log(`Train: ${selectedTrain.trainName} (${selectedTrain.trainNo})`);
    console.log(`Source: ${sourceCode}, Destination: ${destinationCode}`);
    console.log(`Total Distance: ${totalDistance} km`);
    console.log(`Total Fare: ₹${totalFare}`);

    const confirm = question("Confirm booking (yes/no): ").toLowerCase();
    if (confirm !== "yes") {
        console.error("Booking cancelled.");
        return MainMenu();
    }

    const bookingID = generateBookingID();
    updateSeats(selectedTrain, sourceCode, destinationCode, passengers);
    saveBooking(bookingID, selectedTrain, sourceCode, destinationCode, passengers, totalFare, totalDistance);
    console.log("\n--- Booking Successful ---");
    console.log(`Booking ID: ${bookingID}`);
    console.log(`Train: ${selectedTrain.trainName} (${selectedTrain.trainNo})`);
    console.log(`Source: ${sourceCode}, Destination: ${destinationCode}`);
    console.log(`Total Distance: ${totalDistance} km`);
    console.log(`Total Fare: ₹${totalFare}`);
    console.log("Passenger IDs:", passengers.map((_, i) => generatePassengerID(bookingID, i + 1)).join(", "));
    console.log("Departure Time: "+ selectedTrain.segments.find((seg) => seg.from === sourceCode).departureTime);
    console.log("Arrival Time: "+ selectedTrain.segments.find((seg) => seg.to === destinationCode).arrivalTime);
    MainMenu();
}

function CancelTicket() {
    console.log("--- Cancel Ticket ---");
    const bookingID = question("Enter Booking ID: ");
    const booking = bookings.find((b) => b.BookingID === bookingID);
    if (!booking) {
        console.error("Booking not found.");
        return CancelTicket();
    }
    console.log("Passengers:");
    booking.passengers.forEach((passenger, index) => {
        console.log(`${index + 1}. ${passenger.name} (${passenger.passengerID})`);
    });
    const passengerIndices = question("Enter the passenger number to cancel (comma-separated): ")
        .split(",")
        .map(Number)
        .map((i) => i - 1);
    const invalidIndices = passengerIndices.filter((i) => i < 0 || i >= booking.passengers.length);
    if (invalidIndices.length > 0) {
        console.error("Invalid passenger selection. Please try again.");
        return CancelTicket();
    }

    const confirm = question("Are you sure you want to cancel (yes/no): ");
    if (confirm !== "yes") {
        console.error("Cancellation aborted.");
        return MainMenu();
    }

    const train = trains.find((t) => t.trainNo === booking.Train_No);
    const cancelledPassengers = passengerIndices.map((i) => booking.passengers[i]);
    updateSeatsOnCancel(train, booking.Source, booking.Destination, cancelledPassengers);
    booking.passengers = booking.passengers.filter((_, i) => !passengerIndices.includes(i));
    writeFileSync("bookings.txt", bookings.map(JSON.stringify).join("\n"));
    console.log("Cancellation successful.");
    MainMenu();
}

MainMenu();