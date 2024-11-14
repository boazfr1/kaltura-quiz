const fs = require("fs");
const { parse } = require("csv-parse");
const express = require('express');
const app = express();
const port = 3000;

let daysInMonth = {
    "01": 31,
    "02": 28,
    "03": 31,
    "04": 30,
    "05": 31,
    "06": 30,
    "07": 31,
    "08": 31,
    "09": 30,
    "10": 31,
    "11": 30,
    "12": 31
};

app.get('/info/:date', async (req, res) => {
    const date = req.params.date;  // Extract the date parameter from the URL
    try {
        const result = await getRevenueAndUnreservedCapacity("./DataFile.csv", date);
        res.send(result);
    } catch (error) {
        res.status(500).send("Error processing request");
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

const getRevenueAndUnreservedCapacity = (filePath, date) => {
    return new Promise((resolve, reject) => {
        let CSVInfo = [];
        fs.createReadStream(filePath)
            .pipe(parse({ delimiter: ",", from_line: 2 }))
            .on("data", (row) => {
                CSVInfo.push(row.map(item => item.trim()));
            })
            .on("end", () => {
                let revenue = calculateRevenue(CSVInfo, date);
                let unreservedCapacity = calculateUnreservedCapacity(CSVInfo, date);
                const result = `${date}: expected revenue: ${revenue} expected total capacity of the unreserved offices: ${unreservedCapacity}`;
                resolve(result);  // Resolve the promise with the result
            })
            .on("error", (error) => {
                console.error(error.message);
                reject(error);  // Reject the promise on error
            });
    });
};

const calculateRevenue = (CSVInfo, date) => {
    const month = date.slice(5, 7);
    const year = date.slice(0, 4);
    const daysInCurrentMonth = daysInMonth[month];
    let totalRevenue = 0;

    CSVInfo.forEach(info => {
        let [capacity, monthlyPrice, startDay, endDay] = info;
        monthlyPrice = Number(monthlyPrice);

        const startDate = new Date(startDay);
        const endDate = endDay ? new Date(endDay) : null;
        const targetMonthStart = new Date(year, month - 1, 1);
        const targetMonthEnd = new Date(year, month - 1, daysInCurrentMonth);

        if (startDate <= targetMonthEnd && (!endDate || endDate >= targetMonthStart)) {
            const start = startDate < targetMonthStart ? 1 : startDate.getDate();
            const end = (!endDate || endDate > targetMonthEnd) ? daysInCurrentMonth : endDate.getDate();
            const daysReserved = end - start + 1;
            const dailyRate = monthlyPrice / daysInCurrentMonth;

            totalRevenue += daysReserved * dailyRate;
        }
    });

    return totalRevenue;
};

const calculateUnreservedCapacity = (CSVInfo, date) => {
    const month = date.slice(5, 7);
    const year = date.slice(0, 4);
    const targetMonthStart = new Date(year, month - 1, 1);
    const targetMonthEnd = new Date(year, month - 1, daysInMonth[month]);

    let totalCapacity = 0;

    CSVInfo.forEach(info => {
        let [capacity, , startDay, endDay] = info;
        capacity = Number(capacity);

        const startDate = new Date(startDay);
        const endDate = endDay ? new Date(endDay) : null;

        if (!(startDate <= targetMonthEnd && (!endDate || endDate >= targetMonthStart))) {
            totalCapacity += capacity;
        }
    });

    return totalCapacity;
};
