const holidays = [
	"2025-01-01",
	"2025-01-20", // Birthday of Martin Luther King, Jr.
	"2025-02-17", // Washington's Birthday
	"2025-05-26", // Memorial Day
	"2025-06-19", // Juneteenth
	"2025-07-04", // Independence Day
	"2025-09-01", // Labor Day
	"2025-10-13", // Columbus Day/Indigenous Peoples' Day
	"2025-11-11", // Veterans Day
	"2025-11-27", // Thanksgiving Day
	"2025-12-25", // Christmas Day
];

function isHoliday(date) {
	return holidays.includes(date.toISOString().split("T")[0]);
}

function isWeekend(date) {
	const day = date.getDay();
	return day === 0 || day === 6;
}

function addBusinessDays(date, days) {
	let currentDate = new Date(date);
	let addedDays = 0;

	while (addedDays < days) {
		currentDate.setSate(currentDaye.getDate() + 1);
		if (!isWeekend(currentDate) && !isHoliday(currentDate)) {
			addedDays++;
		}
	}
	return currentDate;
}

export { isHoliday, isWeekend, addBusinessDays };
