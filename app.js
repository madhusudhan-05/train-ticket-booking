const fs = require("fs");
const readLine = require("readline-sync");
const trains = JSON.parse(fs.readFileSync("trains.json", 'utf-8'));
//console.log(trains);

function MainMenu() {
    console.log(" --- Welcome to Train ticket Booking System --- ");
    console.log("1. Book Ticket");
    console.log("2. Cancel Ticket");
    console.log("3. Exit");
    const choice = readLine.question("Please select an option: ");
    switch (choice) {
        case '1': BookTicket();
            break;
        case '2': CancelTicket();
            break;
        case '3': console.log("Exiting....");
            process.exit();
        default: console.log("please choose valid option");
            MainMenu();
    }
}
MainMenu();

function getAllPlaces() {
    const allPlaces = new Set();
    trains.forEach(train => {
        allPlaces.add(train.source);
        allPlaces.add(train.destination);
        train.middleStops.forEach(stop => {
            allPlaces.add(stop);
        });
    });
    //console.log(allPlaces);
    return Array.from(allPlaces);
}

function getTrainsBetWeenStations(source, destination) {
    const variousTrains = trains.filter(train => {
        const stops = [train.source, ...train.middleStops, train.destination];
        return stops.includes(source) && stops.includes(destination);
    });
    //console.log(variousTrains);
    return variousTrains;
}

function generateBookingID() {
    return `PNR-${Date.now()}`;
}

function generatePassengerID(BookingID, passengerNumber) {
    return `${BookingID} - P${passengerNumber}`;
}

function updateSeats(train, source, destination, passengers) {
    const stops = [train.source, ...train.middleStops,train.destination];
    const start = stops.indexOf(source);
    const end = stops.indexOf(destination);
    for (let i = start; i < end; i++) {
        const part = `${stops[i]}-${stops[i + 1]}`;
        for (let passenger of passengers) {
            train.seats[part][passenger.seatClass]--;
        }
    }
    fs.writeFileSync('trains.json', JSON.stringify(trains, null, 2));
}

function updateSeatsOnCancel(train, source, destination, passengers) {
    const stops = [train.source, ...train.middleStops,train.destination];
    const start = stops.indexOf(source);
    const end = stops.indexOf(destination);
    for (let i = start; i < end; i++) {
        const part = `${stops[i]}-${stops[i + 1]}`;
        for (let passenger of passengers) {
            train.seats[part][passenger.seatClass]++;
        }
    }
    fs.writeFileSync('trains.json', JSON.stringify(trains, null, 2));
}

function saveBooking(bookingID, train, source, destination, passengers) {
    const booking = {
        BookingID: bookingID,
        Train_Name: train.trainName,
        Train_No: train.trainNo,
        Source: source,
        Destination: destination,
        Departure_Time:train.departureTime,
        Arrival_Time:train.arrivalTime,     
        passengers: passengers.map((passenger, i) => ({
            passengerID: generatePassengerID(bookingID, i + 1),
            ...passenger
        }))
    }
    fs.appendFileSync('bookings.txt', JSON.stringify(booking) + "\n");
}

