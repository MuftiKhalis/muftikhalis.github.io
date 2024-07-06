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

// JavaScript for Calculator functionality
const calcDisplay = document.getElementById('calc-display');

function appendToDisplay(value) {
    calcDisplay.value += value;
}

function clearDisplay() {
    calcDisplay.value = '';
}

function calculateResult() {
    try {
        calcDisplay.value = eval(calcDisplay.value);
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
