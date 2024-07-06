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
