function convertFromDateInt(date) {

    // Make sure an integer was passed in
    if (typeof date !== "number") {
        return undefined;
    }

    current_date = new Date(date)

    const year = current_date.getFullYear();
    const month = current_date.getMonth() + 1;
    const dayOfMonth = current_date.getDate();
    const hours = current_date.getHours();
    const minutes = current_date.getMinutes();
    const seconds = current_date.getSeconds();
    const dayOfWeek = current_date.getDay() + 1;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    return {'year' : year,
            'monthNumber' : month,
            'monthString' : months[month - 1],
            'dayOfMonth' : dayOfMonth,
            'dayOfWeekNumber' : dayOfWeek,
            'dayOfWeekString' : days[dayOfWeek - 1],
            'hours' : hours > 12 ? hours - 12 : hours,
            'militaryHours' : hours,
            'minutes' : minutes,
            'seconds' : seconds,
            'shortDate' : month.toString() + "/" + dayOfMonth.toString() + "/" + year.toString()};
}