function BookTicket() {
    console.log("--- Book Ticket ---");
    const allPlaces = getAllPlaces();
    console.log("Available Places : " + allPlaces.join(","));
    const source = readLine.question("Enter the source: ");
    if (!allPlaces.includes(source)) {
        console.log("please enter valid source");
        return BookTicket();
    }
    const destination = readLine.question("Enter the destination: ");
    if (!allPlaces.includes(destination)) {
        console.log("please enter valid source");
        return BookTicket();
    }
    if (source === destination) {
        console.log("source and destination cannot be same");
        return BookTicket();
    }
    const numPassengers = parseInt(readLine.question("Enter the number of passengers(max 10): "));
    if (isNaN(numPassengers) || numPassengers < 1 || numPassengers > 10) {
        console.log("Invalid number of passengers. Please try again");
        return BookTicket();
    }
    const availableTrains = getTrainsBetWeenStations(source, destination);
    if (availableTrains.length === 0) {
        console.log("No trains available for this route");
        return BookTicket();
    }
    console.log(" -- Available Trains --");
    availableTrains.forEach((train, index) => {
        console.log(`${index + 1} ${train.trainName} ${train.trainNo}`);
    });
    const trainIndex = parseInt(readLine.question("Please enter the choice for the train: ")) - 1;
    if (isNaN(trainIndex) || trainIndex < 0 || trainIndex > availableTrains.length) {
        console.log("Invalid train selection. Please try again.");
        return BookTicket();
    }
    const selectedTrain = availableTrains[trainIndex];
    const passengers = [];
    for (let i = 0; i < numPassengers; i++) {
        const name = readLine.question(`Enter name for Passenger ${i + 1}: `);
        if (!name) {
            console.log("Name cannot be empty");
            i--;
            continue;
        }
        const age = parseInt(readLine.question('Age: '));
        if (isNaN(age) || age < 1 || age > 130) {
            console.log('Invalid age. Please try again.');
            i--;
            continue;
        }
        const seatClass = readLine.question('Class (GEN, SL, AC): ');
        if (!['GEN', 'SL', 'AC'].includes(seatClass)) {
            console.log('Invalid class. Please try again.');
            i--;
            continue;
        }
        passengers.push({ name, age, seatClass });
    }
    const stops = [selectedTrain.source, ...selectedTrain.middleStops, selectedTrain.destination];
    const start = stops.indexOf(source);
    const end = stops.indexOf(destination);
    let seatsAvailable = true;
    for (let i = start; i < end; i++) {
        const part = `${stops[i]}-${stops[i + 1]}`;
        passengers.forEach(passenger => {
            console.log(selectedTrain.seats[part][passenger.seatClass]);
            if (selectedTrain.seats[part][passenger.seatClass] < 1) {
                seatsAvailable = false;
            }
        });
    }
    if (!seatsAvailable) {
        console.log('Seats not available. Please try again.');
        return BookTicket();
    }
    const bookingID = generateBookingID();
    const passengerIds = passengers.map((_, i) => generatePassengerID(bookingID, i + 1));
    updateSeats(selectedTrain, source, destination, passengers);
    saveBooking(bookingID, selectedTrain, source, destination, passengers);
    console.log('Booking successful!');
    console.log(`Booking ID: ${bookingID}`);
    console.log('Passenger IDs:', passengerIds.join(', '));
    MainMenu();
}

function CancelTicket(){
    console.log("--- Cancel Ticket ---");
    const bookingID = readLine.question("Enter BookindID: ");
    const bookings = fs.readFileSync('bookings.txt','utf-8').split('\n').filter(Boolean).map(JSON.parse);
    const booking = bookings.find(b => b.BookingID === bookingID);
    if(!booking){
        console.log("Booking not found");
        CancelTicket();
    }
    console.log("Passengers");
    booking.passengers.forEach((passenger,index) =>{
        console.log(`${index + 1}. ${passenger.name} (${passenger.passengerID})`);
    });
    const passengerIndices = readLine.question("Enter the passenger number to cancel(comma - separated): ").split(',').map(Number)
    .map(i => i-1);
    const invalidIndices = passengerIndices.filter(i => i < 0 || i >= booking.passengers.length);
    if(invalidIndices.length > 0){
        console.log("Invalid passenger selection. Please try again");
        return CancelTicket();
    }
    const confirm = readLine.question("Are you sure you want to cancel (yes/no): ");
    if (confirm !== 'yes') {
        console.log('Cancellation aborted.');
        return MainMenu();
    }
    const train = trains.find(t => t.trainNo === booking.Train_No);
    const cancelledPassengers = passengerIndices.map(i=> booking.passengers[i]);
    updateSeatsOnCancel(train, booking.Source, booking.Destination, cancelledPassengers);
    booking.passengers = booking.passengers.filter((_, i) => !passengerIndices.includes(i));
    fs.writeFileSync('bookings.txt', bookings.map(JSON.stringify).join('\n'));
    console.log('Cancellation successful.');
    MainMenu();
}

