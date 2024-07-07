function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (sidebar.style.width === "250px") {
        sidebar.style.width = "0";
    } else {
        sidebar.style.width = "250px";
    }
}

function appendToDisplay(value) {
    document.getElementById('calc-display').value += value;
}

function clearDisplay() {
    document.getElementById('calc-display').value = '';
}

function calculateResult() {
    try {
        document.getElementById('calc-display').value = eval(document.getElementById('calc-display').value);
    } catch {
        document.getElementById('calc-display').value = 'Error';
    }
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function showCalendar(month, year) {
    const firstDay = (new Date(year, month)).getDay();
    const daysInMonth = 32 - new Date(year, month, 32).getDate();

    const monthYear = document.getElementById("monthYear");
    monthYear.innerHTML = `${year} ${month + 1}`;

    const daysElement = document.getElementById("days");
    daysElement.innerHTML = "";

    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement("div");
        daysElement.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.innerHTML = day;
        daysElement.appendChild(cell);
    }
}

function prevMonth() {
    currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    currentYear = (currentMonth === 11) ? currentYear - 1 : currentYear;
    showCalendar(currentMonth, currentYear);
}

function nextMonth() {
    currentMonth = (currentMonth === 11) ? 0 : currentMonth + 1;
    currentYear = (currentMonth === 0) ? currentYear + 1 : currentYear;
    showCalendar(currentMonth, currentYear);
}

document.addEventListener("DOMContentLoaded", () => {
    showCalendar(currentMonth, currentYear);
});
