document.addEventListener("DOMContentLoaded", () => {
    const posts = document.querySelectorAll('.post');
    posts.forEach(post => {
        post.addEventListener('mouseover', () => {
            post.style.backgroundColor = '#ffd1dc';
        });
        post.addEventListener('mouseout', () => {
            post.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        });
    });
});

// JavaScript for Complex Calculator functionality
const calcDisplay = document.getElementById('calc-display');

function appendToDisplay(value) {
    calcDisplay.value += value;
}

function clearDisplay() {
    calcDisplay.value = '';
}

function calculateResult() {
    try {
        let result = eval(calcDisplay.value);
        calcDisplay.value = result;
    } catch (error) {
        calcDisplay.value = 'Error';
    }
}

// Listen for Enter key press to calculate result
calcDisplay.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        calculateResult();
    }
});

function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    var hamburger = document.querySelector(".hamburger");
    sidebar.style.width = sidebar.style.width === "250px" ? "0" : "250px";
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

// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    }
}

// Load the saved theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
    } else {
        document.body.classList.add('light-theme');
    }
});

// Save the current theme on change
document.body.classList.add('light-theme');
document.body.addEventListener('classchange', () => {
    const theme = document.body.classList.contains('light-theme') ? 'light-theme' : 'dark-theme';
    localStorage.setItem('theme', theme);
});
