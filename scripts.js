function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    var hamburger = document.querySelector(".hamburger");
    sidebar.classList.toggle("open");
    hamburger.classList.toggle("change");
}

function appendToDisplay(value) {
    document.getElementById("calc-display").value += value;
}

function clearDisplay() {
    document.getElementById("calc-display").value = "";
}

function calculateResult() {
    try {
        document.getElementById("calc-display").value = eval(document.getElementById("calc-display").value);
    } catch (e) {
        document.getElementById("calc-display").value = "Error";
    }
}

// Calendar functionality
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const monthYear = document.getElementById("monthYear");
const daysContainer = document.getElementById("days");

const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
];

function renderCalendar(month, year) {
    if (monthYear && daysContainer) {
        monthYear.innerHTML = `${months[month]} ${year}`;
        daysContainer.innerHTML = "";

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = 32 - new Date(year, month, 32).getDate();

        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement("div");
            daysContainer.appendChild(emptyDiv);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement("div");
            dayDiv.innerHTML = i;
            daysContainer.appendChild(dayDiv);
        }
    }
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("monthYear")) {
        renderCalendar(currentMonth, currentYear);
    }
});
