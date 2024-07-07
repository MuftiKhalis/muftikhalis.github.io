function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    var main = document.querySelector("main");
    sidebar.classList.toggle("open");
    main.classList.toggle("shift");
}

// Calculator Script
let display = document.getElementById('calc-display');

function appendToDisplay(value) {
    display.value += value;
}

function clearDisplay() {
    display.value = '';
}

function calculateResult() {
    try {
        display.value = eval(display.value);
    } catch (e) {
        display.value = 'Error';
    }
}

// Calendar Script
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let currentDate = new Date();

function renderCalendar() {
    const daysElement = document.getElementById('days');
    const monthYearElement = document.getElementById('monthYear');
    daysElement.innerHTML = '';

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    monthYearElement.innerHTML = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        daysElement.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.innerHTML = day;
        daysElement.appendChild(dayDiv);
    }
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

document.addEventListener('DOMContentLoaded', renderCalendar);
